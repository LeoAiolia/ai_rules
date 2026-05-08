# 项目初始化（/init）协议

## AGENTS.md / CLAUDE.md 文档结构

执行 `/init`（或为新项目创建 AI 指引文档）时，统一采用以下结构：

- **`AGENTS.md`**：写所有正文内容（项目简介、常用命令、架构概览、约定等）。这是事实源，供多个 AI 工具（Claude Code / Codex / Antigravity / Trae 等）共享。
- **`CLAUDE.md`**：只写一行 `@AGENTS.md`，作为薄导入层。

**原因**：避免在多个 AI 工具的指引文件里重复维护同一份内容；保持跨工具一致性。

**适用场景**：

- 新项目第一次跑 `/init` 时默认按此模式落地。
- 已有 `AGENTS.md` 的项目：只改 `AGENTS.md`，不要把内容塞进 `CLAUDE.md`。
- 已有 `CLAUDE.md` 但内容是正文的项目：建议把正文迁移到 `AGENTS.md`，并把 `CLAUDE.md` 改成 `@AGENTS.md`。

## 平台规则按需注入

执行 `/init` 时，除项目自身描述外，还要从规则仓库注入**对应平台的规则**：

### 1. 识别项目主语言

- 存在 `pubspec.yaml` → **Flutter**
- 存在 `Podfile` 或 `*.xcodeproj` 或 `Package.swift` → **iOS / Swift**
- 存在 `build.gradle` 或 `settings.gradle` → **Android**

多语言项目按需识别多个。

### 2. 拉取并追加平台规则

把以下文件**完整内容**追加到项目根 `AGENTS.md`（用一行 `---` 与上文隔开）：

| 平台 | 源文件路径 |
|---|---|
| Flutter | `~/Documents/yxr/ai_rules/rules/lang/flutter.md` |
| iOS | `~/Documents/yxr/ai_rules/rules/lang/swift.md` |
| Android | `~/Documents/yxr/ai_rules/rules/lang/android.md` |

多平台项目按顺序追加多个文件，每个之间用 `---` 分隔。

### 3. 维护 CLAUDE.md

`CLAUDE.md` 始终只写一行 `@AGENTS.md`，不直接放规则内容。

### 为什么用 inline 而不是 `@import`

当前下游工具（Codex / Trae 等）对 `@filepath` 语法支持不一致；inline 内容保证所有工具都能读到，且项目自给自足，离开规则仓库也能正常工作。代价是规则更新后需要重新跑 `/init` 同步——这是有意识的取舍。
