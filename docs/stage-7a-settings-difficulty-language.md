# Stage 7A Settings Scene, Difficulty And Language

# Chrono Echo: Fractured Realms

## 1. Purpose

Stage 7A 新增独立设置页，让游戏适配不同人群：

- 难度：三档，影响战斗压力，照顾休闲玩家和想要挑战的玩家。
- 语言：英文、中文、西班牙文，覆盖全部游戏内文案。
- 音量与音效开关：从主菜单迁移到设置页。

## 2. Scope

本阶段实现：

- 新增 SettingsScene，主菜单通过 `Settings` 按钮进入。
- 设置项：
  - Difficulty：Relaxed / Standard / Intense（轻松 / 标准 / 艰难）。
  - Language：English / 中文 / Español。
  - Sound：On / Off。
  - Volume：Low / Normal / High。
- 所有设置点击即生效、立即本地持久化，独立于游戏存档，Reset Save 不影响设置。
- 难度规则（只作用于敌人，不改玩家数值）：
  - Relaxed：敌人生命 x0.8，敌人伤害 x0.75。
  - Standard：基准体验，无修正。
  - Intense：敌人生命 x1.25，敌人伤害 x1.25。
  - 难度与腐化效果叠乘，时间树 Timeline Report 显示当前难度。
- 多语言框架：
  - `t(key, params)` 词典查询加占位符插值，缺失词条回退英文。
  - 覆盖范围：主菜单、设置页、时间树、战斗 HUD 与状态提示、结果面板、奖励页、结算页、奖励目录、时序规则、残响、腐化层级、节点名称。
  - 存档中历史遗留的残响、规则标题字段不再用于显示，显示统一按 id 经词典渲染，避免切换语言后出现混合语言。

## 3. UX Rules

- 设置页按钮循环切换取值，不做下拉控件，保持和现有 UI 一致的轻量交互。
- 难度按钮旁显示当前档位的效果说明，玩家不需要猜测数值。
- 语言名称始终以本语言显示（English / 中文 / Español），不随界面语言翻译。
- 切换语言后当前页面立即以新语言重绘。

## 4. Technical Shape

- `src/core/meta/settings.ts`：新增 `difficulty` 与 `language` 字段和归一化，版本保持 v1，旧设置自动补默认值。
- `src/core/meta/difficulty.ts`：难度修正表和取值循环。
- `src/core/i18n/index.ts`：`t()` 实现；`src/core/i18n/translations/{en,zh,es}.ts` 词典，zh 与 es 用 `Record<TranslationKey, string>` 约束，漏译在编译期报错。
- `src/game/scenes/SettingsScene.ts`：设置页渲染和输入。
- `CombatScene` 在 `init()` 读取难度修正，应用于敌人生命和敌人伤害。
- `run-manager` 的 `summaryReason` 改存词条 key，结算页渲染时翻译。
- `corruption.ts`、`time-residue.ts` 的格式化函数改用词典输出。

## 5. Scope Control

本阶段暂不处理：

- `docs/how-to-play.md` 等文档的多语言版本。
- 字体嵌入（中文依赖系统字体回退）。
- 难度对奖励质量、腐化增速的影响。
- 局中切换难度对已生成敌人的即时刷新（下一个战斗房间生效）。
- 更多语言。

## 6. Verification Plan

- `npm run build` 必须通过。
- Playwright 验证主菜单 `Settings` 按钮进入设置页，四个设置项初始值正确。
- Playwright 验证语言切换：设置页与主菜单文案变为中文、西班牙文，刷新后保持。
- Playwright 验证难度循环切换并持久化。
- Playwright 验证难度生效：Relaxed 和 Intense 下战斗房间敌人生命符合修正倍率。
- Playwright 验证 Reset Save 后语言与难度设置保持。
- 中文与西班牙文界面截图确认无文本溢出或重叠。
- 验证期间没有 browser page error。

## 7. Verification Result

- `npm run build` 通过，zh 与 es 词典的编译期完整性检查生效。
- Playwright 14 项验证全部通过：
  - 主菜单默认英文，含 `Settings` 入口。
  - 设置页初始值：Difficulty Standard、Language English、Sound On、Volume Normal。
  - 切中文后设置页与主菜单文案为中文，localStorage 持久化，刷新后保持。
  - 切西班牙文后文案为西班牙文。
  - 难度循环 Standard、Intense、Relaxed 并持久化。
  - Relaxed 下战斗敌人生命 [38, 38, 50]，Intense 下 [60, 60, 78]，与 x0.8 / x1.25 修正一致。
  - Reset Save 清空存档但保留语言和难度设置。
  - 验证期间没有 browser page error。
- 中文与西班牙文设置页截图确认无文本溢出或重叠，时间树 Timeline Report 正常显示当前难度。
