# Stage 4B Reward Catalog And Rule Limits

# Chrono Echo: Fractured Realms

## 1. Purpose

Stage 4B 的目标是把 Stage 4A 的奖励和 Temporal Rules 从原型写法整理成可扩展结构，同时继续保持玩家端简单清楚。

这不是增加复杂构筑深度的阶段，而是让后续新增奖励、节点池和规则时有稳定入口。

## 2. Scope

本阶段实现：

- 奖励定义集中到 reward catalog。
- 节点奖励池改成 ID 列表。
- Temporal Rules 增加上限控制。
- 当某条 Rule 达到叠层上限时，不再出现在奖励选择中。
- 当 Rule 奖励不可用时，使用简单 Upgrade 或 Recovery 补足三选一。
- Reward、Map、Combat、Summary 展示规则槽位进度。

## 3. Rule Limits

第一版限制：

| Limit | Value | Reason |
| --- | --- | --- |
| Active Temporal Rules | 5 | 避免休闲玩家记不住过多被动 |
| Same Rule Stacks | 2 | 保留成长感，但避免数值膨胀 |
| Reward Choices | 3 | 保持每次选择快速可读 |

## 4. Player Facing Behavior

- 玩家看到的是 `Rule slots 2/5` 这类短文本。
- 玩家不会看到已经达到上限的重复 Rule。
- 如果规则已满或某条规则叠满，奖励界面仍然提供可选 Upgrade 或 Recovery。
- 本阶段不做稀有度、不做复杂权重、不做重新随机按钮。

## 5. Technical Shape

- `src/core/run/reward-catalog.ts` 保存奖励目录、节点奖励池、fallback 奖励和 Rule 限制。
- `src/core/run/run-manager.ts` 只负责 run state、节点推进和奖励应用。
- Scene 只读取当前奖励和规则槽位，不直接关心奖励过滤规则。

## 6. Verification Plan

- `npm run build` 必须通过。
- Playwright 验证 RewardScene 显示 Rule slots。
- Playwright 验证选择 Rule 后 MapScene 更新为 `Rules 1/5`。
- Playwright 通过浏览器模块验证同一 Rule 最多叠到 2 层，第三次不会继续出现。
- Playwright 验证期间没有 browser page error。

## 7. Verification Result

- `npm run build` 通过。
- Playwright UI smoke 已验证 RewardScene 显示 `Rule slots 0/5`。
- Playwright UI smoke 已验证选择 Split Second 后 MapScene 显示 `Rules 1/5 Split Second`。
- Playwright 浏览器模块验证 Split Second 达到 2 层后，Event 奖励池中不再出现 Split Second，并由 fallback 奖励补位。
- Playwright 验证期间没有 browser page error。Headless 截图期间出现 WebGL ReadPixels 性能警告，不影响玩法流程。
