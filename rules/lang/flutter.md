# Flutter / Dart 规则（强制）

所有代码必须优先保证：**可维护性、可扩展性、性能、清晰结构**。

## 语言基础

- **必须启用 Dart 空安全**（null safety），禁止 `!` 强制解包（除有明确保证的场景，且必须注释原因）。
- 遵循 `flutter_lints` 规范，`dart analyze` 必须**零警告**。
- 禁止使用已废弃的 Dart / Flutter API。

## Widget

- `build()` **仅允许 UI 代码**，禁止业务逻辑 / 复杂计算 / 网络请求。
- Widget 必须拆分为复用组件，避免单个 Widget 过大。
- 避免在 `build()` 中创建对象（优先 `const`）。
- **优先使用 Cupertino 风格组件**（iOS 为主）。

## 状态管理

- **禁止滥用 `setState`**（仅用于纯本地 UI 状态）。
- 全局 / 跨页状态必须使用统一的状态管理方案（Provider / Riverpod / GetX 等任选其一）。
- **同一项目内禁止混用多种方案**；具体选型在项目 `/init` 时由 `AGENTS.md` 锁定。
- 禁止多处修改同一状态；状态变更必须经由 ViewModel / Controller。

## 性能与内存

- 能用 `const` **必须**用（Widget、构造函数、集合字面量）。
- 避免不必要的 `rebuild`：合理使用 `const` / `Selector` / `ValueListenableBuilder`。
- 列表**必须使用 `ListView.builder` / `Sliver` 系列**（懒加载）。
- 图片加载须有缓存与占位。
- **避免内存泄漏**：`StreamSubscription`、`AnimationController`、`TextEditingController` 等必须在 `dispose()` 中释放。

## 网络（通用分层规范见 `20-common-code.md` 架构分层）

- HTTP 客户端默认使用 **Dio**；原生能力通过 **MethodChannel 桥接**（见下文）。
- 统一拦截器需覆盖：鉴权、超时、错误码、日志。

## 资源路径（强制：禁止字符串拼接）

- 图片、字体、JSON、Lottie 等资源路径**必须写成完整字面量**。
- 禁止动态拼接（如 `'assets/icons/$name.png'`、`"ic_" + type + ".png"`）。
- **原因**：Flutter 资源清理工具（`flutter_asset_cleaner` 等）通过静态字符串扫描判断资源引用，拼接路径会被误判为未使用而删除。
- **正确做法**：集中定义在资源常量类 / 枚举中。

```dart
// 正确：完整字面量
class AppAssets {
  static const iconHome = 'assets/icons/ic_home.png';
  static const iconMine = 'assets/icons/ic_mine.png';
}

// 错误：动态拼接
String iconOf(String name) => 'assets/icons/ic_$name.png'; // 禁止
```

## UI 文案（强制：禁止分段拼接）

- 界面上展示的字符串应**保持完整字面量**，便于出问题时全局搜索定位文件。
- 禁止 `"订单号：" + orderId + "，金额：" + amount + "元"` 这类分段拼接。
- 推荐使用整句模板（`'订单号：$orderId，金额：$amount 元'`），整句可被搜索命中。
- 多语言场景必须走 i18n key，禁止把 UI 字符串分词拼装。

## 文本样式（强制）

- 所有 `TextStyle` **必须显式设置 `color`**，禁止依赖默认色。
- **原因**：深色模式下默认色会随主题反转，未显式设置会导致展示不一致或不可见。
- 颜色必须取自主题 / 设计 Token（如 `AppColors.textPrimary`），禁止硬编码 `Color(0xFF...)`。

```dart
// 正确
Text('标题', style: TextStyle(fontSize: 16, color: AppColors.textPrimary))

// 错误：未设置 color
Text('标题', style: TextStyle(fontSize: 16))
```

## JSON 解析（强制使用 g_json）

**解析入口**

```dart
final json = JSON.parse(str);
// 或
final json = JSON(map);
```

**取值**

```dart
json['key'].stringValue
json['key'].integerValue
json['key'].booleanValue
json['a']['b'].stringValue  // 嵌套链式 / 路径访问
```

**Model 定义**

```dart
factory UserModel.fromJson(JSON json) => UserModel(
  id: json['id'].integerValue,
  name: json['name'].stringValue,
);
```

**禁止事项**

- 禁止 `jsonDecode` 直接解析业务数据
- 禁止手动 `Map<String, dynamic>` 取值
- 禁止 `as` 强制类型转换

**数据流**：`JSON 字符串 → g_json → Model`

## 原生桥接（含 iOS / Android）

- 原生能力通过 `MethodChannel` 暴露，channel name 全局唯一并集中维护（如 `AppChannels` 常量类）。
- iOS 侧入口集中在专用 `*Plugin.swift`，错误必须通过 `FlutterError` 回传，禁止吞异常。
- Android 侧入口集中在专用 `*Plugin.kt`，错误必须通过 `MethodChannel.Result.error(...)` 回传。
- Dart 侧必须包装为业务接口，调用方禁止直接持有 `MethodChannel`。
- 大数据量传输优先 `BasicMessageChannel` / `EventChannel`，避免序列化阻塞主线程。

## Flutter 自检清单（追加到通用清单）

- [ ] `build()` 是否包含业务逻辑
- [ ] 是否滥用 `setState`
- [ ] 是否存在不必要的 `rebuild`
- [ ] JSON 是否使用 **g_json**
- [ ] `TextStyle` 是否**显式设置 `color`**
- [ ] `const` 是否可加未加
- [ ] 列表是否使用 `builder`
- [ ] 资源路径是否为**完整字面量**（禁止拼接）
- [ ] UI 文案是否为**整句**（禁止分段拼接）
- [ ] `dispose()` 是否释放资源（Stream / Controller / Animation）
