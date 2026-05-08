# AGENTS.md

本仓库是面向 Flutter / iOS 开发的 **AI 编程助手规则单一事实源**，并提供把规则分发到各 AI 工具（Claude Code / Codex / Cline / Antigravity / Trae / Trae CN）的同步脚本。

---

## 常用命令

```bash
npm run sync          # 交互式同步规则到选定工具
npm run sync:dry      # 预演，不写入任何文件
./scripts/sync.sh     # 默认 dry-run；输入 r 进入正式写入
node scripts/sync.js [--dry]   # 直接调用同步脚本
```

ruler 管理的目标（Claude Code / Codex / Cline / Antigravity）需要先安装：

```bash
npm install -g @intellectronica/ruler
```

Trae / Trae CN 不依赖 ruler。

无 lint / test / build 任务（纯 Node 脚本仓库，未配置 lint 或测试套件）。

---

## 架构概览

### 数据流（必须先理解）

```
rules/full.md（手写源）
   ├─→ scripts/sync.js → stripChangelog() → .ruler/AGENTS.md
   │                                            └─→ ruler apply → 目标项目的 CLAUDE.md / AGENTS.md / .clinerules
   └─→ （部分目标改用）rules/compact.md → ~/.trae/user_rules/rules.md（直接写入，不经 ruler）
```

- **`rules/full.md`** —— 唯一手动编辑的规则文件，包含版本号、变更日志、完整规则。
- **`rules/compact.md`** —— Trae 专用精简版（≤1000 字符），与 `full.md` 同步维护。
- **`.ruler/AGENTS.md`** —— 由 `scripts/sync.js` 从 `rules/full.md` 自动生成（去除变更日志），ruler 读取此文件。**禁止直接编辑**。
- **`.ruler/ruler.toml`** —— ruler 配置；MCP 已关闭，agent 通过 `--agents` 参数动态指定。
- **`sync.config.json`** —— 目标列表，每条配置 `scope: ruler | global`、`agent`（ruler 用）或 `output`（global 用）。

### 关键概念：scope 决定分发路径

`scripts/sync.js` 中 `TargetScope` 枚举区分两类目标，使用 `switch` 穷举分发（见 `handleTarget`）：

| scope | 行为 | 必需字段 |
|---|---|---|
| `ruler` | 调用 `ruler apply --agents <agent> --project-root <用户输入目录>` | `agent` |
| `global` | 直接写入固定路径（如 `~/.trae/user_rules/rules.md`） | `output` |

`ruler` 目标需要用户在交互中输入目标项目目录（同次运行内可复用，见 `resolveProjectDir`）；`global` 目标直接写入配置中的 `output` 路径。

### 同次运行的状态

`ctx.rulerSourceSynced` 保证 `.ruler/AGENTS.md` 在一次 `npm run sync` 执行中只生成一次，即使选择了多个 ruler 目标。`ctx.projectDirCache` 缓存上次输入的项目目录以便复用。

---

## 修改规则的工作流

1. 编辑 `rules/full.md`：更新内容、顶部 `版本` 与 `最后更新` 字段、文末变更日志表格。
2. 若改动核心规则，同步编辑 `rules/compact.md`（注意 Trae 1000 字符上限）。
3. `npm run sync:dry` 预演确认。
4. `npm run sync` 选择目标分发；ruler 目标会询问目标项目根目录。
5. **不要手动改 `.ruler/AGENTS.md`** —— 它是生成产物，会被脚本覆盖。

---

## 新项目的 AI 指引文档结构（本仓库的规则之一）

跑 `/init` 或为新项目落地 AI 指引时统一采用：

- `AGENTS.md`：写所有正文（项目简介、命令、架构、约定）—— 多 AI 工具共享的事实源。
- `CLAUDE.md`：只写一行 `@AGENTS.md`，作为薄导入层。

本仓库自身即遵循此结构：本文件是事实源，`CLAUDE.md` 仅 `@AGENTS.md`。

---

## 注意事项

- 修改 `scripts/sync.js` 时遵循 `rules/full.md` 的通用代码规范（枚举用 `switch`、函数 ≤50 行、单一职责等）。
- ruler 仓库：<https://github.com/intellectronica/ruler> —— 新增工具时只需在 `sync.config.json.targets` 加一条，无需改脚本。
