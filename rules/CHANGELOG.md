# 规则集变更日志

| 版本 | 日期 | 变更 |
|---|---|---|
| v3.3.0 | 2026-11-03 | 三次瘦身：`99-init-protocol` 压缩；`00-meta` 仅留版本与用户画像；README 精简（架构与工作流归 AGENTS.md）；`lang/flutter` 压缩示例；`lang/android` 移除 minSdk/targetSdk（属项目级配置）；CHANGELOG 旧条目压缩 |
| v3.2.0 | 2026-11-03 | **二次瘦身**：`10-interaction` 删除「回答结构」模板及「确认技术栈 / 最佳实践补齐 / 不冗余 / 禁用废弃 API / 错误处理」等模型默认行为，保留 ≥2 方案、依赖审批、TODO 标注；`20-common-code` 日志仅留脱敏硬规则；`lang/*` 删除各平台自检清单（与正文重复）及 flutter_lints / const / rebuild / Widget 拆分 / 主线程 / 内存泄漏 / SafeArea 等默认行为条目 |
| v3.1.0 | 2026-08-04 | `10-interaction` 新增 Git 提交规则（禁止自动写操作、授权不延续、不主动 push） |
| v3.0.0 | 2026-08-04 | 强模型时代瘦身：删除行业通用规则与默认行为；清单压缩为 5 条；Swift 升级 6+/iOS 16+，Android targetSdk 36 |
| v2.x | 2026-05-07 | 拆分 `global`（sync）与 `lang`（/init 注入）；移除 ruler 与项目级分发；Trae 多文件分发 |
| v1.x | 2026-04-16 | 初始规则集：Flutter 强制规范、Android / Swift 规则、/init 文档结构 |
