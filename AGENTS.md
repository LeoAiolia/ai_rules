# AGENTS.md

本仓库是面向 Flutter / iOS 开发的 **AI 编程助手规则单一事实源**，并提供把规则分发到各 AI 工具（Claude Code / Codex / Cline / Antigravity / Trae / Trae CN）的同步脚本。

---

## 常用命令

```bash
npm run sync          # 交互式同步通用规则到选定工具
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

### 两层模型（关键）

规则被分为**通用规则**（语言无关）和**平台规则**（按项目语言适用），分别走两条不同的分发路径：

```
通用规则（rules/global/）              平台规则（rules/lang/）
        │                                      │
   npm run sync                          /init 时按需注入
        │                                      │
   ┌────┴────┐                            （AI 在目标项目里
   │         │                            读 ~/Documents/yxr/ai_rules/
   ▼         ▼                            rules/lang/<lang>.md
.ruler/   ~/.trae/user_rules/             并 inline 到项目 AGENTS.md）
   │
   ▼
ruler apply → 目标项目 CLAUDE.md
```

- **`rules/global/NN-name.md`** —— 参与 sync 的通用规则。命名前缀 `NN-` 用于 ruler 拼接顺序（00 在最前，99 在最后）。
- **`rules/lang/<语言>.md`** —— 不参与 sync。`/init` 时由项目侧 AI 按 `99-init-protocol.md` 的指示从仓库绝对路径读取并 inline 到项目 `AGENTS.md`。
- **`rules/CHANGELOG.md`** —— 规则集变更日志，不进任何分发。
- **`.ruler/`** —— 生成产物目录。每次 sync 时 `[0-9][0-9]-*.md` 被清空重写（已 gitignore）；`ruler.toml` 是配置（git 跟踪）。

### scope 决定分发路径

`scripts/sync.js` 中 `TargetScope` 枚举：

| scope | 行为 | 必需字段 |
|---|---|---|
| `ruler` | 把 `rules/global/*.md` 复制到 `.ruler/`，再调 `ruler apply --agents <agent> --project-root <用户输入目录>`；ruler 自身按字母序拼接所有 .md 写入下游工具的规则文件 | `agent` |
| `global` | 直接把 `rules/global/*.md` 复制进 `output` 目录（如 `~/.trae/user_rules/`），让目标工具当多条规则加载 | `output` |

### 同次运行的状态

- `ctx.rulerSourceSynced` 保证 `.ruler/` 在一次 `npm run sync` 中只刷新一次，即便选了多个 ruler 目标。
- `ctx.projectDirCache` 缓存上次输入的项目目录以便复用。
- 写入前先调 `clearStaleRuleFiles(dir)` 删除目标目录下匹配 `NN-*.md` 模式的旧文件——不会误删 `ruler.toml` 或用户其他文件。

---

## 修改规则的工作流

1. **改通用规则**：编辑 `rules/global/NN-*.md`，更新 `00-meta.md` 顶部 `版本` / `最后更新`，在 `rules/CHANGELOG.md` 加一条。
2. **改平台规则**：编辑 `rules/lang/<语言>.md`。这部分不参与 sync——已 init 过的旧项目要重跑 `/init` 才能拿到更新。
3. **新增平台**：`rules/lang/<新语言>.md` 加文件 + 在 `rules/global/99-init-protocol.md` 的语言识别表里加一行。
4. **新增通用规则文件**：在 `rules/global/` 加 `NN-*.md`，前缀决定拼接顺序（在已有数字间留间隙：00→10→20→60→90→99 这种）。
5. `npm run sync:dry` 预演 → `npm run sync` 分发。

---

## 注意事项

- 修改 `scripts/sync.js` 时遵循 `rules/global/20-common-code.md` 的通用代码规范（枚举用 `switch`、函数 ≤50 行、单一职责等）。
- 平台规则更新不会自动同步到旧项目：这是 `/init` inline 模式的取舍，换来项目自给自足、跨工具兼容。
- ruler 仓库：<https://github.com/intellectronica/ruler>。新增工具时只需在 `sync.config.json.targets` 加一条，无需改脚本。
