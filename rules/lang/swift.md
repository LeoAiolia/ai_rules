# Swift / iOS 规则

- 使用 **Swift 5.9+**，最低支持 **iOS 14+**。
- 遵循 [Swift API Design Guidelines](https://swift.org/documentation/api-design-guidelines/) 和苹果人机交互指南（HIG）。

## 变量与类型

- **优先用 `let`，少用 `var`**；只有确实需要可变时才使用 `var`。
- **禁止强制解包 `!`**（IBOutlet 除外，且必须注释原因）。
- 禁止强制类型转换（`as!`）；必须使用条件转换（`as?`）配合安全处理。
- 可选值必须使用 `guard let` / `if let` / `??` 安全处理。
- 值类型（`struct`）优先于引用类型（`class`）。

## 内存管理

- Block / 闭包中**必须使用 `[weak self]`** 防止循环引用。
- 使用 `[unowned self]` 前必须确保生命周期，否则一律用 `[weak self]`。

## 线程

- UI 更新必须在**主线程**（`DispatchQueue.main` / `@MainActor`）。
- 耗时操作必须派发到后台队列。
- 网络请求使用 **`async/await`**（Swift Concurrency）。

## 框架与架构

- **优先使用 SwiftUI**，兼容 UIKit 代码。
- 架构采用 **MVVM + Combine**。
- 自动布局必须正确适配 **SafeArea**；禁止硬编码状态栏 / 底部安全区高度。
- 优先使用带关联值的 `enum` 表达状态（如 `Result` / `LoadState`）。

## 存储

- 敏感信息（Token、密码、证书）存 **Keychain**，禁止存 UserDefaults / 明文文件。
- 轻量非敏感数据用 **UserDefaults**。

## 与 Flutter 桥接

- 原生能力通过 `FlutterMethodChannel` 暴露，入口集中在专用 `*Plugin.swift`。
- 错误必须通过 `FlutterError` 回传，禁止吞异常。

## Swift 自检清单（追加到通用清单）

- [ ] 是否 `let` 优先（不必要的 `var` 改为 `let`）
- [ ] 闭包是否 `[weak self]`
- [ ] UI 更新是否在主线程
- [ ] 是否用了 `!` 强解 / `as!` 强转
