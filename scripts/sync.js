#!/usr/bin/env node
/**
 * 规则同步脚本（交互式）
 *
 * 功能：
 *   1. 菜单多选：显示目标列表，用户选择要同步的目标
 *   2. 项目级目标：提示用户输入项目根目录，写入到对应相对路径
 *   3. 全局目标：写入固定的全局路径（如 ~/.claude/CLAUDE.md）
 *   4. 手动目标（未知路径）：打印规则内容到终端，用户自行粘贴
 *
 * 用法：
 *   node scripts/sync.js            # 交互式菜单
 *   node scripts/sync.js --dry      # 预演，不写入也不打印全文
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

// ============ 枚举 / 常量 ============

/**
 * 目标作用域
 * - PROJECT：项目级，需要用户输入项目目录 + relativePath 拼接
 * - GLOBAL：全局级，使用固定 output 路径
 * - MANUAL：未知路径，打印内容供用户手动粘贴
 */
const TargetScope = Object.freeze({
  PROJECT: 'project',
  GLOBAL: 'global',
  MANUAL: 'manual',
});

const CliFlag = Object.freeze({
  DRY_RUN: '--dry',
});

const ExitCode = Object.freeze({
  SUCCESS: 0,
  CONFIG_ERROR: 1,
  SOURCE_MISSING: 2,
  USER_ABORT: 3,
});

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(PROJECT_ROOT, 'sync.config.json');

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

function readSource(sourceRelPath) {
  const sourceAbs = path.resolve(PROJECT_ROOT, sourceRelPath);
  if (!fs.existsSync(sourceAbs)) {
    throw new Error(`源文件不存在: ${sourceAbs}`);
  }
  return fs.readFileSync(sourceAbs, 'utf-8');
}

function buildContent(banner, sourceContent) {
  const safeBanner = banner ?? '';
  return `${safeBanner}\n${sourceContent}`;
}

// ============ 路径工具 ============

/**
 * 展开 ~ 为用户 HOME 目录
 */
function expandHome(rawPath) {
  if (!rawPath) return rawPath;
  if (rawPath.startsWith('~')) {
    return path.join(os.homedir(), rawPath.slice(1));
  }
  return rawPath;
}

/**
 * 确保父目录存在
 */
function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ============ 交互工具 ============

function createPrompt() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function askQuestion(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

/**
 * 解析用户输入的选择字符串
 * 支持格式：
 *   - "a" / "all"：全部
 *   - "q" / "quit"：退出（返回 null）
 *   - "1,3,5" 或 "1 3 5"：具体索引（从 1 开始）
 *   - "1-3"：范围
 */
function parseSelection(input, totalCount) {
  const trimmed = input.trim().toLowerCase();
  if (trimmed === 'q' || trimmed === 'quit' || trimmed === 'exit') {
    return null;
  }
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
      if (!Number.isNaN(idx) && idx >= 1 && idx <= totalCount) {
        selected.add(idx - 1);
      }
    }
  }
  return Array.from(selected).sort((a, b) => a - b);
}

// ============ 菜单展示 ============

function printMenu(targets) {
  logger.plain('');
  logger.plain('==== 可同步的目标 ====');
  targets.forEach((t, i) => {
    const scopeTag = describeScope(t);
    logger.plain(`  ${String(i + 1).padStart(2)}. ${t.name}  ${scopeTag}`);
  });
  logger.plain('');
  logger.plain('输入示例：1,3  或  1-3  或  a（全部）  或  q（退出）');
}

/**
 * 根据 scope 生成描述标签（使用 switch 穷举）
 */
function describeScope(target) {
  switch (target.scope) {
    case TargetScope.PROJECT:
      return `[项目级 → {项目目录}/${target.relativePath}]`;
    case TargetScope.GLOBAL:
      return `[全局 → ${target.output}]`;
    case TargetScope.MANUAL:
      return '[手动粘贴]';
    default:
      return '[未知作用域]';
  }
}

// ============ 项目目录缓存 ============

/**
 * 询问项目目录，支持跨目标复用同一目录
 */
async function resolveProjectDir(rl, cache) {
  if (cache.value) {
    const reuse = await askQuestion(
      rl,
      `是否复用上次的项目目录？\n  ${cache.value}\n  [Y/n]: `,
    );
    if (reuse === '' || reuse.toLowerCase() === 'y') {
      return cache.value;
    }
  }
  const input = await askQuestion(rl, '请输入项目根目录绝对路径: ');
  if (!input) {
    throw new Error('项目目录不能为空');
  }
  const expanded = expandHome(input);
  const absolute = path.isAbsolute(expanded) ? expanded : path.resolve(process.cwd(), expanded);
  if (!fs.existsSync(absolute)) {
    throw new Error(`目录不存在: ${absolute}`);
  }
  if (!fs.statSync(absolute).isDirectory()) {
    throw new Error(`路径不是目录: ${absolute}`);
  }
  cache.value = absolute;
  return absolute;
}

// ============ 目标分发 ============

/**
 * 处理单个目标（根据 scope 走不同分支）
 */
async function handleTarget(target, ctx) {
  switch (target.scope) {
    case TargetScope.PROJECT:
      return handleProjectTarget(target, ctx);
    case TargetScope.GLOBAL:
      return handleGlobalTarget(target, ctx);
    case TargetScope.MANUAL:
      return handleManualTarget(target, ctx);
    default:
      throw new Error(`未知 scope: ${target.scope}`);
  }
}

async function handleProjectTarget(target, ctx) {
  if (!target.relativePath) {
    throw new Error('项目级目标缺少 relativePath');
  }
  const projectDir = await resolveProjectDir(ctx.rl, ctx.projectDirCache);
  const outputAbs = path.join(projectDir, target.relativePath);
  writeFile(outputAbs, ctx.content, ctx.isDryRun, target.name);
}

function handleGlobalTarget(target, ctx) {
  if (!target.output) {
    throw new Error('全局目标缺少 output');
  }
  const outputAbs = expandHome(target.output);
  writeFile(outputAbs, ctx.content, ctx.isDryRun, target.name);
}

function handleManualTarget(target, ctx) {
  logger.warn(`${target.name}`);
  if (target.hint) logger.plain(`  提示：${target.hint}`);
  if (ctx.isDryRun) {
    logger.info('  [DRY] 将打印规则全文供手动粘贴');
    return;
  }
  logger.plain('');
  logger.plain('────────── 规则内容开始 ──────────');
  logger.plain(ctx.content);
  logger.plain('────────── 规则内容结束 ──────────');
  logger.plain('');
}

function writeFile(outputAbs, content, isDryRun, name) {
  if (isDryRun) {
    logger.info(`[DRY] ${name} -> ${outputAbs}`);
    return;
  }
  ensureDir(outputAbs);
  fs.writeFileSync(outputAbs, content, 'utf-8');
  logger.ok(`${name} -> ${outputAbs}`);
}

// ============ CLI ============

function parseArgs(argv) {
  const flags = new Set(argv.slice(2));
  return {
    isDryRun: flags.has(CliFlag.DRY_RUN),
  };
}

// ============ 主流程 ============

async function main() {
  const { isDryRun } = parseArgs(process.argv);

  let config;
  let sourceContent;
  try {
    config = loadConfig();
    sourceContent = readSource(config.source);
  } catch (err) {
    logger.error(err.message);
    process.exit(err.message.includes('源文件') ? ExitCode.SOURCE_MISSING : ExitCode.CONFIG_ERROR);
  }

  const content = buildContent(config.banner, sourceContent);
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
    logger.plain('');

    const ctx = {
      rl,
      content,
      isDryRun,
      projectDirCache: { value: null },
    };

    let successCount = 0;
    let failCount = 0;

    // 逐个处理，单个失败不影响其他
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
