# 项目初始化（/init）协议

## 文档结构

- **`AGENTS.md`**：写全部正文（项目简介、常用命令、架构概览、约定 + 注入的平台规则），是跨工具共享的事实源。
- **`CLAUDE.md`**：只写一行 `@AGENTS.md`。项目仓库只跟踪 `AGENTS.md`。
- 已有 `AGENTS.md` 的项目只改 `AGENTS.md`；已有 `CLAUDE.md` 且内容是正文的，建议迁移到 `AGENTS.md` 后改成 `@AGENTS.md`。

## 平台规则注入

按下表识别主平台（可命中多个），把对应源文件**完整内容 inline** 追加到项目根 `AGENTS.md`，多个之间用 `---` 分隔。

| 平台 | 触发条件 | 源文件 |
|---|---|---|
| Flutter | `pubspec.yaml` 含 `flutter:` | `${AI_RULES_REPO}/rules/lang/flutter.md` |
| iOS App | `*.xcodeproj` / `*.xcworkspace` / `Podfile` | `${AI_RULES_REPO}/rules/lang/swift.md` |
| Android | `build.gradle*` / `settings.gradle*` 且有 `android/` 目录或 `applicationId` | `${AI_RULES_REPO}/rules/lang/android.md` |
| React Native | `package.json` 依赖含 `react-native`，且有 `ios/` + `android/` | 暂无规则文件 |

不要识别为目标平台：

- 仅有 `Package.swift` 无 `*.xcodeproj` → Swift Package，不注入 iOS 规则。
- Flutter 项目自带的 `ios/` / `android/` → 已被 Flutter 覆盖，不额外注入（除非用户明确要做原生定制）。

无法识别时直接询问用户，不要猜。

> 用 inline 而非 `@import`：各工具对 `@filepath` 支持不一致，inline 保证项目自给自足；代价是规则更新后需重跑 `/init`。
