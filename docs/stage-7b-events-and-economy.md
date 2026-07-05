# Stage 7B Paradox Events And Shop Economy

# Chrono Echo: Fractured Realms

## 1. Purpose

当前 Event、Shop、Rest 节点都是同一个"免费三选一"界面换皮，节点类型缺乏体验差异。Stage 7B 让事件节点变成真正的悖论抉择，让商店节点有货币经济，提升单局的节点多样性。

## 2. Scope

本阶段实现：

- 货币 Time Shards（时间碎片）：
  - 战斗胜利获得：普通战斗 15，精英 25，Boss 40。
  - 开局为 0，只在本局内有效（局后残响转化在 Stage 7C 处理）。
  - 时间树页眉、奖励页、结算页显示当前碎片。
- 悖论事件（新 EventScene）：
  - 事件节点不再进入奖励页，而是进入事件页：事件标题、描述、两个选项。
  - 每个选项是"收益 + 代价"的组合，部分选项需要消耗碎片，不足时禁用。
  - 第一批 5 个事件：Temporal Bargain、Stranded Echo、Unstable Rift、Forgotten Cache、Mirror Moment。
  - 事件按节点深度确定性选取，同一局内不同事件节点尽量不重复。
- 商店经济（RewardScene 扩展）：
  - Shop 节点的三个选项显示价格并需要碎片购买：Recovery 20、Upgrade 30、Corrupted 35、Rule 45。
  - 碎片不足的选项置灰不可点。
  - 新增 Leave 按钮：不购买直接离开（买不起时也能继续前进）。
  - Combat、Elite、Event、Rest 语境的奖励保持免费，界面不变。
- 全部新文案提供英文、中文、西班牙文。

## 3. UX Rules

- 事件选项文案必须把收益和代价写在同一句里，玩家不需要猜测后果。
- 商店价格直接显示在卡片上，买不起的卡片视觉上明显弱化。
- Leave 是次要按钮，不与购买卡片混淆。
- 碎片数量在做经济决策的每个界面都可见。

## 4. Technical Shape

- `run-state.ts`：RunState 增加 `shards`。
- `run-manager.ts`：`awardCombatShards(nodeType)` 战斗胜利加碎片；`spendShards(amount)` 扣费。
- `src/core/run/event-catalog.ts`：事件定义（id、选项、效果、碎片消耗、选取规则）。
- `src/game/scenes/EventScene.ts`：事件渲染和选项输入，完成后 `completeNode` 返回时间树。
- `reward-catalog.ts`：按 RewardKind 的商店价格表。
- `RewardScene`：shop 语境下的价格显示、购买扣费、Leave 按钮。
- `MapScene` 路由：event 节点进入 EventScene。
- i18n 三语词典补充事件、商店、碎片词条。

## 5. Scope Control

本阶段暂不处理：

- 碎片跨局残响（Stage 7C）。
- 事件链和多步事件。
- 商店刷新、折扣、稀有度定价。
- 事件插画或图标。

## 6. Verification Plan

- `npm run build` 必须通过。
- Playwright 验证事件节点进入 EventScene，选择选项后效果生效并返回时间树、深度推进。
- Playwright 验证战斗胜利后碎片增加并在时间树显示。
- Playwright 验证商店购买扣碎片、买不起的卡片不可点、Leave 可直接离开。
- Playwright 验证中文语言下事件与商店文案正常。
- 验证期间没有 browser page error。

## 7. Verification Result

- `npm run build` 通过。
- Playwright 15 项验证全部通过：
  - 事件节点进入 EventScene，深度 0 事件为 Stranded Echo。
  - 0 碎片时需要 15 碎片的选项禁用并显示"碎片不足"。
  - 选择免费选项后返回时间树，碎片变为 10，深度推进。
  - 战斗胜利结果面板显示 `+15 shards`，时间树碎片累计正确（10、25、40）。
  - 25 碎片时商店三张 30 价位卡片全部置灰不可点，Leave 可直接离开并推进。
  - 40 碎片时卡片显示 `Buy (30 shards)`，购买后碎片减为 10。
  - 中文语言下事件标题、描述、选项和"碎片不足"提示渲染正常。
  - 验证期间没有 browser page error。
- 事件页与商店页截图确认布局无重叠。
