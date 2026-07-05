# Stage 6C Playable Build

# Chrono Echo: Fractured Realms

## 1. Purpose

Stage 6C 完成 Stage 6 的收尾：补齐加载与错误处理、可移植的打包配置、玩家操作说明，并对打包产物做基础浏览器验证，使项目达到"可试玩网页版本"状态。

## 2. Scope

本阶段实现：

- 页面加载指示：游戏引导完成前显示加载文字，Phaser READY 后移除。
- 全局错误处理：未捕获异常和未处理的 Promise 拒绝会显示错误浮层，提供 Reload 和 Dismiss 两个操作。
- 无 JavaScript 环境显示 noscript 提示。
- Vite `base` 设置为 `./`，打包产物可部署在任意静态路径下。
- 主菜单增加操作提示文字，新玩家无需文档即可开始第一局。
- 新增 `docs/how-to-play.md` 游戏说明文档。

## 3. UX Rules

- 加载指示只用短文字，不做进度条或启动动画。
- 错误浮层必须允许玩家选择继续（Dismiss），不强制刷新。
- 操作提示放在主菜单次要位置，不干扰 Start Run 主操作。

## 4. Technical Shape

- `index.html`：`#boot-status` 加载指示与 `noscript` 提示。
- `src/main.ts`：READY 事件移除加载指示；`window` 的 `error` 与 `unhandledrejection` 监听创建 `#error-overlay`。
- `src/styles.css`：加载指示与错误浮层样式。
- `vite.config.ts`：`base: "./"`。
- `MainMenuScene`：左下角两行操作提示。
- `window.__chronoEchoGame` 调试句柄从 dev-only 改为始终暴露，使打包产物可以被自动化验证。游戏为纯本地单机页面，该句柄无安全影响。

## 5. Scope Control

本阶段暂不处理：

- 正式发行页面和域名部署。
- 资源分包与代码分割（Phaser 单包体积警告保留）。
- 错误上报服务。
- 移动端触控适配。

## 6. Verification Plan

- `npm run build` 必须通过。
- 打包产物从非根路径（`/dist/`）经静态服务器加载可正常运行，验证 `base: "./"`。
- Playwright 验证打包版本首屏为 MainMenuScene，`#boot-status` 已移除。
- Playwright 验证 Start Run 到 MapScene 的流程在打包版本可用。
- Playwright 验证注入未捕获异常后错误浮层出现，Dismiss 可关闭且游戏继续运行。
- Chromium 与 WebKit 两种内核完成以上冒烟验证。
- 验证期间没有非注入的 browser page error。

## 7. Verification Result

- `npm run build` 通过，产物为 `dist/index.html` 加单 JS 与单 CSS 文件，资源引用为相对路径。
- 打包产物经静态服务器从 `/dist/` 子路径加载运行正常，`base: "./"` 生效。
- Chromium 与 WebKit 双内核 Playwright 验证各 7 项全部通过：
  - 打包版本首屏为 MainMenuScene。
  - Phaser READY 后 `#boot-status` 已移除。
  - 主菜单操作提示文字可见。
  - `Start Run` 进入 MapScene。
  - 注入未捕获异常后错误浮层出现并显示错误信息。
  - Dismiss 关闭浮层后游戏继续运行。
  - 无非注入的 browser page error。
- 1280x720 截图确认主菜单四个按钮与操作提示无重叠。
