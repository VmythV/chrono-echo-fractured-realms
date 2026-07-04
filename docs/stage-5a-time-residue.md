# Stage 5A Time Residue

# Chrono Echo: Fractured Realms

## 1. Purpose

Stage 5A 的目标是实现最小 Time Residue 闭环：一局结束后生成可见残响，下一局开始时读取残响并产生轻量影响。

本阶段只验证“上一局会影响下一局”的核心体验，不做完整腐化阈值、不做多局故事链、不做复杂惩罚。

## 2. Scope

本阶段实现：

- 使用 `localStorage` 保存 active residues 和 run history。
- Run Summary 中生成 1 到 3 条残响。
- 下一局开始时应用 active residues。
- MapScene 显示 Timeline Report。
- SummaryScene 显示本局生成的 residues。
- 记录最小 run counters：Time Freeze 使用次数、Time Rewind 使用次数、商店、事件、精英和战斗节点。

## 3. First Residues

| Residue | Trigger | Duration | Next Run Effect |
| --- | --- | --- | --- |
| Victory Echo | 击败 Boss | 1 局 | 起始攻击 +4 |
| Last Stand Memory | 本局失败 | 1 局 | 起始最大生命 +12 |
| Frozen Timeline | 一局内 Time Freeze 使用 2 次以上 | 2 局 | Time Freeze 冷却缩短 0.5 秒 |
| Recall Trace | 一局内 Time Rewind 使用 1 次以上 | 2 局 | Time Rewind 冷却缩短 0.5 秒 |
| Merchant Memory | 完成至少 1 个 Shop 节点 | 2 局 | 起始最大生命 +6 |

每局最多生成 3 条残响，避免 Summary 信息过载。

## 4. Scope Control

本阶段暂不处理：

- 腐化值和腐化阈值。
- 残响移除、锁定或刷新。
- 负面残响。
- 特殊残响敌人。
- 云端存档或跨设备同步。

## 5. Technical Shape

- `src/core/meta/save-state.ts` 管理 `localStorage` 存档。
- `src/core/meta/time-residue.ts` 管理残响生成、合并、消耗和效果应用。
- `RunState` 记录 applied residues、generated residues、run counters 和 summary 是否已记录。
- `startNewRun()` 创建 run 后立即消费并应用 active residues。
- `SummaryScene` 调用 finalize 方法，保证同一局只写入一次 run history。

## 6. Verification Plan

- `npm run build` 必须通过。
- Playwright 验证 SummaryScene 能生成 residues。
- Playwright 验证 `localStorage` 中写入 active residues 和 run history。
- Playwright 验证下一局 MapScene 显示 Timeline Report。
- Playwright 验证 active residue 能改变下一局起始属性。
- Playwright 验证期间没有 browser page error。

## 7. Verification Result

- `npm run build` 通过。
- Playwright 临时验证通过 2 条用例。
- 胜利局生成 `Victory Echo`、`Frozen Timeline`、`Recall Trace`，每局最多 3 条残响的限制生效。
- 结算后 `localStorage` 写入 active residues 和 run history；下一局开始后 `Victory Echo` 被消费，2 局残响剩余 1 局。
- 下一局起始属性正确应用：攻击 +4，Time Freeze 冷却 -0.5 秒，Time Rewind 冷却 -0.5 秒。
- 预置残响后进入 MapScene，Timeline Report 正常显示已应用残响，1280x720 截图无 UI 重叠。
- 验证期间没有 browser page error。
