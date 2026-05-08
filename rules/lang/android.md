# Android 规则（偶尔使用）

- 使用 **Kotlin**，开启空安全。
- 架构采用 **MVVM + Jetpack**（ViewModel + LiveData / StateFlow）。
- 最低支持 **minSdk 29（Android 10）**，目标 **targetSdk 34**。
- 避免内存泄漏：Activity / Fragment 中注意 ViewModel 和 LiveData 的生命周期绑定。
- 布局必须兼容多屏幕尺寸，使用 ConstraintLayout / 响应式布局。
- 遵循 Material Design 规范。
