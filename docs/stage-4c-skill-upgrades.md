# Stage 4C Skill Upgrades

# Chrono Echo: Fractured Realms

## 1. Purpose

Stage 4C 的目标是让 Upgrade 奖励不只改变通用数值，也能直接改变 Time Freeze 和 Time Rewind 的战斗表现。

本阶段仍保持休闲 Roguelike 的复杂度：不做技能树、不做技能替换、不做多段描述，只做玩家一眼能理解的技能升级。

## 2. Scope

本阶段实现：

- 新增 Time Freeze 范围升级。
- 新增 Time Freeze 命中伤害升级。
- 新增 Time Rewind 一次性护盾升级。
- CombatScene 读取这些升级并改变技能表现。
- Map 和 Summary 展示当前技能升级摘要。

## 3. First Skill Upgrades

| Upgrade | Applies To | Effect | Player Read |
| --- | --- | --- | --- |
| Wider Field | Time Freeze | Freeze 范围增加 42 像素 | 更容易冻结目标 |
| Cold Moment | Time Freeze | Freeze 命中敌人时造成 10 点伤害 | Freeze 也能补伤害 |
| Borrowed Breath | Time Rewind | Rewind 后获得 1.2 秒的一次性护盾 | 回溯后更安全 |

## 4. Scope Control

本阶段暂不处理：

- 主动技能替换。
- 技能树。
- 稀有度和权重算法。
- 复杂护盾数值。
- Boss 专属技能抗性。

## 5. Verification Plan

- `npm run build` 必须通过。
- Playwright 验证奖励目录中能出现新增技能升级。
- Playwright 验证选择 Wider Field 后 CombatScene 的 Time Freeze 范围变大。
- Playwright 验证选择 Cold Moment 后 Time Freeze 能对范围内敌人造成伤害。
- Playwright 验证选择 Borrowed Breath 后 Time Rewind 能产生护盾状态。
- Playwright 验证期间没有 browser page error。

## 6. Verification Result

- `npm run build` 通过。
- Playwright UI 路线验证 Event 节点可选择 Borrowed Breath，Shop 节点可选择 Wider Field。
- Playwright UI 路线验证 MapScene 显示 `Skills Freeze radius +42 / Rewind shield 1.2s`。
- Playwright 通过应用实际加载的 Vite module URL 注入升级后验证 CombatScene HUD 显示 `Freeze +42`、`Hit 10` 和 Shield 状态。
- Playwright 验证 Time Freeze 会对范围内敌人显示 10 点伤害反馈。
- Playwright 验证 Time Rewind 会显示 Borrowed Breath 状态和 Shield 反馈。
- Playwright 验证期间没有 browser page error。Headless 截图期间出现 WebGL ReadPixels 性能警告，不影响玩法流程。
