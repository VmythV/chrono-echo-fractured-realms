# Stage 6A Web Shell

# Chrono Echo: Fractured Realms

## 1. Purpose

Stage 6A 的目标是把当前原型整理成更像可试玩网页游戏的入口：玩家打开页面后先进入主菜单，可以开始一局、查看本地存档摘要，并在需要时重置本地存档。

本阶段只做轻量外壳，不引入复杂设置、账号、音频或发行页面。

## 2. Scope

本阶段实现：

- 新增 MainMenuScene 作为游戏首屏。
- 主菜单提供 `Start Run` 和 `Reset Save`。
- 主菜单显示本地存档摘要：活跃残响、最近一局、最近腐化、历史最高腐化。
- `Start Run` 会创建新 run，并进入 MapScene。
- `Reset Save` 会清空本地存档并刷新菜单摘要。
- main game config 从 MainMenuScene 启动。
- SummaryScene 提供返回主菜单入口。

## 3. UX Rules

- 首屏必须直接给出 `Start Run`，不做营销式落地页。
- 菜单文字保持短句，避免长说明。
- Reset Save 必须是次要按钮，避免误点。
- 本阶段不做确认弹窗，Reset Save 只清空持久存档，不影响已经提交的项目文件。

## 4. Technical Shape

- `src/game/scenes/MainMenuScene.ts` 负责菜单渲染和输入。
- `src/core/meta/save-state.ts` 增加清空存档方法。
- `src/main.ts` 把 MainMenuScene 放在 scene 列表第一位。
- `src/main.ts` 在 Vite dev 环境暴露 `window.__chronoEchoGame`，用于 Playwright 验证场景流。
- `SummaryScene` 增加 `Main Menu` 按钮，返回菜单时不自动开始新 run。

## 5. Scope Control

本阶段暂不处理：

- 设置界面。
- 音频。
- 键位重绑定。
- 正式加载界面。
- 发布说明页面。
- 存档确认弹窗。

## 6. Verification Plan

- `npm run build` 必须通过。
- Playwright 验证首屏为 MainMenuScene。
- Playwright 验证 `Start Run` 会进入 MapScene，并创建新 run。
- Playwright 验证预置存档时菜单能显示 active residues 和腐化摘要。
- Playwright 验证 `Reset Save` 会清空 `localStorage` 中的项目存档并刷新摘要。
- Playwright 验证 SummaryScene 的 `Main Menu` 按钮可以返回主菜单。
- Playwright 验证期间没有 browser page error。

## 7. Verification Result

- `npm run build` 通过。
- Playwright 临时验证通过 3 条用例。
- 首屏验证：页面启动后 active scene 为 `MainMenuScene`。
- 开始一局验证：点击 `Start Run` 后进入 `MapScene`，新 run 状态为 `running`。
- 预置存档验证：菜单能读取 active residues、最近一局和腐化摘要。
- 重置验证：点击 `Reset Save` 后项目本地存档被清空，菜单仍保持 active。
- 结算返回验证：SummaryScene 的 `Main Menu` 按钮可以返回 `MainMenuScene`。
- 截图验证：1280x720 下主菜单和结算按钮无文本重叠。
- 验证期间没有 browser page error。
