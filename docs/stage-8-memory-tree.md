# Stage 8 Memory Tree

# Chrono Echo: Fractured Realms

## 1. Purpose

Stage 8 实现设计文档中的 Memory-Based Progression：局外记忆之树。玩家每局结束获得"记忆"，在记忆之树中解锁永久节点，包括两个新的主动时间技能（回响攻击、时间锚点），补上跨局成长的核心留存钩子。

## 2. Scope

本阶段实现：

- 记忆货币（Memories）：
  - 每局结束获得：通过节点数 x1，通关额外 +5。
  - 持久保存在本地存档中，主菜单和记忆之树显示余额。
  - Reset Save 会同时清空记忆和解锁（记忆树属于游戏存档）。
- 记忆之树（新 MemoryScene，主菜单入口 `Memory Tree`）：
  - 第一版 5 个节点、三条支线，支线内有前置依赖：
    - 战斗支线：Enduring Memory（10，开局最大生命 +10）→ Honed Memory（20，开局攻击 +2）。
    - 时间支线：Echo Attack（25，解锁 R 技能）→ Time Anchor（40，解锁 F 技能）。
    - 独立节点：Merchant Pact（15，开局 +10 碎片）。
  - 节点状态：已解锁 / 可解锁 / 前置未满足 / 记忆不足，全部可见。
- 新主动技能（解锁后每局自动携带）：
  - Echo Attack（R）：向准星方向扇形射出 3 发回响弹，每发伤害为普攻的 60%，冷却 7 秒。
  - Time Anchor（F）：第一次按放置锚点（持续 5 秒），再按传送回锚点并获得 0.6 秒无敌，冷却 9 秒；锚点过期未使用只进入 4 秒短冷却。
  - HUD 只在解锁后显示对应技能行，附放置与回归的音效和脉冲反馈。
- 结算页显示本局获得的记忆数。
- 全部新文案提供英文、中文、西班牙文。

## 3. Design Rules

- 记忆节点全部是"每局开局自动生效"的永久效果，不引入局内操作负担（两个新技能除外，它们是玩家主动选择解锁的）。
- 技能解锁不改变既有 Q/E 技能，老玩家肌肉记忆不受影响。
- 数值节点刻意保守（+10 生命 / +2 攻击 / +10 碎片），避免元进度碾压局内构筑。
- 树结构一屏放下，不做滚动。

## 4. Technical Shape

- `save-state.ts`：SaveData 增加 `memories` 与 `unlockedMemories`，旧存档自动补默认值。
- `src/core/meta/memory-tree.ts`：节点定义、前置校验、解锁扣费、`applyMemoriesToRun`、`calculateRunMemories`。
- `run-state.ts`：`PlayerRunState` 增加 `hasEchoAttack`、`hasTimeAnchor`；`RunState` 增加 `memoriesEarned`。
- `run-manager.ts`：`startNewRun` 应用已解锁记忆。
- `time-residue.ts`：结算时入账记忆。
- `MemoryScene`：树渲染与解锁交互；`MainMenuScene` 增加入口和余额；`SummaryScene` 显示所得。
- `CombatScene`：R / F 技能实现、动态 HUD 行数。
- `sfx.ts`：新增 echo 与 anchorPlace 音效。

## 5. Scope Control

本阶段暂不处理：

- 更多记忆节点和第三层技能升级。
- 记忆树与残响、腐化的联动节点。
- 技能重绑定。
- 记忆退款（重置树）。

## 6. Verification Plan

- `npm run build` 必须通过。
- Playwright 验证主菜单显示记忆余额和 Memory Tree 入口。
- Playwright 验证 0 记忆时节点不可解锁；前置未满足时显示要求。
- Playwright 验证注入 100 记忆后依次解锁五个节点，余额扣减并持久化。
- Playwright 验证解锁后新开局：生命 110、攻击加成 2、碎片 10。
- Playwright 验证战斗中 R 射出 3 发弹、进入冷却；F 放置锚点、再按返回锚点位置并进入冷却。
- Playwright 验证结算显示获得记忆，主菜单余额增加。
- Playwright 验证中文渲染。
- 验证期间没有 browser page error。

## 7. Verification Result

- `npm run build` 通过。
- Playwright 18 项验证全部通过：
  - 主菜单显示 `Memories: 0` 和 Memory Tree 入口。
  - 空树状态：记忆不足与前置要求（Requires Enduring Memory、Requires Echo Attack）正确显示。
  - 注入 200 记忆后五个节点全部可依次解锁，余额扣减为 90 并持久化，五个节点显示已解锁。
  - 新开局：生命 110/110、碎片 10、攻击加成 +2，`hasEchoAttack` 与 `hasTimeAnchor` 为 true。
  - 战斗 HUD 显示 `R Echo ready` 与 `F Anchor ready`。
  - 按 R 射出 3 发回响弹并进入约 7 秒冷却。
  - 按 F 放置锚点，移动后再按 F 传送回锚点原位置并进入约 9 秒冷却。
  - 模拟通关结算（3 节点 + 通关加成）显示 `Memories earned: 8`，主菜单余额增至 98。
  - 中文语言下记忆之树标题、节点与已解锁标签渲染正常。
  - 验证期间没有 browser page error。
- 记忆之树截图确认三条支线、前置连线与状态配色清晰无重叠。
