# Stage 3 Run Loop And Time Tree

# Chrono Echo: Fractured Realms

## 1. Purpose

Stage 3 的目标是把单场战斗扩展为一局最小 Roguelike 闭环。当前阶段优先验证路线选择、节点进入、战斗胜负、奖励选择、Boss 终点和结算，而不是追求内容数量。

## 2. Scope

本阶段实现：

- In-memory run state。
- 时间树地图。
- 每局 7 层普通路线节点加 1 个 Boss 节点。
- 每层 2 到 3 个可选节点。
- 基础节点类型：Combat、Elite、Event、Shop、Rest、Boss。
- Combat、Elite、Boss 复用 `CombatScene`，通过节点类型调整敌人配置。
- Event、Shop、Rest 使用轻量选择界面处理。
- 战斗胜利后进入奖励三选一。
- Boss 胜利或玩家死亡后进入 Run Summary。
- Summary 中可开始新一局。

## 3. Scope Control

本阶段暂不处理：

- 复杂事件链。
- 商店货币经济。
- 多 Boss 池。
- 局外记忆树。
- Time Residue。
- 腐化阈值。
- 正式数值平衡。
- 正式美术资源。

## 4. Player Flow

```text
MapScene
  -> CombatScene for Combat, Elite, Boss
  -> RewardScene after Combat or Elite victory
  -> RewardScene directly for Event, Shop, Rest
  -> MapScene after reward or node choice
  -> SummaryScene after Boss victory or player death
```

## 5. First Version Rules

- 玩家生命在一局内跨节点保留。
- 普通战斗胜利后给 3 个轻量奖励选项。
- Elite 战斗难度略高，奖励略强。
- Rest 节点优先提供治疗。
- Event 节点提供收益和轻微代价的选择。
- Shop 节点暂不使用货币，只作为未来经济系统占位，提供一次固定选择。
- Boss 节点使用第一版 Fracture Warden 原型配置。

## 6. Verification Plan

- `npm run build` 必须通过。
- Playwright 截图确认 MapScene 可见且节点可点击。
- Playwright 流程验证能从地图进入战斗。
- Playwright 流程验证能完成一个非战斗节点并回到地图。
- Playwright 流程验证能击败 Boss 后进入 Summary。

## 7. Current Verification

已验证：

- `npm run build` 成功。
- Playwright 截图确认 Time Tree 地图可见。
- Playwright 流程验证确认 Event 节点可进入选择界面，选择奖励后回到地图并推进路线。
- Playwright 流程验证确认 Combat 节点可进入战斗，胜利后进入奖励界面。
- Playwright 完整路线验证确认可以完成 8 个节点，击败 Fracture Warden 后进入 Run Summary。
- Playwright 验证期间没有 browser page error 或 console error。

下一步需要验证：

- 手动试玩时每层路线选择是否清晰。
- Boss 数值是否适合作为第一版终点。
- 奖励是否足够直观，是否需要在 HUD 中更明确展示已获得加成。
