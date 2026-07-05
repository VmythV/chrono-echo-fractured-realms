# Stage 10A Visual Identity And Combat Presentation

# Chrono Echo: Fractured Realms

## 1. Purpose

目前玩家、敌人、弹道全部是素色圆片，战场没有主题差异，设计文档中的"古代 / 现代 / 未来 / 腐化"时间线只存在于设定。Stage 10A 在不引入外部美术资源的前提下建立统一画风，并升级角色、怪物与攻击的视觉表达。

## 2. Art Direction

- 画风：深色时空底 + 霓虹辉光轮廓（faux glow 直接烘焙进程序生成贴图，零运行时开销）。
- 全部贴图仍由 Phaser Graphics 程序生成，保持零资源文件。
- 配色沿用现有 UI 色板：青（玩家）、红（Chaser）、金（Shooter）、紫罗兰（Anomaly）、紫（Boss）。

## 3. Scope

本阶段实现：

- 时间线主题战场（按节点深度）：
  - 深度 0-1 Ancient（暖沙色调）、2-3 City（冷灰蓝）、4-5 Future（青绿）、6 以上与 Boss 房 Corrupted（紫）。
  - Glitch Warden 出现时强制 Corrupted 主题。
  - 主题决定地面、网格、边框与环境粒子颜色；环境粒子为缓慢上浮的加法混合光尘。
- 角色与怪物新造型（带烘焙辉光）：
  - 玩家：圆环 + 核心，新增随准星旋转的朝向箭头，替代原细线。
  - Chaser：尖锐三角碎片；Shooter：菱形晶体；Anomaly：断裂圆环，常态明暗闪烁。
  - Boss：双环法阵；Glitch 变体使用错位偏移的双色环贴图。
- 攻击表现：
  - 玩家弹与回响弹改为发光长条光弹，按飞行方向旋转。
  - 敌弹改为带光晕的脉冲光球贴图。
  - 命中火花：敌人受击、玩家受击触发暖色粒子爆点；敌人被消灭触发大爆点。
  - 冲刺留下渐隐残影。
- 时间树节点可选时缓慢呼吸脉冲，悬停改为描边加亮（不再与脉冲缩放冲突）。

## 4. Technical Shape

- `CombatScene`：`TIMELINE_THEMES` 常量与 `getRoomTheme()`；`createGeneratedTextures` 重写（辉光烘焙）；环境粒子与两个爆点粒子发射器；弹道旋转；冲刺残影计时器；玩家朝向箭头。
- `MapScene`：可用节点脉冲 tween 与描边悬停。
- 粒子使用 Phaser 4 `this.add.particles` 与 `explode()`，参考 `.agents/skills/particles`。
- 无新增文案，i18n 不变。

## 5. Scope Control

本阶段暂不处理：

- 外部图片、精灵表或骨骼动画。
- 背景音乐。
- 屏幕震动幅度设置。
- WebGL 后处理滤镜（辉光已烘焙，不依赖 FX 管线）。
- 主菜单与结算页的重绘。

## 6. Verification Plan

- `npm run build` 必须通过。
- `npm run test:e2e` 全部通过（视觉改动不破坏流程）。
- Playwright 验证新贴图注册（player-nose、boss-glitch、fx-soft 等）与弹道旋转生效。
- 截图核对：Ancient 与 Future 战场主题、Glitch Boss 房、时间树脉冲。
- 验证期间没有 browser page error。

## 7. Verification Result

- `npm run build` 通过。
- `npm run test:e2e` 11 项全部通过，视觉改动未破坏任何核心流程。
- 截图核对：
  - Ancient 房：暖沙色战场、金色菱形 Shooter、上浮光尘粒子。
  - Future 房：青绿主题、断裂圆环 Anomaly 清晰可辨。
  - 腐化 Boss 房：紫色主题、Glitch Warden 双色错位环贴图、环形弹幕光球。
  - 玩家为圆环加核心造型，朝向箭头随准星旋转。
- 验证期间没有 browser page error。
- 已知类型问题：Phaser 4 的 `RandomZoneSource` 类型定义拒绝 Geom 形状（运行时支持），环境粒子的 emitZone 使用了显式断言并注释说明。
