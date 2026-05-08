# AI Rules

面向 **Flutter / iOS 开发** 的 AI 编程助手规则集。规则以**单一事实源**方式维护在本仓库，通过交互式脚本分发到各 AI 工具的**全局配置**。项目级规则注入由 AI 在该项目 `/init` 时按需完成。

---

## 工具支持

| 工具 | 分发模式 | 输出位置 |
|---|---|---|
| Claude Code | 单文件（拼接） | `~/.claude/CLAUDE.md` |
| Codex | 单文件（拼接） | `~/.codex/AGENTS.md` |
| Trae | 多文件 | `~/.trae/user_rules/` |
| Trae CN | 多文件 | `~/.trae-cn/user_rules/` |

> 不再依赖 ruler；不再分发到具体项目目录。新项目的规则注入由 AI 在该项目执行 `/init` 时按 `99-init-protocol.md` 自助完成。

---

## 两层规则模型

```
通用规则（rules/global/）           平台规则（rules/lang/）
        │                                  │
   npm run sync                       /init 时按需注入
        │                                  │
   ┌────┴────┬─────┬──────┐                ▼
   ▼         ▼     ▼      ▼          AI 在目标项目里
~/.claude/  ~/.codex/  ~/.trae*/      读 ${AI_RULES_REPO}/rules/lang/<lang>.md
CLAUDE.md  AGENTS.md  user_rules/     并 inline 到该项目 AGENTS.md
(单文件)   (单文件)   (多文件)
```

- **`rules/global/NN-name.md`** —— 通用规则。前缀 `NN-` 决定拼接顺序（`00` 在最前，`99` 在最后）。
- **`rules/lang/<语言>.md`** —— 平台规则。不参与 sync，由 AI 在 `/init` 时读取并 inline 到目标项目的 `AGENTS.md`。
- **`rules/CHANGELOG.md`** —— 规则集变更日志。

---

## 目录结构

```
ai_rules/
├── rules/
│   ├── global/                # 通用规则（参与 sync）
│   │   ├── 00-meta.md
│   │   ├── 10-interaction.md
│   │   ├── 20-common-code.md
│   │   ├── 60-logging.md
│   │   ├── 90-checklist.md
│   │   └── 99-init-protocol.md
│   ├── lang/                  # 平台规则（不参与 sync，/init 时 inline）
│   │   ├── flutter.md
│   │   ├── swift.md
│   │   └── android.md
│   └── CHANGELOG.md
├── scripts/
│   ├── sync.js                # 交互式同步脚本
│   └── sync.sh                # dry-run / 正式写入入口
├── sync.config.json           # 同步目标配置
├── AGENTS.md                  # 项目自描述
├── CLAUDE.md                  # @AGENTS.md 导入层
├── package.json
└── README.md
```

---

## 快速开始

### 环境要求

- Node.js ≥ 16

### 运行

```bash
npm run sync          # 交互式同步
npm run sync:dry      # 预演，不写入
./scripts/sync.sh     # 默认 dry-run；输入 r 进入正式写入
```

---

## 交互流程

```
==== 可同步的目标 ====
   1. Claude Code (全局)  [单文件 → ~/.claude/CLAUDE.md]
   2. Codex (全局)        [单文件 → ~/.codex/AGENTS.md]
   3. Trae (全局)         [多文件 → ~/.trae/user_rules/]
   4. Trae CN (全局)      [多文件 → ~/.trae-cn/user_rules/]

输入示例：1,3  或  1-3  或  a（全部）  或  q（退出）
```

| 输入 | 含义 |
|---|---|
| `1,3` | 选择第 1、3 项 |
| `1-3` | 选择第 1~3 项 |
| `a` 或 `all` 或回车 | 全部 |
| `q` 或 `quit` | 退出 |

无需输入项目路径——sync 只往各工具的固定全局位置写。

---

## 同步机制

### single 模式（Claude Code / Codex）

```
rules/global/*.md
   ├─（sync.js: 模板替换 + NN- 顺序拼接 + 顶部生成标记）
   ▼
~/.claude/CLAUDE.md  /  ~/.codex/AGENTS.md
```

### multi 模式（Trae / Trae CN）

```
rules/global/*.md  →（sync.js: 模板替换后多文件拷贝）→  ~/.trae*/user_rules/NN-*.md
```

写入前先清理目标目录下符合 `NN-*.md` 命名模式的旧文件，避免源端删除文件后下游残留。不会动用户的其他文件。

### 模板替换

源文件中的 `${AI_RULES_REPO}` 在 sync 时被替换为本仓库实际绝对路径。这样 `99-init-protocol.md` 里指向 `rules/lang/*.md` 的路径，下游工具读到的是真实可用的绝对路径。

---

## 项目初始化（/init）

在某个具体项目执行 `/init` 时（由 AI 完成，不走 sync 脚本）：

1. AI 识别项目主语言（`pubspec.yaml` → Flutter，`*.xcodeproj` → iOS，`build.gradle` → Android）。
2. AI 把对应 `${AI_RULES_REPO}/rules/lang/<lang>.md` 的完整内容 inline 到项目根 `AGENTS.md`。
3. 项目根 `CLAUDE.md` 只写一行 `@AGENTS.md`。
4. 项目 git 仓库 **只跟踪 `AGENTS.md`**（CLAUDE.md 是工具私有的薄导入层，按需保留即可）。

完整协议见 [`rules/global/99-init-protocol.md`](./rules/global/99-init-protocol.md)。

---

## 修改规则的工作流

1. **改通用规则**：编辑 `rules/global/NN-*.md`，更新 `00-meta.md` 顶部 `版本` / `最后更新`，在 `rules/CHANGELOG.md` 加一条。
2. **改平台规则**：编辑 `rules/lang/<语言>.md`。已 init 过的旧项目需要重跑 `/init` 才能拿到更新（这是 inline 模式的取舍）。
3. **新增平台**：在 `rules/lang/` 加文件，并在 `rules/global/99-init-protocol.md` 的语言识别表里加一行。
4. **新增通用规则文件**：在 `rules/global/` 加 `NN-*.md`，前缀决定拼接顺序（在已有数字间留间隙：`00`→`10`→`20`→`60`→`90`→`99`）。
5. `npm run sync:dry` 预演 → `npm run sync` 分发。

---

## 配置说明（`sync.config.json`）

```jsonc
{
  "source": "rules/global",
  "targets": [
    {
      "name": "Claude Code (全局)",
      "scope": "single",                       // 拼接为单文件
      "output": "~/.claude/CLAUDE.md"
    },
    {
      "name": "Trae (全局)",
      "scope": "multi",                        // 多文件复制
      "output": "~/.trae/user_rules"
    }
  ]
}
```

| scope | 行为 | 必需字段 |
|---|---|---|
| `single` | 拼接 `rules/global/*.md` 为一个文件写到 `output` | `output`（文件路径） |
| `multi` | 多文件复制到 `output` 目录 | `output`（目录路径） |

### 新增工具

在 `targets` 加一条，按目标工具读单文件还是多文件选 `single` / `multi`，填写全局位置即可。

---

## FAQ

**Q：为什么 Claude Code 是写 `~/.claude/CLAUDE.md` 而不是 `~/.claude/AGENTS.md` + 一行 `@AGENTS.md`？**
A：Claude Code 全局只读 `~/.claude/CLAUDE.md`。`@AGENTS.md` 模式是**项目级**的约定（项目根 CLAUDE.md = `@AGENTS.md`，AGENTS.md = 规则全文），用来跨工具共享。全局位置直接放规则更直接。

**Q：Trae 为什么是多文件？**
A：Trae 原生从 `~/.trae/user_rules/` 加载多个 `.md` 文件并依次应用，把它们拼成一个反而不符合工具预期。

**Q：项目级规则什么时候会更新？**
A：必须由用户在该项目重新跑 `/init`。这是 inline 注入的代价，换来项目自给自足、跨工具兼容。

**Q：规则版本在哪？**
A：见 [`rules/global/00-meta.md`](./rules/global/00-meta.md) 顶部 `版本` 字段，变更见 [`rules/CHANGELOG.md`](./rules/CHANGELOG.md)。
