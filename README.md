# AI Rules

一份面向 **Flutter / iOS 开发** 的 AI 编程助手规则集，采用**单一事实源**方式维护，通过脚本同步到各 AI 工具（Claude Code / Codex / Cline / Trae / Antigravity 等）。

---

## 特性

- **单一事实源**：所有规则集中在 [`RULES.md`](./RULES.md)，版本化管理。
- **一键同步**：一条命令将规则分发到各 AI 工具的规则文件。
- **配置驱动**：通过 [`sync.config.json`](./sync.config.json) 按需启停目标，新增工具无需改脚本。
- **零依赖**：仅使用 Node.js 内置模块，无需 `npm install`。

---

## 目录结构

```
ai_rules/
├── RULES.md              # 规则单一事实源（唯一需要手动编辑的规则文件）
├── sync.config.json      # 同步目标配置（路径、启用状态）
├── scripts/
│   └── sync.js           # 同步脚本
├── package.json          # npm scripts 入口
└── README.md
```

---

## 快速开始

### 环境要求

- Node.js ≥ 16

### 首次使用

```bash
# 1. 预演，查看将生成哪些文件
npm run sync:dry

# 2. 正式同步
npm run sync
```

执行后，根据 `sync.config.json` 中 `enabled: true` 的目标，生成对应工具的规则文件。

---

## 常用命令

| 命令 | 作用 |
|---|---|
| `npm run sync` | 同步所有 `enabled: true` 的目标（日常使用） |
| `npm run sync:dry` | 仅打印计划，不写入文件（调试配置用） |
| `npm run sync:all` | 强制同步全部目标（含 `enabled: false`，偶尔全量使用） |

---

## 日常工作流

```
修改 RULES.md  →  npm run sync  →  下游文件自动更新  →  提交 git
```

> **注意**：下游文件（如 `CLAUDE.md`、`AGENTS.md`）顶部自带自动生成横幅，**禁止直接编辑**，所有修改回到 `RULES.md`。

---

## 配置说明（`sync.config.json`）

```jsonc
{
  "source": "RULES.md",         // 源文件路径
  "targets": [
    {
      "name": "Claude Code (项目级)",  // 展示名称
      "enabled": true,                 // 是否启用
      "output": "./CLAUDE.md"          // 输出路径（支持 ~、相对、绝对路径）
    }
    // ...
  ],
  "banner": "<!-- 自动生成横幅 -->"    // 写入下游文件顶部的说明
}
```

### 默认目标

| 目标 | 默认路径 | 默认启用 |
|---|---|---|
| Claude Code (项目级) | `./CLAUDE.md` | ✅ |
| Claude Code (全局) | `~/.claude/CLAUDE.md` | ❌ |
| Codex (项目级) | `./AGENTS.md` | ✅ |
| Codex (全局) | `~/.codex/AGENTS.md` | ❌ |
| Cline | `./.clinerules/rules.md` | ✅ |
| Trae | `./.trae/rules/project_rules.md` | ✅ |
| Antigravity | `./.antigravity/rules.md` | ❌（路径未确认） |

**切换项目级/全局**：把对应条目的 `enabled` 改为 `true` / `false` 即可。

**新增工具**：在 `targets` 数组里追加一条即可，无需改脚本。

---

## 在你的项目中使用

### 方案 A：作为外部工具，推到各项目

1. 在本目录调整 `sync.config.json` 的 `output` 为**目标项目的绝对路径**。
2. 执行 `npm run sync`。

### 方案 B：作为 git submodule 或 copy

1. 把 `RULES.md` / `sync.config.json` / `scripts/sync.js` / `package.json` 复制到目标项目根目录。
2. 调整配置后执行 `npm run sync`。

### 方案 C：全局安装

把 Claude Code / Codex 的全局目标启用：

```jsonc
{ "name": "Claude Code (全局)", "enabled": true, "output": "~/.claude/CLAUDE.md" }
```

---

## 规则修改流程

1. 编辑 [`RULES.md`](./RULES.md)，添加/修改规则条目。
2. 同步更新**顶部版本号、最后更新日期、文末变更日志**。
3. 执行 `npm run sync:dry` 检查。
4. 执行 `npm run sync` 生成下游文件。
5. `git commit` 提交 `RULES.md` 与下游文件。

---

## FAQ

**Q：我想让某个工具只用部分规则（比如只要通用 + Flutter，不要 Swift）？**
A：当前版本是全量分发。若有此需求，后续可扩展脚本支持 `sections: ['common', 'flutter']` 过滤（基于二级标题切片）。

**Q：Antigravity 的规则路径是什么？**
A：暂未确认。请核实后更新 `sync.config.json` 中对应条目的 `output`，然后将 `enabled` 设为 `true`。

**Q：下游文件能否直接编辑？**
A：**不能**。下游文件顶部已写入"自动生成"横幅；所有修改必须回到 `RULES.md`，否则下次 `sync` 会被覆盖。

---

## 版本

当前规则版本：见 [`RULES.md`](./RULES.md) 顶部 `版本` 字段与文末变更日志。
