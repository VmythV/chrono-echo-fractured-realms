# Stage 11A Pixel Art Style Sample (Combat Room)

# Chrono Echo: Fractured Realms

## 1. Purpose

画风方向已确定为方案 A（16-bit 像素街机，见 `docs/art-direction-proposals.html`）。本阶段只做**战斗房完整样张**：全套像素精灵、像素地板、CRT 扫描线，供玩家确认后再推广到菜单、地图与全部 UI（Stage 11B）。

## 2. Art Spec

- 调色板：SWEETIE-16（提案中的 8 色为其子集）。
- 精灵为 16x16（Boss 24x24）字符地图，运行时逐像素绘制生成，放大 3 倍显示。
- 渲染开启 `pixelArt: true`（最近邻采样 + 像素对齐），保证硬边像素。
- 素材实现改为**程序生成像素图**而非外部像素包：规避外部包下载不可用的风险、保持零资源文件路线，后续如需可无缝替换为 Kenney Pixel 包。

## 3. Scope

本阶段实现（仅 CombatScene）：

- 像素精灵替换全部 Kenney 位图：玩家机、Chaser、Shooter、Anomaly、Boss、双方弹道、陨石、走廊墙、尾焰两帧、爆炸三帧。
- 战场地板换为主题色像素棋盘瓦片（TileSprite），替代原网格。
- 全屏 CRT 扫描线滤层。
- 物理体尺寸随新贴图重校，玩法数值不变。

## 4. Scope Control

本阶段暂不处理（待样张确认后 Stage 11B）：

- 主菜单、时间树、设置、记忆之树、奖励、结算的像素化。
- 像素字体（Orbitron 与正文暂时保留）。
- Kenney 太空素材文件的移除（保留在仓库，回滚方便）。

## 5. Verification Plan

- `npm run build` 通过，`npm run test:e2e` 全部通过。
- 截图核对：普通房、精英房、Boss 房三张样张，像素边缘锐利、主题地板与扫描线生效。
- 验证期间没有 browser page error。

## 6. Verification Result

- `npm run build` 通过，`npm run test:e2e` 11 项全部通过。
- 截图核对（DPR 2）：
  - Ancient 房：暖褐像素棋盘地板、扫描线、红色像素甲虫 Chaser、金色菱晶 Shooter、像素化走廊墙（主题 tint）、蓝色像素战机与尾焰。
  - 腐化 Boss 房：紫色地板、Glitch Warden 像素堡垒与 8 向环形光球弹幕。
- 过程问题与修复：
  - 动画创建早于贴图生成导致贴图缺失，调整 create 顺序。
  - 三个粒子发射器的多行链式写法漏改 `fx-soft` 引用，出现缺失贴图占位框，统一替换为 `fx-pixel` 并顺带给 Scatter 布局加了障碍最小间距。
- 验证期间没有 browser page error。
- 已知取舍：精灵旋转为自由角度，非 90 度旋转会破坏像素完美对齐；如需严格 8 方向量化，在 Stage 11B 决定。
