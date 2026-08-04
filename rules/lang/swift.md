# Swift / iOS 规则

- 使用 **Swift 6+**，最低支持 **iOS 16+**。
- 遵循 [Swift API Design Guidelines](https://swift.org/documentation/api-design-guidelines/) 和苹果人机交互指南（HIG）。

## 安全约束（硬规则）

- **禁止强制解包 `!`**（IBOutlet 除外，且必须注释原因）；禁止 `as!` 强转，用 `as?` 配合安全处理。
- 闭包捕获 `self` 必须评估循环引用，默认使用 `[weak self]`；`[unowned self]` 仅限生命周期严格短于 self 的场景。
- UI 更新必须在**主线程**（`@MainActor` / `DispatchQueue.main`）。

## 框架与架构

- **优先使用 SwiftUI**，兼容 UIKit 代码。
- 架构采用 **MVVM**；响应式状态：新代码使用 **Observation（`@Observable`，需 iOS 17+）**，需兼容 iOS 16 时用 `ObservableObject`。**Combine 仅限维护已有代码，新代码不再引入**。
- 异步统一使用 **`async/await`**（Swift Concurrency），新代码禁止裸回调嵌套。
- 自动布局必须正确适配 **SafeArea**；禁止硬编码状态栏 / 底部安全区高度。
- 优先使用带关联值的 `enum` 表达状态（如 `Result` / `LoadState`）。

## 存储

- 敏感信息（Token、密码、证书）存 **Keychain**，禁止存 UserDefaults / 明文文件。
- 轻量非敏感数据用 **UserDefaults**。
- 结构化数据优先 **SwiftData / CoreData**（已有项目）或 **GRDB**（新项目按需选型）。

## 包管理

- 优先 **SPM**（Swift Package Manager）；已有 CocoaPods 工程保持现状，不做无收益迁移。
- 引入第三方依赖前必须评估：维护活跃度、License、包大小、是否与现有依赖冲突。

> 与 Flutter 桥接的相关规则见 `flutter.md` 的「原生桥接」一节。

## Swift 自检清单（追加到通用清单）

- [ ] 是否使用了 `!` 强解 / `as!` 强转
- [ ] 闭包捕获 self 是否处理循环引用（`[weak self]`）
- [ ] 新代码是否误引入 Combine / 裸回调嵌套（应为 `async/await` + Observation）
- [ ] 敏感信息是否走 **Keychain**（不在 UserDefaults / 明文）
- [ ] SafeArea 是否正确适配（无硬编码状态栏高度）
