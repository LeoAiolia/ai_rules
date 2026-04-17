# AI 编程助手规则（RULES.md）

> **版本**：v1.2.0
> **最后更新**：2026-04-16
> **维护人**：run
> **适用范围**：Claude Code / Codex / Antigravity / Trae / Cline

---

## 0. 使用说明

- 本文件为**单一事实源**（Single Source of Truth）。
- 各 AI 工具的规则文件由 `scripts/sync.js` 从本文件生成，**禁止直接修改下游文件**。
- 修改规则时必须同步更新顶部 `版本` 与 `最后更新` 字段。

---

## 1. 用户画像

| 项目 | 内容 |
|---|---|
| 主要语言 | Dart / Swift |
| 开发方向 | Flutter 跨平台（iOS 为主，兼顾 Android） |
| 常用 IDE | Claude Code / VS Code / Xcode / Antigravity / Trae |

---

## 2. 通用交互规范

### 2.1 回复语言

- 所有回复**必须使用中文**，包括：代码注释、错误分析、解释、建议。
- 变量 / 函数 / 类名使用英文。
- 报错排查：**先分析原因，再给解决方案**，不得直接改代码。

### 2.2 回答结构

1. **方案思路**（简述思路、权衡点）
2. **代码实现**（完整可运行片段）
3. **复杂问题**必须给出 **≥2 个方案对比**（优缺点、适用场景）

### 2.3 不确定性处理

当 AI 对 API 命名、字段、业务逻辑存在**推断**时：

- 代码中添加 `// TODO: [需确认] 具体疑问`
- 回复末尾列出**待确认清单**
- **禁止**用猜测填充不确定项

### 2.4 禁止事项

- 禁止随意引入新依赖（引入前必须说明理由 + 替代方案）
- 禁止过度封装（YAGNI 原则）
- 禁止省略错误处理
- 禁止生成未经验证的 API 调用

---

## 3. 通用代码规范

### 3.1 枚举处理（强制）

- 枚举判断**必须使用 `switch`**，禁止 `if/else`。
- 必须穷举所有 case；无法穷举时必须提供 `default`。

### 3.2 禁止魔法值

- 禁止魔法数字 / 硬编码字符串。
- 常量必须通过 **枚举 / `const` / 配置对象** 定义。

### 3.3 函数设计

| 约束 | 要求 |
|---|---|
| 单一职责 | 一个函数只做一件事 |
| 最大长度 | ≤ 50 行 |
| 最大嵌套 | ≤ 3 层 |
| 超限处理 | 拆分为多个私有小函数 |

### 3.4 命名规范

- 禁止无意义命名（`a` / `b` / `temp` / `data1`）。
- 布尔变量前缀：`is` / `has` / `should` / `can`。
- 命名必须语义自解释，优先于写注释。

### 3.5 异常处理

- 所有异步操作必须处理错误，禁止空 `catch`。
- 必须有**兜底分支** + **日志记录**。
- 关键路径日志须包含：**输入参数**、**状态**、**错误栈**。

### 3.6 架构分层（禁止跨层调用）

```
UI 层  ->  业务层 (ViewModel/Controller)  ->  数据层 (Repository)  ->  网络层 (ApiClient)
```

- UI 层**禁止**直接调用 API / 写 HTTP / 写业务逻辑。
- 所有数据必须通过 **Repository** 获取。
- 所有 API 必须走**统一封装层**，统一处理异常、超时、错误码。
- 响应数据必须映射为 Model。

### 3.7 资源路径与 UI 文案（强制）

**资源路径：禁止字符串拼接**

- 图片、字体、JSON、Lottie 等资源路径**必须写成完整字面量**。
- 禁止动态拼接（如 `'assets/icons/$name.png'`、`"ic_" + type + ".png"`）。
- **原因**：资源清理工具（`flutter_asset_cleaner` / Xcode `Unused Resources` 等）通过静态字符串扫描判断资源引用，拼接路径会被误判为未使用而删除。
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

- 界面上展示的字符串应**尽量保持完整字面量**，便于出问题时全局搜索定位文件。
- 禁止 `"订单号：" + orderId + "，金额：" + amount + "元"` 这类分段拼接。
- **推荐**：使用带占位符的整句模板（`sprintf` / `intl` / `'订单号：$orderId，金额：$amount 元'`），整句可被搜索命中。
- 多语言场景必须走 i18n key，禁止把 UI 字符串分词拼装。

### 3.8 DRY 与可扩展

- 禁止重复代码；≥2 处相同逻辑必须抽取。
- 禁止写死分支逻辑，优先 **枚举驱动 / 策略模式**。
- 所有依赖必须支持注入（DI），保证可测试。

---

## 4. Flutter / Dart 规则（强制）

所有代码必须优先保证：**可维护性、可扩展性、性能、清晰结构**。

### 4.1 Widget

- `build()` **仅允许 UI 代码**，禁止业务逻辑 / 复杂计算 / 网络请求。
- Widget 必须拆分，避免过大。
- 避免在 `build()` 中创建对象（优先 `const`）。
- **优先使用 Cupertino 风格组件**（iOS 为主）。

### 4.2 状态管理

- **禁止滥用 `setState`**。
- 状态必须集中管理（**Provider / GetX**，由具体项目确定选型）。
- 禁止多处修改同一状态；状态变更必须经由 ViewModel / Controller。

### 4.3 性能

- 能用 `const` **必须**用（Widget、构造函数、集合字面量）。
- 避免不必要的 `rebuild`：合理使用 `const` / `Selector` / `ValueListenableBuilder`。
- 列表**必须使用 `ListView.builder` / `Sliver` 系列**。
- 图片加载须有缓存与占位。

### 4.4 架构

- 分层：**UI / 业务 / 数据 / 网络**。
- UI **禁止直接调用 API**。
- 所有数据必须通过 **Repository**。

### 4.5 网络

- 禁止在 UI / 业务层写 HTTP。
- 必须统一 API 层（默认 **Dio**；原生能力通过 **MethodChannel 桥接**）。
- 必须处理：**异常、超时、错误码**。
- 统一拦截器：鉴权、超时、错误码、日志。

### 4.6 文本样式（强制）

- 所有 `TextStyle` **必须显式设置 `color`**，禁止依赖默认色。
- **原因**：深色模式下默认色会随主题反转，未显式设置会导致亮/暗模式展示不一致或文字不可见。
- 颜色必须取自主题 / 设计 Token（如 `Theme.of(context).colorScheme.onSurface` 或项目自定义 `AppColors.textPrimary`），禁止硬编码 `Color(0xFF...)`。

```dart
// 正确
Text(
  '标题',
  style: TextStyle(
    fontSize: 16,
    color: AppColors.textPrimary, // 必须显式指定
  ),
)

// 错误：未设置 color，深色模式下可能不可见
Text('标题', style: TextStyle(fontSize: 16))
```

### 4.7 JSON 解析（强制使用 g_json）

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

---

## 5. Swift / iOS 规则

### 5.1 Optional

- **禁止强制解包 `!`**（IBOutlet 除外，且必须注释原因）。
- 必须使用 `guard let` / `if let` / `??`。

### 5.2 线程

- UI 更新必须在**主线程**（`DispatchQueue.main` / `@MainActor`）。
- 耗时操作必须派发到后台队列。

### 5.3 类型与状态

- 优先使用带关联值的 `enum` 表达状态（如 `Result` / `LoadState`）。
- 值类型（`struct`）优先于引用类型（`class`）。

### 5.4 与 Flutter 桥接

- 原生能力通过 `FlutterMethodChannel` 暴露，入口集中在专用 `*Plugin.swift`。
- 错误必须通过 `FlutterError` 回传，禁止吞异常。

---

## 6. 日志规范

- 关键路径必打日志：入参、出参、耗时、错误。
- 日志分级：`debug` / `info` / `warn` / `error`。
- 禁止打印敏感信息（Token、密码、手机号明文）。

---

## 7. 输出前自检清单（强制）

AI 在输出代码前必须逐项核对：

- [ ] `build()` 是否包含业务逻辑
- [ ] 是否滥用 `setState`
- [ ] 是否存在不必要的 `rebuild`
- [ ] JSON 是否使用 **g_json**
- [ ] 枚举是否使用 `switch` 且穷举/兜底
- [ ] 是否存在**魔法值**
- [ ] 函数是否 ≤50 行、≤3 层嵌套、单一职责
- [ ] 是否处理了所有异步异常
- [ ] 是否违反**分层**（UI 直连网络 / UI 直连 API）
- [ ] 资源路径是否为**完整字面量**（禁止拼接）
- [ ] UI 文案是否为**整句**（禁止分段拼接，便于搜索定位）
- [ ] Flutter `TextStyle` 是否**显式设置 `color`**（适配深色模式）
- [ ] Flutter：是否 `const` 可加未加 / 列表是否 `builder`
- [ ] Swift：是否存在 `!` 强解 / UI 是否在主线程
- [ ] 不确定项是否标注 `// TODO: [需确认]`

**违反任一项必须先修正再输出。**

---

## 8. 变更日志

| 版本 | 日期 | 变更 |
|---|---|---|
| v1.0.0 | 2026-04-16 | 初始化规则集 |
| v1.1.0 | 2026-04-16 | 合并 Flutter 强制规范；新增 Cupertino 优先、rebuild 自检；统一 g_json 取值命名（integerValue/booleanValue） |
| v1.2.0 | 2026-04-16 | 新增资源路径禁止拼接、UI 文案禁止拼接、Flutter TextStyle 必须显式 color 三条强制规则 |
