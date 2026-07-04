# Stage 2 Combat Prototype

# Chrono Echo: Fractured Realms

## 1. Purpose

Stage 2 的目标是验证网页端 2D 俯视角战斗基础手感。当前版本先完成一个可运行房间，不引入时间树、奖励、局后成长或复杂敌人系统。

## 2. Current Implementation

技术栈：

- Vite `8.1.3`
- TypeScript `5.9.3`
- Phaser `4.2.0`

当前可玩内容：

- 单个战斗房间。
- 一个玩家角色。
- 两种敌人：Chaser 和 Shooter。
- 玩家普攻：鼠标瞄准，左键发射短程能量弹。
- 闪避：`Space`，短距离快速位移并提供短暂无敌。
- Time Freeze：`Q`，冻结鼠标位置范围内敌人和敌方弹幕。
- Time Rewind：`E`，回到约 3 秒前位置，并恢复部分近期损失生命。
- 基础 HUD：生命、敌人数量、技能冷却、操作提示。
- 胜利或失败后按 `R` 重开原型。

本次收尾增强范围：

- 增加玩家生命条和技能冷却条，减少玩家读取成本。
- 增加敌人生命条和冻结状态反馈，让命中、击杀和 Time Freeze 更可见。
- 增加结果面板，明确胜利、失败和重新开始。
- 增加轻量命中反馈，但不引入复杂数值、装备或奖励系统。
- 将第一房间数值保持偏轻，优先验证移动、攻击和时间技能手感，而不是制造难度。

## 3. Controls

| Action | Input |
| --- | --- |
| Move | `WASD` |
| Aim | Mouse |
| Basic Attack | Left Mouse Button |
| Dash | `Space` |
| Time Freeze | `Q` |
| Time Rewind | `E` |
| Restart after result | `R` |

## 4. Scope Control

本阶段暂不处理：

- 时间树地图。
- 奖励三选一。
- Boss。
- 局后 Time Residue。
- 腐化阈值。
- 音频。
- 移动端输入。
- 正式美术资源。

## 5. Verification

已验证：

- `npm run build` 成功。
- TypeScript 严格检查通过。
- Vite 生产构建成功。
- Vite dev server 可通过 `http://127.0.0.1:5173/` 访问。
- Playwright 截图确认 Phaser 场景、HUD、玩家、敌人和弹幕已渲染。
- Playwright 交互检查确认点击攻击、`Q`、`E`、`Space` 后没有浏览器 page error 或 console error。
- 战斗反馈增强后 `npm run build` 成功。
- Playwright 截图确认 HUD、血条、敌人和默认战斗画面没有明显重叠。
- Playwright 流程验证确认胜利结果面板可显示。
- Playwright 流程验证确认胜利后按 `R` 重开，玩家生命、敌人和冷却状态会回到初始值。

下一步需要验证：

- 玩家手动试玩时移动、闪避、普攻和两个时间技能的节奏是否足够轻松。
