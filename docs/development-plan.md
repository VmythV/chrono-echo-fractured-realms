# Development Plan

# Chrono Echo: Fractured Realms

## 1. Planning Principles

开发采用阶段式推进。每个阶段必须有明确目标、交付物、验收标准和 Git 提交节点。

基本原则：

- 先做可玩闭环，再扩展内容。
- 每阶段只解决一个主要风险。
- 玩法和技术改动必须同步更新文档。
- 避免在原型阶段引入过重架构。
- 每个阶段结束时，项目应处于可运行或可验证状态。

## 2. Stage Overview

| Stage | Focus | Output |
| --- | --- | --- |
| Stage 0 | 项目规则和初始概览 | 已完成 |
| Stage 1 | 完整方案和执行文档 | 玩法、计划、技术文档 |
| Stage 2 | 战斗原型 | 可移动、攻击、敌人、技能 |
| Stage 3 | 单局路线闭环 | 时间树、节点、奖励、Boss |
| Stage 4 | 构筑系统 | 技能升级、被动规则、基础平衡 |
| Stage 5 | Time Residue 和腐化 | 局后影响、本地存档、腐化阈值 |
| Stage 6 | Web 可玩版本 | UI、音画反馈、打包、说明 |

## 3. Stage 0: Baseline

状态：完成。

已交付：

- Git 仓库初始化。
- `AGENTS.md` 项目协作规则。
- `docs/overview.md` 初始概览。

提交节点：

- `docs: add project baseline rules`

## 4. Stage 1: Design And Planning Documents

目标：

- 把玩法方案、开发计划和技术方案落地为文档。
- 明确第一版范围和暂不处理内容。
- 为后续开发提供执行依据。

交付物：

- `docs/game-design.md`
- `docs/development-plan.md`
- `docs/technical-plan.md`
- `docs/changelog.md`
- `docs/assets/core-loop.svg`

验收标准：

- 文档覆盖核心循环、战斗、构筑、Time Residue、腐化、敌人、Boss、UI 和扩展策略。
- 开发计划包含阶段、交付物、验收标准和提交节点。
- 技术方案说明模块边界、数据结构、存档方式和扩展方式。
- 文档明确第一版不做的内容，避免范围失控。

提交节点：

- `docs: define game design and development plan`

## 5. Stage 2: Combat Prototype

目标：

- 做出 2D 俯视角战斗基础手感。
- 验证移动、攻击、闪避、Time Freeze 和 Time Rewind 是否好理解。

范围：

- 使用 Web 技术搭建项目。
- 创建一个战斗房间。
- 实现玩家移动、鼠标瞄准、普攻、闪避。
- 实现 2 种敌人：Chaser 和 Shooter。
- 实现 Time Freeze。
- 实现 Time Rewind。
- 实现简单 HUD：生命、技能冷却。

暂不处理：

- 时间树地图。
- 局后成长。
- 完整奖励系统。
- 多房间。
- 音频。

验收标准：

- 本地能启动网页游戏。
- 玩家可在一个房间内完成战斗。
- 敌人能追击或射击玩家。
- Time Freeze 能清晰影响敌人或弹幕。
- Time Rewind 能回到数秒前位置并恢复部分近期伤害。
- 玩家死亡和胜利都有基础状态反馈。

建议提交：

- `feat: add combat prototype`

当前执行记录：

- `docs/stage-2-combat-prototype.md`

## 6. Stage 3: Run Loop And Time Tree

目标：

- 把单场战斗扩展为一局 Roguelike 闭环。

范围：

- 时间树地图生成。
- 节点选择。
- Combat、Elite、Event、Shop、Rest、Boss 基础节点。
- 奖励界面三选一。
- 第一版 Boss：Fracture Warden。
- Run Summary 结算界面。

暂不处理：

- 复杂事件链。
- 局外记忆树。
- 高级残响。

验收标准：

- 玩家可以从开始节点走到 Boss 节点。
- 每局有 8 到 10 个节点。
- 节点类型能按权重生成。
- Boss 被击败后进入结算。
- 失败后进入结算。

建议提交：

- `feat: add run loop and time tree`

当前执行记录：

- `docs/stage-3-run-loop.md`

## 7. Stage 4: Build System

目标：

- 让单局构筑产生可感知变化。

范围：

- 技能升级系统。
- Temporal Rules 系统。
- 奖励权重。
- 第一批 4 到 8 个被动规则。
- 第一批 6 到 10 个技能升级。
- 简单稀有度。

暂不处理：

- 复杂装备。
- 多角色。
- 大量数值平衡。

验收标准：

- 奖励选择能改变玩家战斗方式。
- 同一局内构筑效果在 HUD 或战斗反馈中可观察。
- 每局最多保留 5 个核心被动规则。
- 奖励描述短且清楚。

建议提交：

- `feat: add skill upgrades and temporal rules`

当前执行记录：

- `docs/stage-4-build-system.md`
- `docs/stage-4b-reward-catalog.md`

## 8. Stage 5: Time Residue And Corruption

目标：

- 实现项目最核心的局后影响。

范围：

- 本地存档。
- 腐化值和阈值效果。
- Run Summary 中生成残响。
- 开局前 Timeline Report 展示残响。
- 5 到 8 条第一版残响。
- 残响影响节点权重、奖励权重、敌人属性或特殊敌人。

暂不处理：

- 联机时间线。
- 季节事件。
- 玩家之间的幽灵数据。

验收标准：

- 上一局行为能改变下一局。
- 残响变化在开局前可见。
- 每条残响有持续局数。
- 腐化提升风险和收益都能被玩家理解。
- 玩家不会因为残响进入明显不可玩的局面。

建议提交：

- `feat: add time residue and corruption systems`

## 9. Stage 6: Web Playable Build

目标：

- 整理成可试玩网页版本。

范围：

- 主菜单。
- 设置界面。
- 基础音效和视觉反馈。
- 加载和错误处理。
- 打包流程。
- 基础浏览器兼容验证。
- 游戏说明文档。

暂不处理：

- 正式发行页面。
- 账号系统。
- 付费系统。
- 排行榜。

验收标准：

- 新玩家无需说明即可开始第一局。
- 打包版本能在本地静态服务中运行。
- 核心流程没有阻断性错误。
- 所有第一版系统都有最小反馈。

建议提交：

- `chore: prepare web playable build`

## 10. Development Checkpoints

每个开发阶段结束前检查：

- 文档是否更新。
- 功能是否可运行。
- 是否有基础验证命令或手动验收记录。
- 是否存在未说明的范围扩大。
- Git 状态是否清晰。
- 提交信息是否描述阶段成果。
