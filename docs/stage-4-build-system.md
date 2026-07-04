# Stage 4 Build System

# Chrono Echo: Fractured Realms

## 1. Purpose

Stage 4 的目标是让单局奖励开始形成可感知构筑。当前阶段不做复杂牌组、装备栏或大量被动，只加入少量一句话能理解的 Temporal Rules。

## 2. Scope

本阶段实现：

- RewardChoice 增加类型标签：Upgrade、Rule、Recovery。
- RunState 记录 activeRules。
- 奖励池中加入 4 个 Temporal Rules。
- CombatScene 读取 activeRules 并影响战斗。
- Map、Reward、Summary 中展示当前构筑信息。

## 3. First Temporal Rules

| Rule | Effect | Player Read |
| --- | --- | --- |
| Stored Impact | 攻击冻结敌人时造成 10 点额外伤害 | Freeze 后输出更强 |
| Split Second | 使用 Time Freeze 或 Time Rewind 后，下一次普攻造成 12 点额外伤害 | 时间技能接普攻 |
| Fast Timeline | 闪避后立刻刷新普攻 | 闪避接射击 |
| Emergency Loop | 生命低于 35% 时，Time Rewind 冷却额外恢复 | 残血更容易回溯 |

## 4. Player Facing Feedback

- RewardScene 在每个奖励卡片上展示 Upgrade、Rule 或 Recovery。
- MapScene 显示当前 active rules 摘要。
- CombatScene 在 HUD 显示规则数量，在规则触发时显示状态文字或浮字。
- SummaryScene 显示本局最终规则列表。

## 5. Scope Control

本阶段暂不处理：

- 复杂叠层。
- 抽牌弃牌。
- 装备栏。
- 稀有度动画。
- 大规模数值平衡。

## 6. Verification Plan

- `npm run build` 必须通过。
- Playwright 验证 RewardScene 能显示奖励类型标签。
- Playwright 验证选择 Rule 后地图能显示 active rules。
- Playwright 验证完整路线的 run state 能进入 won summary state。
- Playwright 验证没有 browser page error 或 console error。

## 7. Verification Result

- `npm run build` 通过。
- Playwright UI smoke 已验证 RewardScene 类型标签、MapScene active rules 摘要和 CombatScene Split Second 触发反馈。
- Playwright 通过浏览器模块验证完整路线 run state：完成 8 个节点，最后节点为 `boss-0`，结果为 `won`，summary reason 为 `Fracture Warden defeated.`。
- Playwright 验证期间没有 browser page error。Headless 截图期间出现 WebGL ReadPixels 性能警告，不影响玩法流程。
