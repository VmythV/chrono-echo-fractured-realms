# Chrono Echo: Fractured Realms

网页端休闲 Roguelike：每局 10 到 15 分钟穿越一条破碎的时间线，你的行动会化作"时间残响"，改变之后的每一局。

A casual web roguelike built with Phaser 4. Each 10-15 minute run leaves Time Residue that visibly changes your next runs. Full UI in English, Chinese, and Spanish.

## 特性

- 单局闭环：时间树路线选择、实时俯视角战斗、三选一奖励、Boss 决战与结算。
- 时间技能：冻结（Q）、回溯（E），可通过记忆之树解锁回响攻击（R）与时间锚点（F）。
- 三层成长：局内构筑（技能升级 + 时序规则）、局后残响（9 种，跨局生效）、局外记忆之树（永久解锁）。
- 时间腐化：高风险高回报的全局压力系统，腐化不低于 50 时 Boss 变为错乱守卫。
- 经济系统：战斗掉落时间碎片，用于商店购买与悖论事件抉择。
- 种子化房间：障碍布局与敌人编成按局内种子确定性生成。
- 断点续玩：进度在时间树自动保存，刷新或关页后可从主菜单继续；战斗支持 ESC 暂停。
- 三语支持（英文 / 中文 / 西班牙文）、三档难度、高分屏渲染。

## 操作

| 输入 | 动作 |
| --- | --- |
| WASD | 移动 |
| 鼠标 | 瞄准 |
| 左键 | 攻击 |
| 空格 | 冲刺 |
| Q / E | 时间冻结 / 时间回溯 |
| R / F | 回响攻击 / 时间锚点（记忆之树解锁后） |
| ESC | 战斗中暂停 |

详见 `docs/how-to-play.md`。

## 开发

技术栈：Phaser 4 + TypeScript + Vite。无后端，全部数据存于浏览器 localStorage。

```bash
npm install
npm run dev        # 本地开发 http://127.0.0.1:5173
npm run build      # 类型检查 + 打包到 dist/
npm run preview    # 预览打包产物
```

### 测试

```bash
npx playwright install chromium   # 首次
npm run build
npm run test:e2e                  # 端到端冒烟测试
```

详见 `docs/testing.md`。

## 文档

- `docs/game-design.md`：玩法设计
- `docs/development-plan.md`：阶段计划与验收记录
- `docs/technical-plan.md`：技术方案
- `docs/stage-*.md`：各阶段执行记录
- `docs/changelog.md`：变更历史
- `AGENTS.md`：协作与开发规则

## 许可与致谢

- 精灵素材：[Kenney Space Shooter Redux](https://kenney.nl)（CC0，见 `public/assets/kenney/LICENSE.txt`）
- 标题字体：Orbitron（SIL Open Font License，见 `src/assets/fonts/OFL.txt`）
- 音效为运行时程序合成，无第三方音频资源。
