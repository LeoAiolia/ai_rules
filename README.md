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
| Trae | 自定义脚本 | 写入全局 `~/.trae/user_rules/rules.md` |
| Trae CN | 自定义脚本 | 写入全局 `~/.trae-cn/user_rules/rules.md` |

---

## 目录结构

```
ai_rules/
├── rules/
│   ├── full.md           # 规则单一事实源（唯一需要手动编辑的规则文件）
│   └── compact.md        # Trae 专用精简版（≤1000 字符，与 full.md 同步维护）
├── .ruler/
│   ├── AGENTS.md         # 由 sync.js 从 rules/full.md 自动生成，ruler 读取此文件
│   └── ruler.toml        # ruler 配置（MCP 已关闭）
├── sync.config.json      # 同步目标配置
├── scripts/
│   ├── sync.js           # 交互式同步脚本
│   └── sync.sh           # 选择 dry-run / 正式写入的便捷入口
├── AGENTS.md             # 项目自描述（给 AI 看）
├── CLAUDE.md             # @AGENTS.md 导入层
├── package.json
└── README.md
```

---

## 快速开始

### 环境要求

- Node.js ≥ 16
- ruler（ruler 管理的工具需要）：`npm install -g @intellectronica/ruler`

### 运行

```bash
npm run sync        # 交互式同步
npm run sync:dry    # 预演，不写入
```

> 如未安装 ruler，选择 ruler 管理的目标时脚本会提示并报错；Trae / Trae CN 无需 ruler。

---

## 交互流程

**步骤 1：选择目标**

```
==== 可同步的目标 ====
   1. Claude Code  [ruler → agent: claude]
   2. Codex        [ruler → agent: codex]
   3. Cline        [ruler → agent: cline]
   4. Antigravity  [ruler → agent: antigravity]
   5. Trae (全局)  [全局 → ~/.trae/user_rules/rules.md]
   6. Trae CN (全局)  [全局 → ~/.trae-cn/user_rules/rules.md]

输入示例：1,3  或  1-3  或  a（全部）  或  q（退出）
```

支持的输入格式：

| 输入 | 含义 |
|---|---|
| `1,3,5` | 选择第 1、3、5 项 |
| `1-4` | 选择第 1~4 项 |
| `a` 或 `all` | 选择全部 |
| `q` 或 `quit` | 退出 |

**步骤 2：ruler 目标 → 输入目标项目目录**

```
请输入项目根目录绝对路径: /Users/xxx/projects/my-flutter-app
```

同一次运行中若选择多个 ruler 目标，脚本询问是否**复用**上次的目录。

**步骤 3：Trae / Trae CN → 直接写入全局路径**

无需额外操作，脚本直接写入 `~/.trae/user_rules/rules.md`。

---

## 同步机制说明

### ruler 管理的工具（Claude Code / Codex / Cline / Antigravity）

```
rules/full.md  →（sync.js）→  .ruler/AGENTS.md  →（ruler apply）→  目标项目规则文件
```

1. sync.js 将 `rules/full.md` 内容（去除变更日志）写入 `.ruler/AGENTS.md`
2. 执行 `ruler apply --agents <agent> --project-root <目标目录>`
3. ruler 把 `.ruler/AGENTS.md` 内容写入目标项目对应的规则文件

### Trae / Trae CN（自定义管理）

```
rules/compact.md  →（sync.js）→  ~/.trae/user_rules/rules.md
```

直接写文件，规则使用精简版（≤1000 字符，符合 Trae 限制）。

---

## 日常工作流

```
修改 rules/full.md（及 rules/compact.md）→  npm run sync  →  选择目标  →  输入项目目录  →  完成
```

> `.ruler/AGENTS.md` 由脚本自动生成，**禁止直接编辑**。

---

## 规则修改流程

1. 编辑 [`rules/full.md`](./rules/full.md)（完整规则）
2. 如有影响核心内容，同步编辑 [`rules/compact.md`](./rules/compact.md)（Trae 精简版）
3. 更新 `rules/full.md` 顶部版本号、日期、文末变更日志
4. 执行 `npm run sync:dry` 预览
5. 执行 `npm run sync` 同步到各工具

---

## 配置说明（`sync.config.json`）

```jsonc
{
  "source": "rules/full.md",     // 全局默认源文件
  "targets": [
    {
      "name": "Claude Code",
      "scope": "ruler",          // 由 ruler 管理
      "agent": "claude"          // ruler 的 agent 标识符
    },
    {
      "name": "Trae (全局)",
      "scope": "global",         // 直接写入固定路径
      "source": "rules/compact.md",  // 覆盖默认源
      "output": "~/.trae/user_rules/rules.md"
    }
  ]
}
```

### scope 说明

| scope | 行为 | 必需字段 |
|---|---|---|
| `ruler` | 调用 `ruler apply`，需要用户指定目标项目目录 | `agent` |
| `global` | 直接写入固定路径 | `output` |

### 新增工具

在 `targets` 添加一条，`scope: ruler` 并填入 ruler 支持的 agent 标识符即可，无需改脚本。ruler 支持的工具列表见 [ruler 仓库](https://github.com/intellectronica/ruler)。

---

## FAQ

**Q：如何安装 ruler？**
A：`npm install -g @intellectronica/ruler`。仅同步 ruler 管理的工具时需要，Trae / Trae CN 不需要。

**Q：项目级目标每次都要输入项目目录吗？**
A：同一次运行内只需输入一次，后续 ruler 目标会询问"是否复用上次目录 [Y/n]"。

**Q：Trae 为什么单独管理？**
A：ruler 对 Trae 只支持项目级规则（`.trae/rules/`），而 Trae 的全局规则路径（`~/.trae/user_rules/`）和字符上限需要额外处理，因此保留自定义逻辑。

**Q：`.ruler/AGENTS.md` 和 `rules/full.md` 有什么区别？**
A：内容基本相同，区别是 `.ruler/AGENTS.md` 由脚本自动生成，去除了变更日志（对 AI 无意义）。编辑时只修改 `rules/full.md`。

---

## 版本

当前规则版本：见 [`rules/full.md`](./rules/full.md) 顶部 `版本` 字段与文末变更日志。
