# Stage 10D HUD Sidebar, Frame Animations And README

# Chrono Echo: Fractured Realms

## 1. Purpose

针对反馈：

1. HUD 面板悬浮在战场上方，遮挡活动区域，应改为侧边垂直排列。
2. 利用 Kenney 包的火焰与爆点帧做引擎尾焰和击杀爆炸动画，增强打击感。
3. 项目缺少 README。

## 2. Scope

本阶段实现：

- HUD 侧栏化：
  - 战斗区域右移（x 248 起，宽 1010），左侧 10-238 为专属 HUD 侧栏，与战场不再重叠。
  - HUD 文本与四条状态条（生命、冻结、回溯、冲刺）在侧栏内垂直排列。
  - 因不再遮挡，移除上一阶段的 HUD 近距淡出逻辑。
- 引擎尾焰：
  - `fire16/fire17` 两帧循环动画挂在玩家机尾，随机体旋转。
  - 移动或冲刺时显示，静止时隐藏；冲刺时火焰放大。
- 击杀爆炸：
  - `laserRed09/10/11` 三帧爆炸动画（加法混合），敌人被消灭时播放，Boss 爆炸放大。
  - 玩家死亡时机体隐藏并播放爆炸。
- 新增根目录 `README.md`：项目简介、特性、操作、技术栈、命令、测试与许可说明。

## 3. Scope Control

本阶段暂不处理：

- 敌人的引擎尾焰（保持敌我视觉密度差异）。
- 命中受击的帧动画（保留粒子方案）。
- README 的英文全文翻译（提供英文摘要）。

## 4. Verification Plan

- `npm run build` 必须通过。
- `npm run test:e2e` 全部通过。
- Playwright 验证：HUD 侧栏与战场无重叠（ARENA.x 大于侧栏右缘）；推进器动画存在且随移动显隐；击杀敌人后出现爆炸精灵。
- 截图核对侧栏布局与尾焰、爆炸效果。
- 验证期间没有 browser page error。

## 5. Verification Result

- `npm run build` 通过，`npm run test:e2e` 11 项全部通过。
- Playwright 验证：
  - HUD 侧栏（10-238）与战场（248 起）无重叠。
  - 按住移动键时推进器可见且播放 `thruster-burn` 动画，松开后隐藏。
  - `explosion` 动画精灵正常创建与播放。
  - 验证期间没有 browser page error。
- 截图核对：左侧竖排 HUD 面板、状态条与文字行对齐、玩家机尾尾焰。
- `README.md` 已随本阶段提交。
