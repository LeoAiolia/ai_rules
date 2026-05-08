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
- 全局 / 跨页状态**优先使用 Provider**，禁止在同一项目中混用多种状态管理方案。
- 禁止多处修改同一状态；状态变更必须经由 ViewModel / Controller。

## 性能与内存

- 能用 `const` **必须**用（Widget、构造函数、集合字面量）。
- 避免不必要的 `rebuild`：合理使用 `const` / `Selector` / `ValueListenableBuilder`。
- 列表**必须使用 `ListView.builder` / `Sliver` 系列**（懒加载）。
- 图片加载须有缓存与占位。
- **避免内存泄漏**：`StreamSubscription`、`AnimationController`、`TextEditingController` 等必须在 `dispose()` 中释放。

## 架构

- 分层：**UI / 业务 / 数据 / 网络**。
- UI **禁止直接调用 API**。
- 所有数据必须通过 **Repository**。

## 网络

- 禁止在 UI / 业务层写 HTTP。
- 必须统一 API 层（默认 **Dio**；原生能力通过 **MethodChannel 桥接**）。
- 必须处理：**异常、超时、错误码**。
- 统一拦截器：鉴权、超时、错误码、日志。

## 文本样式（强制）

- 所有 `TextStyle` **必须显式设置 `color`**，禁止依赖默认色。
- **原因**：深色模式下默认色会随主题反转，未显式设置会导致展示不一致。
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

## Flutter 自检清单（追加到通用清单）

- [ ] `build()` 是否包含业务逻辑
- [ ] 是否滥用 `setState`
- [ ] 是否存在不必要的 `rebuild`
- [ ] JSON 是否使用 **g_json**
- [ ] `TextStyle` 是否**显式设置 `color`**
- [ ] `const` 是否可加未加
- [ ] 列表是否使用 `builder`
- [ ] `dispose()` 是否释放资源（Stream / Controller / Animation）
