# AGENTS.md

本仓库是面向 Flutter / iOS 开发的 **AI 编程助手规则单一事实源**，并提供把规则分发到各 AI 工具**全局配置**的同步脚本。

---

## 常用命令

```bash
npm run sync          # 交互式同步通用规则到选定工具的全局配置
npm run sync:dry      # 预演，不写入任何文件
./scripts/sync.sh     # 默认 dry-run；输入 r 进入正式写入
node scripts/sync.js [--dry]   # 直接调用同步脚本
```

无 lint / test / build 任务（纯 Node 脚本仓库，未配置 lint 或测试套件），无外部依赖，开箱可用。

---

## 架构概览

### 两层模型

规则被分为**通用规则**（语言无关，参与 sync 分发到全局）和**平台规则**（按项目语言适用，由 AI 在 `/init` 时按需注入到具体项目），分别走两条不同的路径：

```
通用规则（rules/global/）           平台规则（rules/lang/）
        │                                  │
   npm run sync                       /init 时按需注入
        │                                  │
   ┌────┴────┬─────┬──────┐                ▼
   ▼         ▼     ▼      ▼          AI 在目标项目里
~/.claude/  ~/.codex/  ~/.trae*/      读 ${AI_RULES_REPO}/rules/lang/<lang>.md
CLAUDE.md  AGENTS.md  user_rules/     并 inline 到该项目的 AGENTS.md
(单文件)   (单文件)   (多文件)
```

- **`rules/global/NN-name.md`** —— 参与 sync 的通用规则。命名前缀 `NN-` 决定拼接顺序（00 在最前，99 在最后）。
- **`rules/lang/<语言>.md`** —— 不参与 sync。`/init` 时由项目侧 AI 按 `99-init-protocol.md` 的指示从仓库绝对路径读取并 inline 到项目 `AGENTS.md`。
- **`rules/CHANGELOG.md`** —— 规则集变更日志，不参与分发。

### scope 决定分发路径

`scripts/sync.js` 中 `TargetScope` 枚举：

| scope | 行为 | 用于 |
|---|---|---|
| `single` | 把 `rules/global/*.md` 按 NN- 顺序拼成一个文件，写到 `output` 路径 | Claude Code (`~/.claude/CLAUDE.md`)、Codex (`~/.codex/AGENTS.md`) |
| `multi` | 把 `rules/global/*.md` 多文件复制到 `output` 目录 | Trae / Trae CN (`~/.trae*/user_rules/`) —— Trae 原生按多文件加载 |

### 模板替换

源文件中的 `${AI_RULES_REPO}` 在分发时被替换为本仓库的实际绝对路径，让 `99-init-protocol.md` 中指向 `rules/lang/*.md` 的路径在任何机器上都正确。

### 同次运行的状态

- 写入前先调 `clearStaleRuleFiles(dir)` 删除目标目录下匹配 `NN-*.md` 模式的旧文件——不会误删用户其他文件。
- `single` 模式直接覆盖输出文件（顶部带"自动生成、勿编辑"标记）。

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
- 不再依赖 ruler；新增工具只要在 `sync.config.json.targets` 加一条，按 `single` / `multi` 选 scope 即可，无需改脚本。
