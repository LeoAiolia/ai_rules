# AI 编程助手规则（RULES.md）

> **版本**：v1.5.0
> **最后更新**：2026-05-07
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

### 2.4 AI 行为要求

- 生成代码前**先确认技术栈**（Flutter / iOS / Android），避免生成错误平台代码。
- 没有说明细节时，**自动按最佳实践补齐**，不询问重复问题。
- 不生成冗余代码，保持风格统一、专业、可直接上线使用。
- 禁止随意引入新依赖（引入前必须说明理由 + 替代方案）。
- 禁止省略错误处理，禁止生成未经验证的 API 调用。
- **禁止使用已废弃 API**，必须使用当前版本推荐的替代方案。

### 2.5 项目初始化文档结构（/init）

执行 `/init`（或为新项目创建 AI 指引文档）时，统一采用以下结构：

- **`AGENTS.md`**：写所有正文内容（项目简介、常用命令、架构概览、约定等）。这是事实源，供多个 AI 工具（Claude Code / Codex / Antigravity / Trae 等）共享。
- **`CLAUDE.md`**：只写一行 `@AGENTS.md`，作为薄导入层。

**原因**：避免在多个 AI 工具的指引文件里重复维护同一份内容；保持跨工具一致性。

**适用场景**：

- 新项目第一次跑 `/init` 时默认按此模式落地。
- 已有 `AGENTS.md` 的项目：只改 `AGENTS.md`，不要把内容塞进 `CLAUDE.md`。
- 已有 `CLAUDE.md` 但内容是正文的项目：建议把正文迁移到 `AGENTS.md`，并把 `CLAUDE.md` 改成 `@AGENTS.md`。

---

## 3. 通用代码规范

### 3.1 枚举处理（强制）

- 枚举判断**必须使用 `switch`**，禁止 `if/else`。
- 必须穷举所有 case；无法穷举时必须提供 `default`。



### 3.2 架构分层（禁止跨层调用）

```
UI 层  ->  业务层 (ViewModel/Controller)  ->  数据层 (Repository)  ->  网络层 (ApiClient)
```

- UI 层**禁止**直接调用 API / 写 HTTP / 写业务逻辑。
- 所有数据必须通过 **Repository** 获取。
- 所有 API 必须走**统一封装层**，统一处理异常、超时、错误码。
- 响应数据必须映射为 Model。

### 3.3 资源路径与 UI 文案（强制）

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



## 3.4 Flutter / Dart 规则（强制）

所有代码必须优先保证：**可维护性、可扩展性、性能、清晰结构**。

### 3.5 语言基础

- **必须启用 Dart 空安全**（null safety），禁止 `!` 强制解包（除有明确保证的场景，且必须注释原因）。
- 遵循 `flutter_lints` 规范，`dart analyze` 必须**零警告**。
- 禁止使用已废弃的 Dart / Flutter API。

### 3.6 Widget

- `build()` **仅允许 UI 代码**，禁止业务逻辑 / 复杂计算 / 网络请求。
- Widget 必须拆分为复用组件，避免单个 Widget 过大。
- 避免在 `build()` 中创建对象（优先 `const`）。
- **优先使用 Cupertino 风格组件**（iOS 为主）。

### 3.7 状态管理

- **禁止滥用 `setState`**（仅用于纯本地 UI 状态）。
- 全局 / 跨页状态**优先使用 Provider**，禁止在同一项目中混用多种状态管理方案。
- 禁止多处修改同一状态；状态变更必须经由 ViewModel / Controller。

### 3.8 性能与内存

- 能用 `const` **必须**用（Widget、构造函数、集合字面量）。
- 避免不必要的 `rebuild`：合理使用 `const` / `Selector` / `ValueListenableBuilder`。
- 列表**必须使用 `ListView.builder` / `Sliver` 系列**（懒加载）。
- 图片加载须有缓存与占位。
- **避免内存泄漏**：`StreamSubscription`、`AnimationController`、`TextEditingController` 等必须在 `dispose()` 中释放。

### 3.9 架构

- 分层：**UI / 业务 / 数据 / 网络**。
- UI **禁止直接调用 API**。
- 所有数据必须通过 **Repository**。

### 3.10 网络

- 禁止在 UI / 业务层写 HTTP。
- 必须统一 API 层（默认 **Dio**；原生能力通过 **MethodChannel 桥接**）。
- 必须处理：**异常、超时、错误码**。
- 统一拦截器：鉴权、超时、错误码、日志。

### 3.11 文本样式（强制）

- 所有 `TextStyle` **必须显式设置 `color`**，禁止依赖默认色。
- **原因**：深色模式下默认色会随主题反转，未显式设置会导致展示不一致。
- 颜色必须取自主题 / 设计 Token（如 `AppColors.textPrimary`），禁止硬编码 `Color(0xFF...)`。

```dart
// 正确
Text('标题', style: TextStyle(fontSize: 16, color: AppColors.textPrimary))

// 错误：未设置 color
Text('标题', style: TextStyle(fontSize: 16))
```

### 3.12 JSON 解析（强制使用 g_json）

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

## 4. Swift / iOS 规则

- 使用 **Swift 5.9+**，最低支持 **iOS 14+**。
- 遵循 [Swift API Design Guidelines](https://swift.org/documentation/api-design-guidelines/) 和苹果人机交互指南（HIG）。

### 4.1 变量与类型

- **优先用 `let`，少用 `var`**；只有确实需要可变时才使用 `var`。
- **禁止强制解包 `!`**（IBOutlet 除外，且必须注释原因）。
- 禁止强制类型转换（`as!`）；必须使用条件转换（`as?`）配合安全处理。
- 可选值必须使用 `guard let` / `if let` / `??` 安全处理。
- 值类型（`struct`）优先于引用类型（`class`）。

### 4.2 内存管理

- Block / 闭包中**必须使用 `[weak self]`** 防止循环引用。
- 使用 `[unowned self]` 前必须确保生命周期，否则一律用 `[weak self]`。

### 4.3 线程

- UI 更新必须在**主线程**（`DispatchQueue.main` / `@MainActor`）。
- 耗时操作必须派发到后台队列。
- 网络请求使用 **`async/await`**（Swift Concurrency）。

### 4.4 框架与架构

- **优先使用 SwiftUI**，兼容 UIKit 代码。
- 架构采用 **MVVM + Combine**。
- 自动布局必须正确适配 **SafeArea**；禁止硬编码状态栏 / 底部安全区高度。
- 优先使用带关联值的 `enum` 表达状态（如 `Result` / `LoadState`）。

### 4.5 存储

- 敏感信息（Token、密码、证书）存 **Keychain**，禁止存 UserDefaults / 明文文件。
- 轻量非敏感数据用 **UserDefaults**。

### 4.6 与 Flutter 桥接

- 原生能力通过 `FlutterMethodChannel` 暴露，入口集中在专用 `*Plugin.swift`。
- 错误必须通过 `FlutterError` 回传，禁止吞异常。

---

## 5. Android 规则（偶尔使用）

- 使用 **Kotlin**，开启空安全。
- 架构采用 **MVVM + Jetpack**（ViewModel + LiveData / StateFlow）。
- 最低支持 **minSdk 29（Android 10）**，目标 **targetSdk 34**。
- 避免内存泄漏：Activity / Fragment 中注意 ViewModel 和 LiveData 的生命周期绑定。
- 布局必须兼容多屏幕尺寸，使用 ConstraintLayout / 响应式布局。
- 遵循 Material Design 规范。

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
- [ ] Flutter：JSON 是否使用 **g_json**
- [ ] 枚举是否使用 `switch` 且穷举/兜底
- [ ] 是否存在**魔法值**（含硬编码颜色/尺寸）
- [ ] 函数是否 ≤50 行、≤3 层嵌套、单一职责
- [ ] 是否处理了所有异步异常
- [ ] 是否违反**分层**（UI 直连网络 / UI 直连 API）
- [ ] 资源路径是否为**完整字面量**（禁止拼接）
- [ ] UI 文案是否为**整句**（禁止分段拼接）
- [ ] Flutter `TextStyle` 是否**显式设置 `color`**
- [ ] Flutter：`const` 是否可加未加 / 列表是否 `builder` / `dispose` 是否释放资源
- [ ] Swift：是否 `let` 优先 / 闭包是否 `[weak self]` / UI 是否主线程 / 是否用 `as!` 强转
- [ ] 是否使用了**已废弃 API**
- [ ] 不确定项是否标注 `// TODO: [需确认]`

**违反任一项必须先修正再输出。**

---

## 8. 变更日志

| 版本 | 日期 | 变更 |
|---|---|---|
| v1.5.0 | 2026-05-07 | 新增 2.5「项目初始化文档结构（/init）」：AGENTS.md 写正文，CLAUDE.md 只写 `@AGENTS.md` 一行导入 |
| v1.4.0 | 2026-04-16 | 删除通用代码规范中的行业通用规则（魔法值、函数设计、命名规范、注释规范、异常处理、DRY与可扩展）；重编号章节 |
| v1.0.0 | 2026-04-16 | 初始化规则集 |
| v1.1.0 | 2026-04-16 | 合并 Flutter 强制规范；新增 Cupertino 优先、rebuild 自检；统一 g_json 取值命名 |
| v1.2.0 | 2026-04-16 | 新增资源路径禁止拼接、UI 文案禁止拼接、Flutter TextStyle 必须显式 color |
| v1.3.0 | 2026-04-16 | 新增 Android 规则；扩展 Swift 规则（let优先、[weak self]、SwiftUI、MVVM+Combine、async/await、Keychain、iOS14+）；新增 Dart 空安全/lints 要求；新增注释规范；AI 行为要求；自检清单补充废弃 API、内存泄漏、强转检查 |
