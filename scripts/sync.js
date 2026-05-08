#!/usr/bin/env node
/**
 * 规则同步脚本（交互式）
 *
 * 模型：
 *   - 源：rules/global/ 下的 NN-name.md 多文件
 *   - ruler 目标：复制源文件到 .ruler/，由 ruler 拼接并写入下游项目
 *   - 全局目标（Trae/Trae-CN）：复制源文件到目标目录，作为多条规则加载
 *
 * 用法：
 *   node scripts/sync.js            # 交互式菜单
 *   node scripts/sync.js --dry      # 预演，不写入
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const { execSync } = require('child_process');

// ============ 枚举 / 常量 ============

const TargetScope = Object.freeze({
  RULER: 'ruler',
  GLOBAL: 'global',
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
const RULER_DIR = path.join(PROJECT_ROOT, '.ruler');

// 规则文件命名约定：两位数字前缀 + 短横线 + 名称 + .md
// 用于：从源目录筛选有效规则文件 / 在目标目录清理同模式旧文件（不误伤其他文件）
const RULE_FILE_PATTERN = /^\d{2}-[\w-]+\.md$/;

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

/**
 * 删除目标目录下匹配规则文件命名模式的旧文件，避免源端删除文件后下游残留
 * 不影响 ruler.toml、用户其他文件
 */
function clearStaleRuleFiles(dir) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    if (RULE_FILE_PATTERN.test(name)) {
      fs.unlinkSync(path.join(dir, name));
    }
  }
}

function copyRuleFiles(sourceFiles, targetDir) {
  ensureDir(targetDir);
  for (const { name, absPath } of sourceFiles) {
    fs.copyFileSync(absPath, path.join(targetDir, name));
  }
}

// ============ ruler 工具 ============

function isRulerInstalled() {
  try {
    execSync('ruler --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * 把通用规则文件刷新到 .ruler/，让 ruler 自己拼接并分发给下游
 */
function refreshRulerSource(sourceFiles) {
  ensureDir(RULER_DIR);
  clearStaleRuleFiles(RULER_DIR);
  copyRuleFiles(sourceFiles, RULER_DIR);
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
  const tokens = trimmed.split(/[\s,]+/).filter(Boolean);
  for (const token of tokens) {
    if (token.includes('-')) {
      const [start, end] = token.split('-').map((n) => parseInt(n, 10));
      if (Number.isNaN(start) || Number.isNaN(end)) continue;
      for (let i = start; i <= end; i += 1) {
        if (i >= 1 && i <= totalCount) selected.add(i - 1);
      }
    } else {
      const idx = parseInt(token, 10);
      if (!Number.isNaN(idx) && idx >= 1 && idx <= totalCount) selected.add(idx - 1);
    }
  }
  return Array.from(selected).sort((a, b) => a - b);
}

function describeScope(target) {
  switch (target.scope) {
    case TargetScope.RULER:
      return `[ruler → agent: ${target.agent}]`;
    case TargetScope.GLOBAL:
      return `[全局 → ${target.output}]`;
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

async function resolveProjectDir(rl, cache) {
  if (cache.value) {
    const reuse = await askQuestion(
      rl,
      `是否复用上次的项目目录？\n  ${cache.value}\n  [Y/n]: `,
    );
    if (reuse === '' || reuse.toLowerCase() === 'y') return cache.value;
  }
  const input = await askQuestion(rl, '请输入项目根目录绝对路径: ');
  if (!input) throw new Error('项目目录不能为空');
  const expanded = expandHome(input);
  const absolute = path.isAbsolute(expanded) ? expanded : path.resolve(process.cwd(), expanded);
  if (!fs.existsSync(absolute)) throw new Error(`目录不存在: ${absolute}`);
  if (!fs.statSync(absolute).isDirectory()) throw new Error(`路径不是目录: ${absolute}`);
  cache.value = absolute;
  return absolute;
}

// ============ 目标分发 ============

async function handleTarget(target, ctx) {
  switch (target.scope) {
    case TargetScope.RULER:
      return handleRulerTarget(target, ctx);
    case TargetScope.GLOBAL:
      return handleGlobalTarget(target, ctx);
    default:
      throw new Error(`未知 scope: ${target.scope}`);
  }
}

async function handleRulerTarget(target, ctx) {
  if (!target.agent) throw new Error('ruler 目标缺少 agent 字段');
  if (!isRulerInstalled()) {
    throw new Error(
      'ruler 未安装。请先执行：\n\n    npm install -g @intellectronica/ruler\n',
    );
  }

  const projectDir = await resolveProjectDir(ctx.rl, ctx.projectDirCache);

  if (!ctx.rulerSourceSynced) {
    if (!ctx.isDryRun) refreshRulerSource(ctx.sourceFiles);
    ctx.rulerSourceSynced = true;
  }

  const cmd = [
    'ruler apply',
    `--agents ${target.agent}`,
    `--project-root "${projectDir}"`,
    '--no-mcp',
    '--no-backup',
  ].join(' ');

  if (ctx.isDryRun) {
    logger.info(`[DRY] ${target.name}: ${cmd}`);
    return;
  }

  logger.info(`正在执行: ${cmd}`);
  execSync(cmd, { cwd: PROJECT_ROOT, stdio: 'inherit' });
  logger.ok(`${target.name} -> ${projectDir}`);
}

function handleGlobalTarget(target, ctx) {
  if (!target.output) throw new Error('全局目标缺少 output');
  const outputAbs = expandHome(target.output);
  const fileCount = ctx.sourceFiles.length;

  if (ctx.isDryRun) {
    logger.info(`[DRY] ${target.name} -> ${outputAbs}/ (${fileCount} 个文件)`);
    return;
  }

  ensureDir(outputAbs);
  clearStaleRuleFiles(outputAbs);
  copyRuleFiles(ctx.sourceFiles, outputAbs);
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

    const ctx = {
      rl,
      config,
      sourceFiles,
      isDryRun,
      projectDirCache: { value: null },
      rulerSourceSynced: false,
    };

    let successCount = 0;
    let failCount = 0;

    for (const idx of indices) {
      const target = config.targets[idx];
      try {
        // eslint-disable-next-line no-await-in-loop
        await handleTarget(target, ctx);
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
