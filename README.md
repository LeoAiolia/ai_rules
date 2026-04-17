# AI Rules

一份面向 **Flutter / iOS 开发** 的 AI 编程助手规则集，采用**单一事实源**方式维护，通过**交互式脚本**按需同步到各 AI 工具（Claude Code / Codex / Cline / Trae / Antigravity 等）。

---

## 特性

- **单一事实源**：所有规则集中在 [`RULES.md`](./RULES.md)，版本化管理。
- **交互式多选同步**：运行脚本后弹出菜单，自由选择要同步的目标。
- **项目级动态目录**：同步项目级规则时提示输入项目根目录，精准落盘。
- **未知路径兜底**：无法自动同步的工具直接打印规则全文，用户手动粘贴。
- **零依赖**：仅使用 Node.js 内置模块，无需 `npm install`。

---

## 目录结构

```
ai_rules/
├── RULES.md              # 规则单一事实源（唯一需要手动编辑的规则文件）
├── sync.config.json      # 同步目标配置
├── scripts/
│   └── sync.js           # 交互式同步脚本
├── package.json          # npm scripts 入口
└── README.md
```

---

## 快速开始

### 环境要求

- Node.js ≥ 16

### 运行

```bash
npm run sync           # 交互式同步（默认）
npm run sync:dry       # 预演模式，不写入文件
```

---

## 交互流程

执行 `npm run sync` 后：

**步骤 1：选择目标**

```
==== 可同步的目标 ====
   1. Claude Code (项目级)  [项目级 → {项目目录}/CLAUDE.md]
   2. Claude Code (全局)    [全局 → ~/.claude/CLAUDE.md]
   3. Codex (项目级)        [项目级 → {项目目录}/AGENTS.md]
   4. Codex (全局)          [全局 → ~/.codex/AGENTS.md]
   5. Cline (项目级)        [项目级 → {项目目录}/.clinerules/rules.md]
   6. Trae (项目级)         [项目级 → {项目目录}/.trae/rules/project_rules.md]
   7. Antigravity (未知路径，复制粘贴)  [手动粘贴]

输入示例：1,3  或  1-3  或  a（全部）  或  q（退出）
请选择要同步的目标:
```

支持的输入格式：

| 输入 | 含义 |
|---|---|
| `1,3,5` | 选择第 1、3、5 项 |
| `1-3` | 选择第 1~3 项 |
| `1,3-5` | 混合使用 |
| `a` 或 `all` | 选择全部 |
| `q` 或 `quit` | 退出 |

**步骤 2：项目级目标 → 提示输入项目目录**

```
请输入项目根目录绝对路径: /Users/xxx/projects/my-flutter-app
```

同一次运行中若选择了多个项目级目标，脚本会询问是否**复用**上次输入的目录（避免重复输入）。

**步骤 3：手动目标 → 打印全文**

```
[WARN]  Antigravity (未知路径，复制粘贴)
  提示：Antigravity 规则文件路径未确认，请将下方内容手动粘贴到对应位置。

────────── 规则内容开始 ──────────
（此处为 RULES.md 全部内容）
────────── 规则内容结束 ──────────
```

---

## 目标作用域（`scope`）

每个目标通过 `scope` 字段声明同步方式：

| scope | 行为 | 必需字段 | 可选字段 |
|---|---|---|---|
| `project` | 提示用户输入项目目录，写入到 `{项目目录}/{relativePath}` | `relativePath` | — |
| `global` | 写入固定的全局路径（支持 `~`） | `output` | — |
| `manual` | 打印规则全文到终端，不写文件 | — | `hint`、`chunkSize`（按字符数分片，适配粘贴上限） |

---

## 配置说明（`sync.config.json`）

```jsonc
{
  "source": "RULES.md",
  "banner": "<!-- 自动生成横幅 -->",
  "targets": [
    {
      "name": "Claude Code (项目级)",
      "scope": "project",
      "relativePath": "CLAUDE.md"
    },
    {
      "name": "Claude Code (全局)",
      "scope": "global",
      "output": "~/.claude/CLAUDE.md"
    },
    {
      "name": "Antigravity (未知路径，复制粘贴)",
      "scope": "manual",
      "hint": "路径未确认，请手动粘贴"
    }
  ]
}
```

### 默认目标

| 目标 | 作用域 | 路径 |
|---|---|---|
| Claude Code (项目级) | project | `{项目目录}/CLAUDE.md` |
| Claude Code (全局) | global | `~/.claude/CLAUDE.md` |
| Codex (项目级) | project | `{项目目录}/AGENTS.md` |
| Codex (全局) | global | `~/.codex/AGENTS.md` |
| Cline (项目级) | project | `{项目目录}/.clinerules/rules.md` |
| Trae (全局) | global | `~/.trae/user_rules/rules.md`，使用 `RULES_COMPACT.md` |
| Trae CN (全局) | global | `~/.trae-cn/user_rules/rules.md`，使用 `RULES_COMPACT.md` |
| Antigravity | manual | 打印全文供粘贴 |

### 新增工具

在 `targets` 数组追加一条即可，无需改脚本：

```jsonc
{
  "name": "MyTool (项目级)",
  "scope": "project",
  "relativePath": ".mytool/rules.md"
}
```

一旦确认 Antigravity 的规则文件路径，把 `scope` 从 `manual` 改为 `project` 或 `global`、补上 `relativePath` / `output` 即可。

---

## 日常工作流

```
修改 RULES.md  →  npm run sync  →  菜单选择目标  →  输入项目目录  →  提交 git
```

> **注意**：下游文件顶部自带自动生成横幅，**禁止直接编辑**，所有修改回到 `RULES.md`。

---

## 规则修改流程

1. 编辑 [`RULES.md`](./RULES.md)，添加/修改规则条目。
2. 同步更新**顶部版本号、最后更新日期、文末变更日志**。
3. 执行 `npm run sync:dry` 检查。
4. 执行 `npm run sync`，选择目标并输入项目目录。
5. `git commit` 提交 `RULES.md`。

---

## FAQ

**Q：项目级目标每次都要手动输入项目目录吗？**
A：一次运行内**只需输入一次**——同一次运行选择多个项目级目标时，第二个目标起会询问"是否复用上次目录 [Y/n]"。

**Q：能否跳过交互，直接写死目标？**
A：当前版本纯交互式。如需 CI / 非交互模式，可后续扩展 `--targets=1,3` 参数跳过菜单。

**Q：我想让某个工具只用部分规则？**
A：当前版本是全量分发。若有此需求，可后续扩展按二级标题切片分发。

**Q：Trae / Trae CN 规则为什么和其他工具不同？**
A：Trae 系列工具规则有 1000 字符上限，因此使用独立的精简源 `RULES_COMPACT.md`（≤1000 字符），直接写入 `~/.trae/user_rules/rules.md`。`RULES.md` 保持完整详细，`RULES_COMPACT.md` 手动维护精简版本，两者同步更新。

**Q：Antigravity 的规则路径是什么？**
A：暂未确认，默认为 `manual` 模式打印全文。确认路径后改配置即可。

**Q：下游文件能否直接编辑？**
A：**不能**。下游文件顶部已写入"自动生成"横幅；所有修改必须回到 `RULES.md`，否则下次 `sync` 会被覆盖。

---

## 版本

当前规则版本：见 [`RULES.md`](./RULES.md) 顶部 `版本` 字段与文末变更日志。
