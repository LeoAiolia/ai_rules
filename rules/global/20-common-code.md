# 通用代码规范

## 枚举处理（强制）

- 枚举判断**必须使用 `switch`**，禁止 `if/else`。
- 必须穷举所有 case；无法穷举时必须提供 `default`。

## 架构分层（禁止跨层调用）

```
UI 层  ->  业务层 (ViewModel/Controller)  ->  数据层 (Repository)  ->  网络层 (ApiClient)
```

- UI 层**禁止**直接调用 API / 写 HTTP / 写业务逻辑。
- 所有数据必须通过 **Repository** 获取。
- 所有 API 必须走**统一封装层**，统一处理异常、超时、错误码。
- 响应数据必须映射为 Model。

## 资源路径与 UI 文案（强制）

**资源路径：禁止字符串拼接**

- 图片、字体、JSON、Lottie 等资源路径**必须写成完整字面量**。
- 禁止动态拼接（如 `'assets/icons/$name.png'`、`"ic_" + type + ".png"`）。
- **原因**：资源清理工具通过静态字符串扫描判断资源引用，拼接路径会被误判为未使用而删除。
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

**UI 文案：禁止拼接**

- 界面上展示的字符串应**尽量保持完整字面量**，便于出问题时全局搜索定位。
- 推荐：使用带占位符的整句模板（`'订单号：$orderId，金额：$amount 元'`）。
- 多语言场景必须走 i18n key，禁止把 UI 字符串分词拼装。
