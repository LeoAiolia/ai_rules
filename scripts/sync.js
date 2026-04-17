#!/usr/bin/env node
/**
 * 规则同步脚本
 * 从 RULES.md 读取单一事实源，根据 sync.config.json 分发到各 AI 工具的规则文件。
 *
 * 用法：
 *   node scripts/sync.js           # 按配置同步所有 enabled=true 的目标
 *   node scripts/sync.js --dry     # 仅打印不写入
 *   node scripts/sync.js --all     # 强制同步所有目标（忽略 enabled）
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// ============ 常量定义 ============
const EXIT_CODE = Object.freeze({
  SUCCESS: 0,
  CONFIG_ERROR: 1,
  SOURCE_MISSING: 2,
  WRITE_ERROR: 3,
});

const CLI_FLAG = Object.freeze({
  DRY_RUN: '--dry',
  ALL: '--all',
});

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(PROJECT_ROOT, 'sync.config.json');

// ============ 日志工具 ============
const logger = {
  info: (msg) => console.log(`[INFO]  ${msg}`),
  warn: (msg) => console.warn(`[WARN]  ${msg}`),
  error: (msg) => console.error(`[ERROR] ${msg}`),
  ok: (msg) => console.log(`[OK]    ${msg}`),
};

// ============ 路径工具 ============
/**
 * 展开路径：处理 ~ 开头的 HOME 目录，以及相对于项目根的相对路径
 */
function resolveOutputPath(rawPath) {
  if (!rawPath || typeof rawPath !== 'string') {
    throw new Error('输出路径无效');
  }
  if (rawPath.startsWith('~')) {
    return path.join(os.homedir(), rawPath.slice(1));
  }
  if (path.isAbsolute(rawPath)) {
    return rawPath;
  }
  return path.resolve(PROJECT_ROOT, rawPath);
}

/**
 * 确保目录存在
 */
function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ============ 配置加载 ============
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
  if (!config.source || !Array.isArray(config.targets)) {
    throw new Error('配置文件缺少 source 或 targets 字段');
  }
  return config;
}

// ============ 源文件读取 ============
function readSource(sourceRelPath) {
  const sourceAbs = path.resolve(PROJECT_ROOT, sourceRelPath);
  if (!fs.existsSync(sourceAbs)) {
    throw new Error(`源文件不存在: ${sourceAbs}`);
  }
  return fs.readFileSync(sourceAbs, 'utf-8');
}

// ============ 内容生成 ============
/**
 * 给规则内容添加自动生成横幅
 */
function buildContent(banner, sourceContent) {
  const safeBanner = banner ?? '';
  return `${safeBanner}\n${sourceContent}`;
}

// ============ CLI 参数解析 ============
function parseArgs(argv) {
  const flags = new Set(argv.slice(2));
  return {
    isDryRun: flags.has(CLI_FLAG.DRY_RUN),
    isAll: flags.has(CLI_FLAG.ALL),
  };
}

// ============ 同步执行 ============
/**
 * 判定目标是否需要同步
 */
function shouldSync(target, isAll) {
  if (isAll) return true;
  return target.enabled === true;
}

/**
 * 写入单个目标
 */
function writeTarget(target, content, isDryRun) {
  const outputAbs = resolveOutputPath(target.output);
  if (isDryRun) {
    logger.info(`[DRY] ${target.name} -> ${outputAbs}`);
    return;
  }
  ensureDir(outputAbs);
  fs.writeFileSync(outputAbs, content, 'utf-8');
  logger.ok(`${target.name} -> ${outputAbs}`);
}

/**
 * 主流程
 */
function main() {
  const { isDryRun, isAll } = parseArgs(process.argv);

  let config;
  try {
    config = loadConfig();
  } catch (err) {
    logger.error(err.message);
    process.exit(EXIT_CODE.CONFIG_ERROR);
  }

  let sourceContent;
  try {
    sourceContent = readSource(config.source);
  } catch (err) {
    logger.error(err.message);
    process.exit(EXIT_CODE.SOURCE_MISSING);
  }

  const content = buildContent(config.banner, sourceContent);

  logger.info(`源文件: ${config.source}`);
  logger.info(`模式: ${isDryRun ? 'dry-run' : 'write'}${isAll ? ' (all)' : ''}`);
  logger.info(`目标数: ${config.targets.length}`);
  console.log('');

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  // 遍历目标，独立处理错误，单个失败不影响其他
  for (const target of config.targets) {
    if (!shouldSync(target, isAll)) {
      logger.warn(`跳过（未启用）: ${target.name}`);
      skipCount += 1;
      continue;
    }
    try {
      writeTarget(target, content, isDryRun);
      if (target.note) logger.warn(`  备注: ${target.note}`);
      successCount += 1;
    } catch (err) {
      logger.error(`${target.name} 失败: ${err.message}`);
      failCount += 1;
    }
  }

  console.log('');
  logger.info(`完成: 成功 ${successCount} / 跳过 ${skipCount} / 失败 ${failCount}`);

  if (failCount > 0) {
    process.exit(EXIT_CODE.WRITE_ERROR);
  }
}

main();
