# Android 规则

- 使用 **Kotlin**，开启空安全；禁止使用 `!!` 强制非空（极少数明确不为 null 的边界场景需注释原因）。

## 架构（通用分层规范见 `20-common-code.md` 架构分层）

- 采用 **MVVM + Jetpack**：`ViewModel` + `StateFlow` / `LiveData`。
- 依赖注入使用 **Hilt**（首选）；新增类必须支持 DI 以便测试。

## UI

- **新增 UI 优先使用 Jetpack Compose**；已有 XML 视图保持现状，不做无收益重写。
- 字符串走 `strings.xml`，禁止硬编码。

## 异步

- 全部使用 **Kotlin Coroutines**（`viewModelScope` / `lifecycleScope`），禁止裸 `Thread` / `AsyncTask`。
- `Flow` 优先于 `LiveData`（新代码）。

## 数据存储

- 结构化数据使用 **Room**；轻量配置使用 **DataStore**（替代 SharedPreferences）。
- 敏感信息使用 **Android Keystore**（加密场景配合 **Tink**），禁止明文存储；`EncryptedSharedPreferences` 已废弃，禁止使用。

## 生命周期

- 协程必须绑定生命周期作用域，禁止使用 `GlobalScope`。

## 与 Flutter 桥接

参见 `flutter.md` 的「原生桥接」一节。Android 侧入口集中在 `*Plugin.kt`，错误通过 `MethodChannel.Result.error(...)` 回传。
