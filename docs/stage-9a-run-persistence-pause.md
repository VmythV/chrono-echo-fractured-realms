# Stage 9A Run Persistence And Combat Pause

# Chrono Echo: Fractured Realms

## 1. Purpose

单局时长 10 到 15 分钟，但 run 状态只存在内存中：刷新页面、误关标签页或在错误浮层点 Reload 都会丢掉整局。战斗中也没有暂停。Stage 9A 补上这两个影响真实留存的基础体验。

## 2. Scope

本阶段实现：

- 局内进度快照：
  - 每次回到时间树（MapScene）时把当前 RunState 序列化到 `chrono-echo-run-v1`。
  - 主菜单检测到可恢复的 run（result 为 running）时，显示 `Continue Run` 主按钮，`Start Run` 降为次按钮。
  - Continue 恢复完整 run：地图、深度、生命、碎片、规则、技能升级、残响、腐化。
  - 快照清除时机：玩家死亡（failRun）、击败 Boss（completeNode）、开新局、Reset Save。
  - 战斗、事件、商店中途刷新会回到进入该节点之前的时间树状态（节点未完成），文档明示该规则。
  - 损坏的快照静默丢弃并清除。
- 战斗暂停：
  - 战斗中按 ESC 打开暂停面板：Paused 标题、Resume、Main Menu、进度保存提示。
  - 暂停时物理世界暂停、战斗更新循环停止；再按 ESC 或点 Resume 继续。
  - Main Menu 返回主菜单，run 保留在最后一次时间树快照，可从菜单继续。
  - 结果面板显示期间 ESC 无效，避免状态叠加。
- 新文案提供英文、中文、西班牙文。

## 3. UX Rules

- Continue Run 是有可恢复 run 时的默认主操作，放在原 Start Run 的位置。
- 暂停面板必须说明进度保存位置，避免玩家误以为战斗中进度会保存。
- 暂停不提供"放弃本局"按钮，退出主菜单即等效于回到上个检查点。

## 4. Technical Shape

- `run-manager.ts`：`saveRunSnapshot`、`clearRunSnapshot`、`hasResumableRun`、`resumeSavedRun`；`failRun` 与 Boss `completeNode` 内清除快照；`startNewRun` 开局清除旧快照。RunState 本身是纯数据，可直接 JSON 序列化。
- `MapScene.create` 作为唯一快照写入点。
- `MainMenuScene`：按钮列动态增加 Continue Run；Reset Save 同时清除快照。
- `CombatScene`：ESC 监听、暂停面板、`update` 提前返回、`physics.world.pause/resume`。

## 5. Scope Control

本阶段暂不处理：

- 战斗中逐帧状态的保存（刷新回到节点前是设计行为）。
- 多存档位。
- 云同步。
- 暂停时的设置入口。

## 6. Verification Plan

- `npm run build` 必须通过。
- Playwright 验证：开局进图后刷新，主菜单出现 Continue Run，恢复后 seed、生命、碎片一致。
- Playwright 验证：完成一个节点后刷新恢复，深度与奖励保留。
- Playwright 验证：战斗死亡后快照被清除，菜单不再显示 Continue Run。
- Playwright 验证：ESC 暂停时物理暂停、面板显示，Resume 恢复；暂停中返回主菜单后仍可 Continue。
- Playwright 验证中文文案渲染。
- 验证期间没有 browser page error。

## 7. Verification Result

- `npm run build` 通过。
- Playwright 11 项验证全部通过：
  - 开局进图后刷新，主菜单出现 Continue Run，恢复后 seed 与生命一致。
  - 完成事件节点（+10 碎片）后刷新恢复，深度 1、碎片 10、seed 不变。
  - 战斗死亡后 `chrono-echo-run-v1` 被清除，刷新后菜单不再显示 Continue Run。
  - ESC 暂停后 `paused` 与物理世界暂停生效、Paused 面板显示；Resume 恢复两者。
  - 暂停中返回主菜单后 run 仍可继续，Continue 回到时间树。
  - 中文语言下显示"继续冒险"。
  - 验证期间没有 browser page error。
