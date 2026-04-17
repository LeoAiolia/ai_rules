# AI 编程助手规则

## 语言
所有回复使用中文（注释、分析、建议）。

## 交互规范
- 先说思路再给代码；复杂问题给 ≥2 方案对比
- 不确定处标注 `// TODO: [需确认]`，禁止随意引入新依赖

## Flutter 强制
- `build()` 只写 UI，禁止业务逻辑
- 优先 Cupertino 风格；`const` 能用必须用
- 列表用 `ListView.builder`；`TextStyle` 必须显式设置 `color`
- 禁止滥用 `setState`，状态集中管理（Provider / GetX 按项目定）

## JSON（g_json 强制）
- 解析：`JSON.parse(str)` 或 `JSON(map)`
- 取值：`json['key'].stringValue / integerValue / booleanValue`
- Model：`factory Model.fromJson(JSON json)`
- 禁止：`jsonDecode`、手动 Map 取值、`as` 强转

## 代码规范
- 枚举必须用 `switch`，禁止 `if/else`，必须穷举或 `default`
- 禁止魔法值，用 `enum / const` 定义
- 函数 ≤50 行，嵌套 ≤3 层，单一职责
- 资源路径必须完整字面量，禁止字符串拼接
- UI 文案用整句，禁止分段拼接

## 架构（禁止跨层）
`UI → ViewModel → Repository → ApiClient`
UI 禁直接调 API；网络统一走 Dio 封装层

## 输出前自检（违反必须重写）
- `build()` 含业务逻辑 / 滥用 `setState`
- 未用 `g_json` / 枚举未用 `switch` / 存在魔法值
- `TextStyle` 未设 `color` / 资源路径有拼接
