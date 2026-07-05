# Stage 6B Settings And Audio Feedback

# Chrono Echo: Fractured Realms

## 1. Purpose

Stage 6B 补齐 Stage 6 范围中的设置界面和基础音效反馈，让核心操作在听觉上有即时确认，并允许玩家关闭或调整音量。

本阶段不引入音频资源文件。所有音效使用 Web Audio 在运行时合成，保持项目轻量且无版权负担。

## 2. Scope

本阶段实现：

- 新增本地设置存储：音效开关和音量档位，独立于游戏存档。
- 新增运行时合成音效模块，覆盖以下事件：
  - UI 点击（菜单、地图节点、奖励卡、结算按钮）。
  - 玩家攻击、冲刺、受击。
  - 敌人受击、被消灭。
  - Time Freeze、Time Rewind、回溯护盾抵消。
  - 战斗胜利、战斗失败。
- 主菜单增加设置区：`Sound: On/Off` 和 `Volume: Low/Normal/High` 两个按钮。
- 战斗视觉反馈补充：玩家受击时轻微镜头震动。

## 3. UX Rules

- 音效必须短促、低干扰，单个音效不超过 0.5 秒。
- 关闭音效后所有播放调用直接跳过，不产生 AudioContext 活动。
- 设置修改立即生效并立即持久化，无确认步骤。
- Reset Save 不影响设置，设置使用独立的 localStorage key。

## 4. Technical Shape

- `src/core/meta/settings.ts`：设置读写，key 为 `chrono-echo-settings-v1`，含模块内缓存避免高频 localStorage 读取。
- `src/game/audio/sfx.ts`：`playSfx(name)` 单入口。AudioContext 在首次用户手势触发的播放时懒创建，处于 suspended 状态时自动 resume。每个音效由 1 到 3 个包络振荡器组成。
- `MainMenuScene` 增加设置按钮并刷新标签文字。
- `CombatScene`、`MapScene`、`RewardScene`、`SummaryScene` 在对应事件处调用 `playSfx`。

## 5. Scope Control

本阶段暂不处理：

- 背景音乐。
- 音频资源文件加载。
- 独立设置场景或弹窗。
- 键位重绑定。
- 屏幕震动开关（震动幅度保持轻微，暂不提供开关）。

## 6. Verification Plan

- `npm run build` 必须通过。
- Playwright 验证主菜单出现 Sound 和 Volume 按钮，初始为 `Sound: On`、`Volume: Normal`。
- Playwright 验证点击 Sound 按钮后标签变为 `Sound: Off`，localStorage 中设置已持久化，刷新后保持。
- Playwright 验证点击 Volume 按钮后档位循环切换。
- Playwright 验证 Reset Save 不清空设置。
- 验证期间没有 browser page error。

## 7. Verification Result

- `npm run build` 通过。
- Playwright 验证通过：主菜单显示 `Sound: On` 与 `Volume: Normal`。
- Playwright 验证通过：点击 Sound 后变为 `Sound: Off`，刷新页面后仍为 Off。
- Playwright 验证通过：Volume 依次循环 Normal、High、Low。
- Playwright 验证通过：Reset Save 清空存档但保留设置。
- Playwright 验证通过：进入战斗、攻击并施放 Time Freeze 后无 page error，AudioContext 正常创建。
- 验证期间没有 browser page error。
