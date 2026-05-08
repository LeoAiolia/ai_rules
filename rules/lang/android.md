# Android 规则（偶尔使用）

- 使用 **Kotlin**，开启空安全；禁止使用 `!!` 强制非空（极少数明确不为 null 的边界场景需注释原因）。
- 最低支持 **minSdk 29（Android 10）**，目标 **targetSdk 34**。
- 遵循 Material Design 规范。

## 架构

- 采用 **MVVM + Jetpack**：`ViewModel` + `StateFlow` / `LiveData`。
- 业务层用 **Repository** 隔离数据来源；UI 禁止直连 API。
- 依赖注入使用 **Hilt**（首选）；新增类必须支持 DI 以便测试。

## UI

- **新增 UI 优先使用 Jetpack Compose**；已有 XML 视图保持现状，不做无收益重写。
- 布局必须兼容多屏幕尺寸：使用 `ConstraintLayout`（XML）或 `Modifier` + 响应式宽高（Compose）。
- 字符串走 `strings.xml`，禁止硬编码到布局或代码中（i18n 兼容）。

## 异步

- 全部使用 **Kotlin Coroutines**（`viewModelScope` / `lifecycleScope`），禁止裸 `Thread` / `AsyncTask`。
- 网络请求使用 **Retrofit** + `suspend` 函数；图片加载使用 **Coil** 或 **Glide**。
- `Flow` 优先于 `LiveData`（新代码）；UI 层用 `collectAsStateWithLifecycle()` 收集。

## 数据存储

- 结构化数据使用 **Room**；轻量配置使用 **DataStore**（替代 SharedPreferences）。
- 敏感信息使用 **EncryptedSharedPreferences** 或 **Keystore**，禁止明文存储。

## 内存与生命周期

- `Activity` / `Fragment` 内引用必须避免泄漏：禁止持有 `View` 的强引用进入 ViewModel；禁止匿名内部类持有 `Activity` 上下文。
- 协程必须绑定生命周期作用域，禁止使用 `GlobalScope`。
- `Fragment` 中使用 `viewLifecycleOwner` 而非 `this` 观察 LiveData / Flow。

## 与 Flutter 桥接

参见 `flutter.md` 的「原生桥接」一节。Android 侧入口集中在 `*Plugin.kt`，错误通过 `MethodChannel.Result.error(...)` 回传。

## Android 自检清单（追加到通用清单）

- [ ] 是否使用了 `!!` 强制非空
- [ ] 是否裸 `Thread` / `AsyncTask`（应换为 Coroutines）
- [ ] 协程是否绑定生命周期作用域（不是 `GlobalScope`）
- [ ] `Fragment` 是否用 `viewLifecycleOwner` 观察数据流
- [ ] 字符串是否走 `strings.xml`
- [ ] 敏感数据是否避免明文存储
- [ ] 新 UI 是否优先 Compose
