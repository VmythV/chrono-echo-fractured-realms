# Stage 11B Pixel Style Rollout

# Chrono Echo: Fractured Realms

## 1. Purpose

样张（Stage 11A）已确认，本阶段把像素风推广到全部场景与 UI，统一游戏观感。玩家确认保持自由角度旋转（不做 8 方向量化）。

## 2. Scope

本阶段实现：

- 全局 CRT 扫描线：移入场景过渡工具（`fadeInScene`），所有场景自动获得，战斗场景去除重复实现。
- 像素标题字体：Press Start 2P（OFL，`src/assets/fonts/PressStart2P.ttf`）替换 Orbitron 作为展示字体首选；中文标题自动回退系统字体保持可读；各场景标题字号按像素字体宽度重调。
- 像素硬边按钮与卡片：全部交互元素（菜单/设置/结算按钮、奖励卡、事件卡、记忆卡、Leave、New Run、战斗结果与暂停面板、HUD 侧栏）改为双层硬边矩形（外深边 + 边框层 + 内底），悬停改变边框色，替代原细描边圆角风格。
- 主菜单装饰配色对齐 SWEETIE-16，粒子改像素方块。
- 场景背景色统一 `#1a1c2c`。

## 3. Scope Control

本阶段暂不处理：

- 中文像素字体（体积与可读性考虑，中文继续系统字体）。
- 时间树节点圆形改像素方块（圆形节点保留，颜色对齐调色板）。
- Orbitron 与 Kenney 太空素材文件的删除（保留仓库内备用）。

## 4. Verification Plan

- `npm run build` 通过，`npm run test:e2e` 全部通过（按钮位置不变）。
- 截图核对：主菜单、时间树、设置、奖励、结算的像素边框、扫描线与像素标题。
- 中文语言下界面截图确认标题回退可读。
- 验证期间没有 browser page error。

## 5. Verification Result

- `npm run build` 通过，`npm run test:e2e` 11 项全部通过（按钮位置未变，交互层为像素面板内层矩形）。
- 截图核对（DPR 2）：
  - 主菜单：Press Start 2P 像素标题、像素硬边按钮、SWEETIE 配色装饰节点、全屏扫描线；被按钮遮挡的装饰节点已移位。
  - 中文商店：像素硬边卡片、中文描述回退系统字体正常折行，标题回退可读。
  - 暂停面板：像素字体标题、双层硬边面板与按钮、HUD 侧栏像素边框。
- 验证期间没有 browser page error。
- 已知取舍：中文标题无像素字形，回退系统字体（已在 Scope Control 声明）。
