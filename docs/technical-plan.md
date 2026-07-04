# Technical Plan

# Chrono Echo: Fractured Realms

## 1. Technical Goals

项目目标是做一款可在网页端运行的轻量 Roguelike 游戏。技术方案应优先支持快速迭代、清晰模块边界和后续内容扩展。

技术原则：

- 第一版保持简单，避免过早引入复杂引擎架构。
- 玩法系统尽量数据驱动，便于新增技能、节点、敌人和残响。
- 战斗逻辑和展示逻辑适度分离，方便测试核心规则。
- 存档优先使用浏览器本地存储。
- 美术资产可以使用 SVG 和轻量位图，避免大型资源包。

## 2. Recommended Stack

推荐第一版技术栈：

| Area | Choice | Reason |
| --- | --- | --- |
| Language | TypeScript | 便于维护数据结构和系统边界 |
| Build Tool | Vite | 轻量，适合网页游戏快速开发 |
| Game Runtime | Phaser 4.2.0 | 适合 2D WebGL 游戏、输入、场景管理和后续扩展 |
| UI | Phaser UI plus DOM overlay | 第一版避免引入过重 UI 框架 |
| Save | localStorage | 足够支持单机网页原型 |
| Assets | SVG, PNG, JSON | 轻量、易版本管理 |
| Tests | Vitest for pure logic | 先覆盖数据和规则系统 |

暂不推荐第一版使用：

- 复杂 ECS 框架。
- 后端服务。
- 账号系统。
- React 全量 UI。
- 大型资源管线。

Phaser 版本固定为 `4.2.0`。如果后续升级 Phaser，应先查阅官方变更记录，再更新文档、依赖和兼容性验证。

未来如果菜单、记忆树和设置界面变复杂，可以再加入 React 作为独立 UI 层。

## 3. Project Structure

建议结构：

```text
/
  docs/
  public/
    assets/
      svg/
      sprites/
      audio/
  src/
    main.ts
    game/
      scenes/
        BootScene.ts
        MenuScene.ts
        MapScene.ts
        CombatScene.ts
        RewardScene.ts
        SummaryScene.ts
      objects/
        Player.ts
        Enemy.ts
        Projectile.ts
    core/
      combat/
        combat-state.ts
        damage.ts
        movement.ts
      time/
        time-freeze.ts
        time-rewind.ts
        time-snapshot.ts
      run/
        run-state.ts
        node-map.ts
        rewards.ts
      residue/
        residue-state.ts
        residue-triggers.ts
        residue-effects.ts
      corruption/
        corruption.ts
      progression/
        memory-state.ts
      save/
        save-store.ts
    data/
      enemies.ts
      skills.ts
      upgrades.ts
      temporal-rules.ts
      nodes.ts
      events.ts
      residues.ts
      bosses.ts
    ui/
      hud.ts
      reward-panel.ts
      timeline-report.ts
    tests/
```

第一版可以按需减少文件，但模块边界应保持一致。

## 4. Scene Flow

游戏场景流：

```text
BootScene
  -> MenuScene
  -> TimelineReport
  -> MapScene
  -> CombatScene / EventScene / ShopScene / RestScene
  -> RewardScene
  -> MapScene
  -> Boss CombatScene
  -> SummaryScene
  -> TimelineReport or MenuScene
```

实现建议：

- `BootScene` 负责加载资源和读取存档。
- `MenuScene` 负责开始游戏、设置和进入记忆界面。
- `MapScene` 展示时间树和可选节点。
- `CombatScene` 复用普通战斗、精英和 Boss，只通过配置切换。
- `RewardScene` 只处理奖励选择。
- `SummaryScene` 处理结算、残响生成和存档。

## 5. Data-Driven Definitions

### 5.1 Skills

```ts
type SkillDefinition = {
  id: string;
  name: string;
  slotType: "active" | "passive";
  eraTags: EraTag[];
  cooldownMs?: number;
  description: string;
  effectId: string;
  upgradeIds: string[];
};
```

第一版只需要 `time_freeze` 和 `time_rewind` 两个主动技能。未来通过 `effectId` 绑定具体逻辑。

### 5.2 Temporal Rules

```ts
type TemporalRuleDefinition = {
  id: string;
  name: string;
  eraTags: EraTag[];
  rarity: "common" | "rare" | "corrupted";
  description: string;
  hooks: RuleHook[];
  maxStacks: number;
};
```

规则通过 hook 接入战斗事件，例如：

- `onSkillCast`
- `onDash`
- `onEnemyFrozen`
- `onDamageDealt`
- `onLowHealth`

### 5.3 Map Nodes

```ts
type NodeDefinition = {
  id: string;
  type: "combat" | "elite" | "event" | "shop" | "memory" | "rest" | "boss";
  eraTags: EraTag[];
  baseWeight: number;
  minDepth?: number;
  maxDepth?: number;
};
```

残响和腐化可以修改 `baseWeight`，实现路线变化。

### 5.4 Residue

```ts
type ResidueDefinition = {
  id: string;
  name: string;
  category: "combat" | "route" | "corruption" | "death" | "story";
  durationRuns: number;
  triggerId: string;
  effectIds: string[];
  maxStacks: number;
  visibleText: string;
};
```

第一版残响效果只支持四类：

- 修改敌人属性。
- 修改奖励权重。
- 修改地图节点权重。
- 插入特殊敌人或事件。

## 6. Runtime State

### 6.1 Run State

```ts
type RunState = {
  seed: string;
  currentDepth: number;
  selectedNodeIds: string[];
  player: PlayerRunState;
  corruption: number;
  activeSkills: string[];
  temporalRules: RuleInstance[];
  collectedRewards: string[];
  counters: RunCounters;
};
```

`RunCounters` 用于结算残响：

```ts
type RunCounters = {
  timeFreezeCasts: number;
  timeRewindCasts: number;
  shopsVisited: number;
  elitesDefeated: number;
  eventsHelped: number;
  eventsHarmed: number;
  highestCorruption: number;
  deathCause?: string;
};
```

### 6.2 Persistent Save

```ts
type SaveData = {
  version: number;
  unlockedMemories: string[];
  activeResidues: ResidueInstance[];
  runHistory: RunSummary[];
  settings: UserSettings;
};
```

存档规则：

- 使用 `localStorage`。
- 存档带 `version`。
- 读取失败时回退到默认存档。
- 未来需要做迁移函数。

## 7. Time Systems

### 7.1 Time Freeze

实现思路：

- 对敌人和弹幕设置 `timeScale`。
- 普通敌人 `timeScale = 0` 或接近 0。
- Boss 使用 `timeScale = 0.5`。
- 玩家不受 Freeze 影响。

注意：

- 冻结结束时恢复原速度。
- 冻结期间仍保留碰撞检测。
- 弹幕冻结需要清楚的视觉表现。

### 7.2 Time Rewind

实现思路：

- 每隔固定时间记录玩家快照。
- 快照包含位置、生命、近期伤害和时间戳。
- 触发 Rewind 时回到 3 秒前可用快照。
- 恢复近期损失生命的一部分。

第一版只回溯玩家，不回溯整个世界。

原因：

- 更容易实现。
- 玩家更容易理解。
- 不会导致敌人、弹幕、奖励和事件状态复杂化。

未来可以扩展为局部区域回溯或锚点回溯。

## 8. Combat Architecture

第一版建议使用简单对象组合，而不是完整 ECS。

核心对象：

- `Player`
- `Enemy`
- `Projectile`
- `SkillController`
- `RuleController`
- `CombatDirector`

`CombatDirector` 负责：

- 生成敌人波次。
- 判断胜利或失败。
- 应用节点配置。
- 派发战斗事件给规则系统。

战斗事件示例：

```ts
type CombatEvent =
  | { type: "skill_cast"; skillId: string }
  | { type: "dash"; actorId: string }
  | { type: "damage_dealt"; sourceId: string; targetId: string; amount: number }
  | { type: "enemy_frozen"; enemyId: string }
  | { type: "player_low_health" };
```

## 9. Map Generation

第一版地图生成流程：

1. 根据固定深度生成层。
2. 每层生成 2 到 3 个节点。
3. 根据节点权重选择类型。
4. 使用残响和腐化修正权重。
5. 连接相邻层节点。
6. 末尾放置 Boss。

可扩展点：

- 时代主题权重。
- 特殊事件链。
- 残响强制插入节点。
- 周期性活动规则。

## 10. Residue Evaluation

结算流程：

1. 读取 `RunCounters`。
2. 按残响 trigger 计算候选残响。
3. 过滤已经达到堆叠上限的残响。
4. 按优先级选择 1 到 3 条。
5. 写入存档。
6. 下一局开局前展示。

第一版优先级：

- 死亡相关残响优先。
- 高腐化残响优先。
- 行为习惯残响次之。
- 路线习惯残响最后。

## 11. UI Architecture

第一版 UI 可以直接使用 Phaser 文本和图形对象。

适合 Phaser 内实现：

- Combat HUD。
- 技能冷却。
- 腐化条。
- 奖励卡片。
- 时间树节点。

适合未来 DOM 或 React 实现：

- 设置界面。
- 记忆树。
- 长文本日志。
- 存档管理。

UI 规则：

- 所有核心按钮必须有明确文字。
- 战斗内信息不遮挡玩家和敌人。
- 奖励描述短句化。
- 不使用 emoji。

## 12. Testing And Verification

第一版测试重点：

- 地图生成不会断路。
- 奖励选择不会出现无效项。
- 残响持续局数正确减少。
- 腐化阈值计算正确。
- 存档读取失败时能回退。

建议验证命令：

```text
npm run test
npm run build
npm run dev
```

具体命令以后根据项目脚手架确定。

手动验收：

- 启动游戏。
- 完成一场战斗。
- 使用 Time Freeze。
- 使用 Time Rewind。
- 进入奖励界面。
- 完成一局并生成残响。
- 开始下一局并看到残响生效。

## 13. Performance Targets

目标环境：

- 现代桌面浏览器。
- 后续可适配中高端移动浏览器。

第一版性能目标：

- 60 FPS 为目标。
- 同屏敌人不超过 20 个。
- 同屏弹幕不超过 80 个。
- 单局存档数据保持小型 JSON。

性能策略：

- 复用弹幕对象。
- 限制粒子数量。
- 避免每帧大量分配对象。
- 复杂规则只在事件触发时计算。

## 14. Future Technical Extensions

未来可扩展：

- React UI 层。
- IndexedDB 存档。
- Web Worker 生成地图或模拟数据。
- 远程排行榜。
- 赛季规则下载。
- 多语言文本表。

加入任何扩展前，应先确认：

- 是否改善核心游玩。
- 是否能保持短局节奏。
- 是否能在现有模块边界内实现。
