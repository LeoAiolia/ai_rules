# AI 编程助手规则 — 通用部分

> **版本**：v2.0.0
> **最后更新**：2026-05-07
> **维护人**：run
> **适用范围**：Claude Code / Codex / Antigravity / Trae / Cline

---

## 使用说明

- 本规则集为**单一事实源**（Single Source of Truth），仓库位于 `~/Documents/yxr/ai_rules`。
- 「通用部分」（`rules/global/` 下所有文件）由 `scripts/sync.js` 同步到下游 AI 工具，**禁止直接修改下游文件**。
- 「平台部分」（`rules/lang/*.md`）不参与同步，由各项目在 `/init` 时按需拉取（见 `99-init-protocol.md`）。
- 修改规则时必须同步更新 `00-meta.md` 顶部的 `版本` 与 `最后更新`，并在 `rules/CHANGELOG.md` 追加条目。

---

## 用户画像

| 项目 | 内容 |
|---|---|
| 主要语言 | Dart / Swift |
| 开发方向 | Flutter 跨平台（iOS 为主，兼顾 Android） |
| 常用 IDE | Claude Code / VS Code / Xcode / Antigravity / Trae |
