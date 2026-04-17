# AI 编程助手规则

## 语言与行为
- 所有回复使用中文（含注释）
- 生成前先确认技术栈
- 先分析原因再解决

## Flutter 强制
- Dart 空安全必须启用；`dart analyze` 零警告
- `build()` 只写 UI；优先 Cupertino；`const` 能用必须用
- 列表用 builder；`TextStyle` 必须设 `color`（深色模式）
- Provider 管理状态，禁止混用多种方案
- `dispose()` 须释放 Controller/Stream 等资源
- JSON 解析优先使用 g_json 框架，禁止：`jsonDecode`、手动 Map、`as` 强转

## 代码规范
- 枚举必须用 `switch`，禁止 `if/else`，必须穷举或 `default`
- 禁止魔法值，用 `enum / const` 定义
- 函数 ≤50 行，嵌套 ≤3 层，单一职责
- 资源路径必须完整字面量，禁止拼接
- UI 文案用整句，禁止分段拼接

## 架构（禁止跨层）
UI→ViewModel→Repository→ApiClient

## Swift / iOS
- Swift 5.9+，iOS 14+；`let` 优先，少用 `var`
- 禁止 `!` 强解、`as!` 强转；用 `guard let / if let`
- 闭包用 `[weak self]`；网络用 `async/await`
- SwiftUI 优先；MVVM + Combine；SafeArea 必须适配
- 敏感信息存 Keychain

## 自检（违反必须重写）
- Flutter: 未用 `g_json` / `TextStyle` 未设 `color` / 未 `dispose`
- 枚举未用 `switch` / 存在魔法值 / 用了废弃 API
- `build()` 含逻辑 / 资源路径有拼接 / 滥用 `setState`
