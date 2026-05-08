# 规则集变更日志

| 版本 | 日期 | 变更 |
|---|---|---|
| v2.2.0 | 2026-05-07 | **规则内容重构**：`20-common-code` 补回命名/魔法值/函数设计/DRY/异常处理；删除其中 Dart 专属的资源路径与 UI 文案小节并下沉到 `lang/flutter`；合并 `60-logging` 进 `20-common-code`（删除独立文件）；`90-checklist` 与规则严格对齐；`10-interaction` 细化"报错排查"与"≥2 方案"的适用语境；`lang/swift` 删除"与 Flutter 桥接"段（统一移到 `flutter.md` 的"原生桥接"），自检清单补全；`lang/android` 体量对齐（Coroutines/Compose/Hilt/Room/Keystore + 自检清单）；`99-init-protocol` 精细化语言识别（区分 iOS App 与 SPM、补 React Native、不识别时回落到询问）；`00-meta` 拆分 IDE 与 AI 工具 |
| v2.1.0 | 2026-05-07 | **分发架构简化**：移除 Cline / Antigravity；移除 ruler 依赖与项目级分发；只保留全局分发（Claude Code / Codex 单文件，Trae 多文件）；项目级规则注入由 AI 在 `/init` 时自助完成；适用范围 / 用户画像同步收敛 |
| v2.0.0 | 2026-05-07 | **架构重构**：拆分为 `rules/global/`（通用规则，参与 sync）+ `rules/lang/`（平台规则，`/init` 时按需注入）；删除 `rules/compact.md` 双源（Trae 改为多文件分发）；变更日志独立到本文件；自检清单按通用 / 平台拆分 |
| v1.5.0 | 2026-05-07 | 新增「项目初始化文档结构（/init）」：AGENTS.md 写正文，CLAUDE.md 只写 `@AGENTS.md` 一行导入 |
| v1.4.0 | 2026-04-16 | 删除通用代码规范中的行业通用规则（魔法值、函数设计、命名规范、注释规范、异常处理、DRY 与可扩展）；重编号章节 |
| v1.3.0 | 2026-04-16 | 新增 Android 规则；扩展 Swift 规则（let 优先、[weak self]、SwiftUI、MVVM + Combine、async/await、Keychain、iOS 14+）；新增 Dart 空安全 / lints 要求；新增注释规范；AI 行为要求；自检清单补充废弃 API、内存泄漏、强转检查 |
| v1.2.0 | 2026-04-16 | 新增资源路径禁止拼接、UI 文案禁止拼接、Flutter TextStyle 必须显式 color |
| v1.1.0 | 2026-04-16 | 合并 Flutter 强制规范；新增 Cupertino 优先、rebuild 自检；统一 g_json 取值命名 |
| v1.0.0 | 2026-04-16 | 初始化规则集 |
