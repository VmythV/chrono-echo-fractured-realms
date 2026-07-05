# Stage 9B Committed Smoke Tests

# Chrono Echo: Fractured Realms

## 1. Purpose

此前每个阶段的 Playwright 验证都是一次性脚本，验证逻辑没有沉淀，后续改动无法回归。Stage 9B 把核心流程验证提交进仓库，提供 `npm run test:e2e` 一键冒烟。

## 2. Scope

本阶段实现：

- `tests/e2e-smoke.mjs`：自包含冒烟脚本，自动启动 `vite preview`（打包产物）、运行 Chromium 检查、结束后关闭服务，失败时退出码非 0。
- 覆盖的核心流程：
  - 打包版本启动到主菜单，加载指示移除，无页面错误。
  - 语言切换到中文并在刷新后保持。
  - 开局、事件节点选择生效（碎片 +10、深度推进）。
  - 战斗胜利获得碎片、奖励选择返回时间树。
  - 刷新后 Continue Run 恢复同一局。
  - 战斗 ESC 暂停与恢复。
  - 注入记忆后解锁记忆树节点并扣费。
  - Reset Save 清空存档但保留设置。
- `package.json`：新增 `playwright` devDependency 与 `test:e2e` 脚本。
- `docs/testing.md`：本地运行说明。

## 3. Rules

- 冒烟测试针对打包产物（`dist/`）运行，运行前必须先 `npm run build`。
- 测试通过 `window.__chronoEchoGame` 与 `window.__chronoEchoDebug` 读取场景与 run 状态，不修改产品代码行为。
- 每个阶段结束前应运行冒烟测试；新增核心流程时应同步补充检查项。

## 4. Scope Control

本阶段暂不处理：

- CI 集成。
- WebKit / Firefox 多内核在冒烟中的常态化运行（保留手动多内核验证）。
- 单元测试框架。
- 视觉回归截图对比。

## 5. Verification Result

- `npm run build` 后执行 `npm run test:e2e`，11 项检查全部通过（ALL PASS，退出码 0）：
  - 打包版本启动、加载指示移除。
  - 中文设置刷新后保持。
  - 事件选择生效（深度 1、碎片 10）。
  - 战斗胜利 +15 碎片、奖励选择记录。
  - Continue Run 恢复同一 seed、碎片 25、深度 2。
  - ESC 暂停与恢复。
  - 记忆节点解锁扣费（50 减为 40）。
  - Reset Save 清空存档保留设置。
  - 全程无页面错误。
- 脚本自动启动和关闭 `vite preview`（端口 4181），无残留进程。
