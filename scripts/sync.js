#!/usr/bin/env node
/**
 * 规则同步脚本（交互式）
 *
 * 模型：
 *   - 源：rules/global/ 下的 NN-name.md 多文件
 *   - single 目标：按 NN- 顺序拼接为一个文件，写到指定路径
 *   - multi  目标：把多文件原样复制到指定目录（Trae）
 *
 * 用法：
 *   node scripts/sync.js            # 交互式菜单
 *   node scripts/sync.js --dry      # 预演，不写入
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

// ============ 枚举 / 常量 ============

const TargetScope = Object.freeze({
  SINGLE: 'single',
  MULTI: 'multi',
});

const CliFlag = Object.freeze({
  DRY_RUN: '--dry',
});

const ExitCode = Object.freeze({
  SUCCESS: 0,
  CONFIG_ERROR: 1,
  USER_ABORT: 3,
});

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(PROJECT_ROOT, 'sync.config.json');

// 规则文件命名约定：两位数字前缀 + 短横线 + 名称 + .md
// 用于：从源目录筛选有效规则文件 / 在目标目录清理同模式旧文件（不误伤其他文件）
const RULE_FILE_PATTERN = /^\d{2}-[\w-]+\.md$/;

// 规则文件中可能引用本仓库内的资源（如平台规则路径），用占位符在分发时替换为实际绝对路径
// 这样下游工具读到的是真实可用的路径，而不是硬编码到某个用户机器上的路径
const TEMPLATE_VARS = Object.freeze({
  AI_RULES_REPO: PROJECT_ROOT,
});

// ============ 日志 ============

const logger = {
  info: (msg) => console.log(`[INFO]  ${msg}`),
  warn: (msg) => console.warn(`[WARN]  ${msg}`),
  error: (msg) => console.error(`[ERROR] ${msg}`),
  ok: (msg) => console.log(`[OK]    ${msg}`),
  plain: (msg) => console.log(msg),
};

// ============ 配置与源 ============

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`配置文件不存在: ${CONFIG_PATH}`);
  }
  const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
  let config;
  try {
    config = JSON.parse(raw);
  } catch (err) {
    throw new Error(`配置文件 JSON 解析失败: ${err.message}`);
  }
  if (!config.source || !Array.isArray(config.targets) || config.targets.length === 0) {
    throw new Error('配置文件缺少 source 或 targets');
  }
  return config;
}

function listSourceFiles(sourceDir) {
  const abs = path.resolve(PROJECT_ROOT, sourceDir);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
    throw new Error(`源目录不存在或不是目录: ${abs}`);
  }
  const names = fs
    .readdirSync(abs)
    .filter((f) => RULE_FILE_PATTERN.test(f))
    .sort();
  if (names.length === 0) {
    throw new Error(`源目录中没有规则文件 (期望命名: NN-name.md): ${abs}`);
  }
  return names.map((name) => ({ name, absPath: path.join(abs, name) }));
}

// ============ 文件系统工具 ============

function expandHome(rawPath) {
  if (!rawPath) return rawPath;
  if (rawPath.startsWith('~')) {
    return path.join(os.homedir(), rawPath.slice(1));
  }
  return rawPath;
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function renderTemplate(content) {
  let rendered = content;
  for (const [key, value] of Object.entries(TEMPLATE_VARS)) {
    rendered = rendered.split(`\${${key}}`).join(value);
  }
  return rendered;
}

function readRendered({ absPath }) {
  return renderTemplate(fs.readFileSync(absPath, 'utf-8'));
}

/**
 * 删除目标目录下匹配规则文件命名模式的旧文件，避免源端删除文件后下游残留
 * 不影响目标目录里其他用户文件
 */
function clearStaleRuleFiles(dir) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    if (RULE_FILE_PATTERN.test(name)) {
      fs.unlinkSync(path.join(dir, name));
    }
  }
}

// ============ 交互 ============

function createPrompt() {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}

function askQuestion(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

function parseSelection(input, totalCount) {
  const trimmed = input.trim().toLowerCase();
  if (trimmed === 'q' || trimmed === 'quit' || trimmed === 'exit') return null;
  if (trimmed === 'a' || trimmed === 'all' || trimmed === '') {
    return Array.from({ length: totalCount }, (_, i) => i);
  }
  const selected = new Set();
  const invalid = [];
  const tokens = trimmed.split(/[\s,]+/).filter(Boolean);
  for (const token of tokens) {
    if (token.includes('-')) {
      const [start, end] = token.split('-').map((n) => parseInt(n, 10));
      if (Number.isNaN(start) || Number.isNaN(end)) {
        invalid.push(token);
        continue;
      }
      for (let i = start; i <= end; i += 1) {
        if (i >= 1 && i <= totalCount) selected.add(i - 1);
      }
    } else {
      const idx = parseInt(token, 10);
      if (Number.isNaN(idx) || idx < 1 || idx > totalCount) {
        invalid.push(token);
      } else {
        selected.add(idx - 1);
      }
    }
  }
  if (invalid.length > 0) {
    logger.warn(`忽略无效输入: ${invalid.join(', ')}`);
  }
  return Array.from(selected).sort((a, b) => a - b);
}

function describeScope(target) {
  switch (target.scope) {
    case TargetScope.SINGLE:
      return `[单文件 → ${target.output}]`;
    case TargetScope.MULTI:
      return `[多文件 → ${target.output}/]`;
    default:
      return '[未知作用域]';
  }
}

function printMenu(targets) {
  logger.plain('');
  logger.plain('==== 可同步的目标 ====');
  targets.forEach((t, i) => {
    logger.plain(`  ${String(i + 1).padStart(2)}. ${t.name}  ${describeScope(t)}`);
  });
  logger.plain('');
  logger.plain('输入示例：1,3  或  1-3  或  a（全部）  或  q（退出）');
}

// ============ 目标分发 ============

function handleTarget(target, ctx) {
  switch (target.scope) {
    case TargetScope.SINGLE:
      return handleSingleTarget(target, ctx);
    case TargetScope.MULTI:
      return handleMultiTarget(target, ctx);
    default:
      throw new Error(`未知 scope: ${target.scope}`);
  }
}

function buildBundle(sourceFiles) {
  const header = '<!-- 由 ai_rules/scripts/sync.js 自动生成，勿直接编辑；改源文件请编辑 rules/global/ -->\n\n';
  const body = sourceFiles.map((f) => readRendered(f).trimEnd()).join('\n\n');
  return `${header}${body}\n`;
}

function handleSingleTarget(target, ctx) {
  if (!target.output) throw new Error('single 目标缺少 output');
  const outputAbs = expandHome(target.output);

  if (ctx.isDryRun) {
    logger.info(`[DRY] ${target.name} -> ${outputAbs}（拼接 ${ctx.sourceFiles.length} 个源文件）`);
    return;
  }

  ensureDir(path.dirname(outputAbs));
  fs.writeFileSync(outputAbs, buildBundle(ctx.sourceFiles));
  logger.ok(`${target.name} -> ${outputAbs}`);
}

function handleMultiTarget(target, ctx) {
  if (!target.output) throw new Error('multi 目标缺少 output');
  const outputAbs = expandHome(target.output);
  const fileCount = ctx.sourceFiles.length;

  if (ctx.isDryRun) {
    logger.info(`[DRY] ${target.name} -> ${outputAbs}/ (${fileCount} 个文件)`);
    return;
  }

  ensureDir(outputAbs);
  clearStaleRuleFiles(outputAbs);
  for (const file of ctx.sourceFiles) {
    fs.writeFileSync(path.join(outputAbs, file.name), readRendered(file));
  }
  logger.ok(`${target.name} -> ${outputAbs} (${fileCount} 个文件)`);
}

// ============ CLI ============

function parseArgs(argv) {
  const flags = new Set(argv.slice(2));
  return { isDryRun: flags.has(CliFlag.DRY_RUN) };
}

async function main() {
  const { isDryRun } = parseArgs(process.argv);

  let config;
  let sourceFiles;
  try {
    config = loadConfig();
    sourceFiles = listSourceFiles(config.source);
  } catch (err) {
    logger.error(err.message);
    process.exit(ExitCode.CONFIG_ERROR);
  }

  const rl = createPrompt();

  try {
    printMenu(config.targets);
    const answer = await askQuestion(rl, '请选择要同步的目标: ');
    const indices = parseSelection(answer, config.targets.length);

    if (indices === null) {
      logger.info('已退出');
      process.exit(ExitCode.SUCCESS);
    }
    if (indices.length === 0) {
      logger.warn('未选择任何目标');
      process.exit(ExitCode.SUCCESS);
    }

    logger.info(`已选择 ${indices.length} 个目标${isDryRun ? '（dry-run）' : ''}`);
    logger.info(`源文件 (${sourceFiles.length}): ${sourceFiles.map((f) => f.name).join(', ')}`);
    logger.plain('');

    const ctx = { sourceFiles, isDryRun };

    let successCount = 0;
    let failCount = 0;

    for (const idx of indices) {
      const target = config.targets[idx];
      try {
        handleTarget(target, ctx);
        successCount += 1;
      } catch (err) {
        logger.error(`${target.name} 失败: ${err.message}`);
        failCount += 1;
      }
    }

    logger.plain('');
    logger.info(`完成: 成功 ${successCount} / 失败 ${failCount}`);
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  logger.error(`未捕获错误: ${err.message}`);
  process.exit(ExitCode.USER_ABORT);
});
