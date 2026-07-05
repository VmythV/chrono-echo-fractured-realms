# Stage 7C Combat Content Expansion

# Chrono Echo: Fractured Realms

## 1. Purpose

Stage 7C 扩充战斗侧内容：新增一种时间主题敌人、按腐化状态出现的第二 Boss，以及三条新残响，让高腐化和不同打法在局内外都有更明显的差异。

## 2. Scope

本阶段实现：

- 新敌人 Anomaly（时间错位体）：
  - 周期性瞬移到玩家附近的随机位置，落点后向玩家射击一发。
  - 平时缓慢漂移，可被 Time Freeze 冻住（冻结期间不瞬移不射击）。
  - 出现规则：深度不小于 3 的普通战斗房用它替换一只 Chaser；精英房的额外敌人由 Chaser 改为 Anomaly。
- 第二 Boss：Glitch Warden（错乱守卫）：
  - 当进入 Boss 房时腐化不低于 50，Boss 变为 Glitch Warden。
  - 数值：生命 260（基准），速度更快，攻击在"8 向环形弹幕"和"3 连扇形弹"之间交替。
  - 时间树 Boss 节点名称与战斗结果标题随变体切换。
- 残响从 6 条扩充到 9 条：
  - Shard Memory：结算时剩余碎片不低于 30，下一局开局 +20 碎片。
  - Elite Trophy：本局击败不少于 2 个精英，下一局最大生命 +8。
  - Overclocked Freeze：本局施放 Time Freeze 不少于 5 次，接下来 2 局冻结冷却 -1 秒，但冻结持续 -0.3 秒（风险与收益并存）。
- 玩家状态新增 `freezeDurationBonusMs`，冻结持续时间可被残响修改，下限 0.8 秒。
- 全部新文案提供英文、中文、西班牙文。
- `main.ts` 暴露 `window.__chronoEchoDebug`（含 `getRun`），用于自动化验证读取和构造 run 状态。

## 3. Design Rules

- Anomaly 的瞬移有落点脉冲提示，落点到开火有短暂前摇，保持可读性。
- Glitch Warden 的环形弹速度低于瞄准弹，玩家可以穿缝躲避。
- 新残响全部是数值型效果，开局 Timeline Report 可完整描述。
- Boss 变体只由腐化决定，规则对玩家透明（腐化 50 是既有的 Fractured 阈值）。

## 4. Technical Shape

- `CombatScene`：新增 anomaly 敌人类型（瞬移计时、开火前摇）、Boss 变体行为与命名、读取节点深度、冻结持续时间字段。
- `run-state.ts`：`PlayerRunState` 增加 `freezeDurationBonusMs`；`ResidueId` 增加三个新 id。
- `time-residue.ts`：三条新残响定义与生成条件，生成优先级置于低门槛残响之前。
- `corruption.ts` 不变，Boss 变体判断使用现有腐化值。
- i18n 三语词典补充 Boss 名称、参数化的 Boss 结果标题、新残响词条。

## 5. Scope Control

本阶段暂不处理：

- 攻击上一局死亡位置、模仿玩家行为的 Time Error Entities（需要跨局行为数据管线）。
- 第三种以上敌人和更多 Boss。
- 敌人成群生成与波次。
- 残响之间的组合效果。

## 6. Verification Plan

- `npm run build` 必须通过。
- Playwright 验证深度 3 战斗房敌人包含 anomaly。
- Playwright 验证腐化 60 时 Boss 房为 Glitch Warden：生命带腐化倍率、击败后结果标题显示变体名称。
- Playwright 验证腐化低于 50 时 Boss 仍为 Fracture Warden。
- Playwright 验证残响生成：胜利结算（碎片 35、精英 2）生成 Victory Echo、Shard Memory、Elite Trophy，下一局开局碎片 20、最大生命 108。
- Playwright 验证 `freezeDurationBonusMs` 生效（-300 时冻结持续 1.7 秒）。
- 验证期间没有 browser page error。

## 7. Verification Result

- `npm run build` 通过。
- Playwright 9 项验证全部通过：
  - 深度 3 战斗房敌人为 chaser、anomaly、shooter。
  - 精英房 4 个敌人且包含 anomaly。
  - 腐化 0 时 Boss 为 warden 变体，生命 220。
  - 腐化 60 时 Boss 为 glitch 变体，生命 302（260 x 1.16 腐化倍率）。
  - 击败 Glitch Warden 后结果标题显示 `Glitch Warden Defeated`。
  - 结算（胜利、碎片 35、精英 2）生成 Victory Echo、Shard Memory、Elite Trophy 三条残响。
  - 下一局开局碎片 20、生命 108/108，残响消耗生效。
  - `freezeDurationBonusMs` 为 -300 时冻结持续时间为 1700 毫秒。
  - 验证期间没有 browser page error。
- 精英房截图确认 anomaly 紫色外观与其他敌人区分明显。
