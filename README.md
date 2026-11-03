# AI Rules

面向 Flutter / iOS 开发的 AI 编程助手规则集（单一事实源），通过脚本分发到各 AI 工具的**全局配置**。架构、修改规则的工作流见 [`AGENTS.md`](./AGENTS.md)，变更见 [`rules/CHANGELOG.md`](./rules/CHANGELOG.md)，当前版本见 `rules/global/00-meta.md`。

## 工具支持

| 工具 | 分发模式 | 输出位置 |
|---|---|---|
| Claude Code | 单文件（拼接） | `~/.claude/CLAUDE.md` |
| Codex | 单文件（拼接） | `~/.codex/AGENTS.md` |
| Trae | 多文件 | `~/.trae/user_rules/` |
| Trae CN | 多文件 | `~/.trae-cn/user_rules/` |

平台规则（`rules/lang/`）不参与 sync，由 AI 在项目执行 `/init` 时按 `99-init-protocol.md` inline 到项目 `AGENTS.md`。

## 使用

需要 Node.js ≥ 16。

```bash
npm run sync          # 交互式同步（输入 1,3 / 1-3 / a 全部 / q 退出）
npm run sync:dry      # 预演，不写入
./scripts/sync.sh     # 默认 dry-run；输入 r 进入正式写入
```

写入前会清理目标目录下匹配 `NN-*.md` 的旧文件，不动其他文件；源文件中的 `${AI_RULES_REPO}` 会被替换为本仓库绝对路径。

## 配置（`sync.config.json`）

```jsonc
{
  "source": "rules/global",
  "targets": [
    { "name": "Claude Code (全局)", "scope": "single", "output": "~/.claude/CLAUDE.md" },  // 拼接为单文件
    { "name": "Trae (全局)", "scope": "multi", "output": "~/.trae/user_rules" }             // 多文件复制到目录
  ]
}
```

新增工具：在 `targets` 加一条，按目标工具读单文件还是多文件选 `single` / `multi` 即可。

## FAQ

- **Claude Code 为什么直接写 `~/.claude/CLAUDE.md`？** 全局只读该文件；`@AGENTS.md` 导入层是项目级约定。
- **Trae 为什么多文件？** Trae 原生从 `user_rules/` 加载多个 `.md`。
- **项目级规则何时更新？** 在该项目重跑 `/init`（inline 注入的代价）。
