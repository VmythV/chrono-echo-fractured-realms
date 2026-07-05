# Stage 10C High-DPI, Display Font And Sprite Art

# Chrono Echo: Fractured Realms

## 1. Purpose

针对试玩反馈：

1. 高分屏（Retina）下文字和元素发糊。
2. 战斗左上角 HUD 面板遮挡活动范围。
3. 主菜单静态、单调。
4. 引入外部美术资源：展示字体与 Kenney CC0 精灵替换角色和子弹。

## 2. Scope

本阶段实现：

- 高分屏清晰化（Phaser 4 无内置 resolution 配置，采用组合方案）：
  - `RENDER_SCALE = min(ceil(devicePixelRatio), 2)`：游戏内部画布按 1280x720 x RENDER_SCALE 渲染。
  - 每个场景相机 `setZoom(RENDER_SCALE)` 并居中，场景坐标系保持 1280x720 不变，零改动成本。
  - `this.add.text` 工厂打补丁，默认 `resolution = RENDER_SCALE`，文本按物理像素光栅化。
  - 标清屏（DPR 1）行为与之前完全一致。
- HUD 遮挡缓解：玩家进入左上角区域时 HUD 平滑淡出至低透明度，离开后恢复。
- 主菜单动效：时间线节点呼吸脉冲（错峰）、全屏上浮光尘粒子。
- 展示字体：Orbitron（OFL 许可，含 `OFL.txt`），经 Vite 打包内嵌，启动时等待字体加载完成再创建游戏（1.5 秒超时兜底）。应用于各场景标题与结果/暂停面板标题；正文与中文继续走系统字体回退。
- Kenney Space Shooter Redux（CC0，`public/assets/kenney/LICENSE.txt`）精灵替换：
  - 玩家：`playerShip1_blue`，机体随准星旋转（替代朝向箭头）。
  - Chaser：`enemyRed1`（面向移动方向）；Shooter：`enemyGreen2`（面向玩家）；Anomaly：`ufoBlue` 紫罗兰 tint；Boss：`ufoRed` 缓慢自旋，Glitch 变体加紫色 tint 与闪烁。
  - 玩家弹/回响弹：`laserBlue07` 激光条（随方向旋转）；敌弹：`laserRed08` 光球。
  - 圆形障碍：`meteorGrey_big3` 陨石，随主题 tint。走廊墙体保留程序生成贴图。
  - 物理体按贴图实际尺寸和缩放自动计算圆形碰撞体。

## 3. Scope Control

本阶段暂不处理：

- 帧动画（引擎尾焰、爆炸序列帧）。
- 全部 UI 图形化（按钮、面板仍为矢量）。
- 中文展示字体嵌入（体积考虑，继续系统回退）。
- Shooter 识别色从金改绿带来的旧文档截图差异。

## 4. Verification Plan

- `npm run build` 必须通过。
- `npm run test:e2e` 全部通过（DPR 1 下行为不变）。
- Playwright 以 deviceScaleFactor 2 启动：画布内部尺寸为 2560x1440，无页面错误。
- Playwright 验证精灵纹理加载成功、玩家机体旋转生效、HUD 靠近时淡出。
- 截图核对：新精灵战斗画面、主菜单动效帧、Orbitron 标题。

## 5. Verification Result

- `npm run build` 通过。
- `npm run test:e2e` 11 项全部通过（DPR 1 环境行为不变，无回归）。
- Playwright 以 deviceScaleFactor 2 验证：
  - 画布内部尺寸 2560x1440，`document.fonts.check` 确认 Orbitron 已加载。
  - 八张 Kenney 贴图全部注册成功，玩家机体纹理为 `ship-player` 且随准星旋转。
  - 玩家进入左上角后 `hudAlpha` 降至 0.20，HUD 淡出生效。
  - 验证期间没有 browser page error。
- 截图核对：
  - 主菜单 Orbitron 标题、时间线节点呼吸脉冲、上浮光尘（2560x1440 渲染清晰）。
  - 战斗房 Kenney 飞船（玩家蓝色战机、绿色 Shooter、橙色 Chaser）、主题 tint 陨石障碍（Pillars 布局）、敌弹光球。
- 冒烟测试针对打包产物运行通过，确认 `public/assets/` 正确进入 `dist/`。
