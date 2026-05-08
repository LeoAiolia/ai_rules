#!/usr/bin/env node
/**
 * 规则同步脚本（交互式）
 *
 * 功能：
 *   1. 交互式菜单，用户选择要同步的目标
 *   2. ruler 目标：检查 ruler 是否已安装，然后调用 ruler apply 写入目标项目
 *   3. 全局目标（Trae/Trae-CN）：将精简规则写入全局路径
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
  RULER: 'ruler',   // 由 ruler 管理，调用 ruler apply
  GLOBAL: 'global', // 直接写入全局固定路径
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
const RULER_AGENTS_PATH = path.join(PROJECT_ROOT, '.ruler', 'AGENTS.md');

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

/**
 * 移除变更日志章节（AI 不需要）
 */
function stripChangelog(content) {
  const lines = content.split('\n');
  const headingPattern = /^##\s+(\d+\.\s+)?变更日志\s*$/;
  const idx = lines.findIndex((line) => headingPattern.test(line));
  if (idx === -1) return content;

  let end = idx;
  while (end > 0) {
    const prev = lines[end - 1].trim();
    if (prev === '' || prev === '---') {
      end -= 1;
    } else {
      break;
    }
  }
  return `${lines.slice(0, end).join('\n').trimEnd()}\n`;
}

function buildContent(banner, sourceContent) {
  const stripped = stripChangelog(sourceContent);
  const safeBanner = (banner ?? '').trim();
  return safeBanner.length > 0 ? `${safeBanner}\n\n${stripped}` : stripped;
}

// ============ ruler 工具 ============

/**
 * 检测 ruler 是否已安装
 */
function isRulerInstalled() {
  try {
    execSync('ruler --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * 将 rules/full.md 内容写入 .ruler/AGENTS.md，作为 ruler 的规则源
 */
function syncRulerSource(config) {
  const raw = readSource(config.source);
  const content = stripChangelog(raw);
  fs.writeFileSync(RULER_AGENTS_PATH, content, 'utf-8');
}

// ============ 路径工具 ============

function expandHome(rawPath) {
  if (!rawPath) return rawPath;
  if (rawPath.startsWith('~')) {
    return path.join(os.homedir(), rawPath.slice(1));
  }
  return rawPath;
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ============ 交互工具 ============

function createPrompt() {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}

function askQuestion(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

/**
 * 解析选择字符串：a=全部，q=退出，1,3 或 1-3 为具体选择
 */
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

// ============ 菜单 ============

function describeScope(target, defaultSource) {
  const srcTag = target.source ? ` (${target.source})` : '';
  switch (target.scope) {
    case TargetScope.RULER:
      return `[ruler → agent: ${target.agent}]`;
    case TargetScope.GLOBAL:
      return `[全局 → ${target.output}${srcTag}]`;
    default:
      return '[未知作用域]';
  }
}

function printMenu(targets, defaultSource) {
  logger.plain('');
  logger.plain('==== 可同步的目标 ====');
  targets.forEach((t, i) => {
    logger.plain(`  ${String(i + 1).padStart(2)}. ${t.name}  ${describeScope(t, defaultSource)}`);
  });
  logger.plain('');
  logger.plain('输入示例：1,3  或  1-3  或  a（全部）  或  q（退出）');
}

// ============ 项目目录缓存 ============

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

  // 将最新 rules/full.md 写入 .ruler/AGENTS.md（仅首次或规则变更时需要）
  if (!ctx.rulerSourceSynced) {
    syncRulerSource(ctx.config);
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
  const sourcePath = target.source ?? ctx.config.source;
  const raw = readSource(sourcePath);
  const content = buildContent(ctx.config.banner, raw);
  const outputAbs = expandHome(target.output);

  if (ctx.isDryRun) {
    logger.info(`[DRY] ${target.name} -> ${outputAbs}`);
    return;
  }

  ensureDir(outputAbs);
  fs.writeFileSync(outputAbs, content, 'utf-8');
  logger.ok(`${target.name} -> ${outputAbs}`);
}

// ============ CLI ============

function parseArgs(argv) {
  const flags = new Set(argv.slice(2));
  return { isDryRun: flags.has(CliFlag.DRY_RUN) };
}

// ============ 主流程 ============

async function main() {
  const { isDryRun } = parseArgs(process.argv);

  let config;
  try {
    config = loadConfig();
  } catch (err) {
    logger.error(err.message);
    process.exit(ExitCode.CONFIG_ERROR);
  }

  const rl = createPrompt();

  try {
    printMenu(config.targets, config.source);
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
      config,
      isDryRun,
      projectDirCache: { value: null },
      rulerSourceSynced: false, // .ruler/AGENTS.md 整次运行只同步一次
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
