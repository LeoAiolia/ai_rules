# 规则集变更日志

| 版本 | 日期 | 变更 |
|---|---|---|
| v2.0.0 | 2026-05-07 | **架构重构**：拆分为 `rules/global/`（通用规则，参与 sync）+ `rules/lang/`（平台规则，`/init` 时按需注入）；删除 `rules/compact.md` 双源（Trae 改为多文件分发）；变更日志独立到本文件；自检清单按通用 / 平台拆分 |
| v1.5.0 | 2026-05-07 | 新增「项目初始化文档结构（/init）」：AGENTS.md 写正文，CLAUDE.md 只写 `@AGENTS.md` 一行导入 |
| v1.4.0 | 2026-04-16 | 删除通用代码规范中的行业通用规则（魔法值、函数设计、命名规范、注释规范、异常处理、DRY 与可扩展）；重编号章节 |
| v1.3.0 | 2026-04-16 | 新增 Android 规则；扩展 Swift 规则（let 优先、[weak self]、SwiftUI、MVVM + Combine、async/await、Keychain、iOS 14+）；新增 Dart 空安全 / lints 要求；新增注释规范；AI 行为要求；自检清单补充废弃 API、内存泄漏、强转检查 |
| v1.2.0 | 2026-04-16 | 新增资源路径禁止拼接、UI 文案禁止拼接、Flutter TextStyle 必须显式 color |
| v1.1.0 | 2026-04-16 | 合并 Flutter 强制规范；新增 Cupertino 优先、rebuild 自检；统一 g_json 取值命名 |
| v1.0.0 | 2026-04-16 | 初始化规则集 |
