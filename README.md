# AI Rules

面向 **Flutter / iOS 开发** 的 AI 编程助手规则集。规则以**单一事实源**方式维护在本仓库，通过交互式脚本分发到各 AI 工具。

---

## 工具支持

| 工具 | 管理方式 | 说明 |
|---|---|---|
| Claude Code | [ruler](https://github.com/intellectronica/ruler) | 写入目标项目 `CLAUDE.md` |
| Codex | ruler | 写入目标项目 `AGENTS.md` |
| Cline | ruler | 写入目标项目 `.clinerules` |
| Antigravity | ruler | 写入目标项目 `AGENTS.md` |
| Trae | 自定义脚本 | 写入全局 `~/.trae/user_rules/` 多文件 |
| Trae CN | 自定义脚本 | 写入全局 `~/.trae-cn/user_rules/` 多文件 |

---

## 两层规则模型（v2.0）

规则分为**通用规则**与**平台规则**，走两条不同的分发路径：

```
通用规则（rules/global/）              平台规则（rules/lang/）
        │                                      │
   npm run sync                          /init 时按需注入
        │                                      │
   ┌────┴────┐                            （AI 在目标项目里读
   │         │                             ${AI_RULES_REPO}/rules/lang/<lang>.md
   ▼         ▼                             并 inline 到项目 AGENTS.md）
.ruler/   ~/.trae*/user_rules/
   │
   ▼
ruler apply → 目标项目规则文件
```

- **`rules/global/NN-name.md`** —— 参与 sync 的通用规则。前缀 `NN-` 决定 ruler 拼接顺序（`00` 在最前，`99` 在最后）。
- **`rules/lang/<语言>.md`** —— 不参与 sync。`/init` 时由项目侧 AI 按 `99-init-protocol.md` 的指示从仓库绝对路径读取，inline 到目标项目 `AGENTS.md`。
- **`rules/CHANGELOG.md`** —— 规则集变更日志，不参与分发。

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
├── .ruler/                    # sync 产物：rules/global/*.md 的拷贝（已 gitignore）
├── scripts/
│   ├── sync.js                # 交互式同步脚本
│   └── sync.sh                # 选择 dry-run / 正式写入的便捷入口
├── sync.config.json           # 同步目标配置
├── AGENTS.md                  # 项目自描述（给 AI 看）
├── CLAUDE.md                  # @AGENTS.md 导入层
├── package.json
└── README.md
```

---

## 快速开始

### 环境要求

- Node.js ≥ 16
- ruler（同步 ruler 管理的目标时需要）：`npm install -g @intellectronica/ruler`

### 运行

```bash
npm run sync          # 交互式同步
npm run sync:dry      # 预演，不写入
./scripts/sync.sh     # 默认 dry-run；输入 r 进入正式写入
```

> 若未安装 ruler，选择 ruler 管理的目标时脚本会报错；Trae / Trae CN 不依赖 ruler。

---

## 交互流程

**步骤 1：选择目标**

```
==== 可同步的目标 ====
   1. Claude Code  [ruler → agent: claude]
   2. Codex        [ruler → agent: codex]
   3. Cline        [ruler → agent: cline]
   4. Antigravity  [ruler → agent: antigravity]
   5. Trae (全局)     [全局 → ~/.trae/user_rules]
   6. Trae CN (全局)  [全局 → ~/.trae-cn/user_rules]

输入示例：1,3  或  1-3  或  a（全部）  或  q（退出）
```

| 输入 | 含义 |
|---|---|
| `1,3,5` | 选择第 1、3、5 项 |
| `1-4` | 选择第 1~4 项 |
| `a` 或 `all` | 选择全部 |
| `q` 或 `quit` | 退出 |

**步骤 2：ruler 目标 → 输入项目目录**

```
请输入项目根目录绝对路径: /Users/xxx/projects/my-flutter-app
```

同次运行选择多个 ruler 目标时，脚本会询问是否复用上次的目录。

**步骤 3：Trae / Trae CN → 直接写入全局路径**

无需额外操作，脚本直接写入 `~/.trae*/user_rules/`。

---

## 同步机制

### ruler 管理的目标（Claude Code / Codex / Cline / Antigravity）

```
rules/global/*.md
   ├─（sync.js: 模板替换 ${AI_RULES_REPO} 后复制）
   ▼
.ruler/NN-*.md
   ├─（ruler apply --agents <agent> --project-root <目标>）
   ▼
目标项目对应规则文件（CLAUDE.md / AGENTS.md / .clinerules）
```

ruler 按字母序拼接 `.ruler/` 下所有 `.md`，所以源文件命名前缀 `NN-` 决定最终顺序。

### Trae / Trae CN（自定义管理）

```
rules/global/*.md  →（sync.js）→  ~/.trae*/user_rules/NN-*.md
```

Trae 把 `user_rules/` 下的多个 `.md` 当作多条规则加载，无需拼成一个文件。

### 模板替换

规则文件中的 `${AI_RULES_REPO}` 会在 sync 时被替换为本仓库的实际绝对路径，下游工具读到真实可用的路径。这样 `99-init-protocol.md` 中指向 `rules/lang/*.md` 的路径在任何机器上都正确。

---

## 修改规则的工作流

1. **改通用规则**：编辑 `rules/global/NN-*.md`，更新 `00-meta.md` 顶部 `版本` / `最后更新`，在 `rules/CHANGELOG.md` 加一条。
2. **改平台规则**：编辑 `rules/lang/<语言>.md`。这部分不参与 sync——已 init 过的旧项目要重跑 `/init` 才能拿到更新。
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
      "name": "Claude Code",
      "scope": "ruler",     // 由 ruler 管理
      "agent": "claude"     // ruler 的 agent 标识
    },
    {
      "name": "Trae (全局)",
      "scope": "global",    // 直接复制到固定目录
      "output": "~/.trae/user_rules"
    }
  ]
}
```

| scope | 行为 | 必需字段 |
|---|---|---|
| `ruler` | 把 `rules/global/*.md` 刷入 `.ruler/`，调 `ruler apply` 写入用户指定项目 | `agent` |
| `global` | 把 `rules/global/*.md` 直接复制到 `output` 目录 | `output` |

### 新增工具

在 `targets` 里加一条；ruler 支持的工具直接写 `scope: ruler` + 对应 `agent`，无需改脚本。ruler 支持的工具列表见 [ruler 仓库](https://github.com/intellectronica/ruler)。

---

## FAQ

**Q：如何安装 ruler？**
A：`npm install -g @intellectronica/ruler`。仅同步 ruler 管理的工具时需要，Trae / Trae CN 不需要。

**Q：项目级目标每次都要输入项目目录吗？**
A：同一次运行内只需输入一次，后续 ruler 目标会询问"是否复用上次目录 [Y/n]"。

**Q：Trae 为什么单独管理？**
A：ruler 对 Trae 只支持项目级规则（`.trae/rules/`），而 Trae 的全局规则路径（`~/.trae/user_rules/`）需要额外处理，因此保留自定义逻辑。

**Q：`.ruler/` 下的文件可以改吗？**
A：不可以。`.ruler/NN-*.md` 由 sync.js 生成（已 gitignore），每次 sync 会被覆盖。要改规则，编辑 `rules/global/` 下的源文件。

---

## 版本

当前规则版本：见 [`rules/global/00-meta.md`](./rules/global/00-meta.md) 顶部 `版本` 字段，变更见 [`rules/CHANGELOG.md`](./rules/CHANGELOG.md)。
