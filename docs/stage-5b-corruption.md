# Stage 5B Corruption

# Chrono Echo: Fractured Realms

## 1. Purpose

Stage 5B 的目标是实现最小腐化闭环：玩家可以主动选择更强但带腐化的奖励，腐化阈值会轻微提高本局战斗风险，并在地图、奖励、战斗和结算中可见。

本阶段不把腐化做成隐藏惩罚。玩家必须能在选择奖励前看到腐化代价，并能在 HUD 中理解当前状态。

## 2. Scope

本阶段实现：

- RunState 增加本局 `corruption`。
- SaveData 记录 `highestCorruption` 和 `lastRunCorruption`。
- Reward catalog 增加 Corrupted 类型奖励。
- 腐化奖励提供高于普通奖励的直接收益，同时增加本局腐化值。
- CombatScene 根据腐化阈值轻微提高敌人生命和伤害。
- MapScene、RewardScene、CombatScene、SummaryScene 显示腐化状态。
- Run Summary 写入本局腐化到 run history。
- 高腐化结算可以生成一条轻量正向残响 `Corrupted Signal`。

## 3. First Corruption Rewards

| Reward | Context | Effect | Corruption |
| --- | --- | --- | --- |
| Fractured Edge | Elite | 本局攻击 +10 | +18 |
| Void Cache | Event | 最大生命 +18，治疗 18 | +15 |

这些奖励只给直接可感知的收益，不加入复杂条件。

## 4. Thresholds

| Corruption | State | Combat Effect |
| --- | --- | --- |
| 0 到 24 | Stable | 无额外变化 |
| 25 到 49 | Unstable | 敌人生命 +8%，敌人伤害 +1 |
| 50 到 74 | Fractured | 敌人生命 +16%，敌人伤害 +2 |
| 75 到 100 | Critical | 敌人生命 +25%，敌人伤害 +3 |

阈值只影响本局战斗，不跨局继承。跨局影响仍通过 Time Residue 表达。

## 5. Corrupted Signal Residue

触发条件：

- 本局结算时腐化值达到 50 或以上。

效果：

- 下一局起始攻击 +6。
- 持续 1 局。

设计原因：

- 让玩家看到高腐化不只是风险，也能留下局后机会。
- 避免第一版腐化只像惩罚。

## 6. Scope Control

本阶段暂不处理：

- Error Elite。
- Boss 新招式。
- 异常弹幕。
- 腐化清除商店。
- 负面残响。
- 长期腐化债务。

## 7. Technical Shape

- `src/core/meta/corruption.ts` 提供腐化阈值、格式化和增加腐化的方法。
- `RunState.corruption` 表示本局腐化。
- `RunCounters.highestCorruption` 用于结算和 run history。
- Corrupted rewards 通过 reward apply 增加腐化。
- CombatScene 在 `init()` 中读取腐化阈值，并在敌人生成和受伤逻辑中应用轻量数值修正。
- SummaryScene finalize 时把本局腐化写入存档历史。

## 8. Verification Plan

- `npm run build` 必须通过。
- Playwright 验证选择 Corrupted reward 后本局腐化增加。
- Playwright 验证腐化阈值会改变战斗敌人生命或伤害参数。
- Playwright 验证 Summary 写入 run history 的 corruption。
- Playwright 验证高腐化结算生成 `Corrupted Signal`。
- Playwright 验证 MapScene、RewardScene、CombatScene、SummaryScene 没有 browser page error。

## 9. Verification Result

- `npm run build` 通过。
- Playwright 临时验证通过 2 条用例。
- UI 路线验证：进入 Event 节点后选择 `Void Cache`，本局腐化变为 15，生命变为 118/118，MapScene 的 Timeline Report 显示腐化状态。
- 模块验证：`Void Cache` 和 `Fractured Edge` 会把腐化提高到 33，并进入 `Unstable` 阈值。
- CombatScene 参数验证：`Fractured` 阈值下 Chaser 生命从 48 提高到 56，接触伤害从 7 提高到 9。
- 结算验证：腐化 50 的胜利局生成 `Victory Echo` 和 `Corrupted Signal`，run history 写入 corruption 50。
- 下一局验证：`Victory Echo` 和 `Corrupted Signal` 生效后，起始攻击加成为 10。
- 验证期间没有 browser page error。
