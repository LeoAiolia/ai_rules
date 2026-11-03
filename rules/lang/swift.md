# Swift / iOS 规则

- 使用 **Swift 6+**，最低支持 **iOS 16+**。

## 安全约束（硬规则）

- **禁止强制解包 `!`**（IBOutlet 除外，且必须注释原因）；禁止 `as!` 强转，用 `as?` 配合安全处理。
- 闭包捕获 `self` 必须评估循环引用，默认使用 `[weak self]`；`[unowned self]` 仅限生命周期严格短于 self 的场景。

## 框架与架构

- **优先使用 SwiftUI**，兼容 UIKit 代码。
- 架构采用 **MVVM**；响应式状态：新代码使用 **Observation（`@Observable`，需 iOS 17+）**，需兼容 iOS 16 时用 `ObservableObject`。**Combine 仅限维护已有代码，新代码不再引入**。
- 异步统一使用 **`async/await`**（Swift Concurrency），新代码禁止裸回调嵌套。
- 禁止硬编码状态栏 / 底部安全区高度。

## 存储

- 敏感信息（Token、密码、证书）存 **Keychain**，禁止存 UserDefaults / 明文文件。
- 结构化数据优先 **SwiftData / CoreData**（已有项目）或 **GRDB**（新项目按需选型）。

## 包管理

- 优先 **SPM**（Swift Package Manager）；已有 CocoaPods 工程保持现状，不做无收益迁移。

> 与 Flutter 桥接的相关规则见 `flutter.md` 的「原生桥接」一节。
