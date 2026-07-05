# Testing

# Chrono Echo: Fractured Realms

## Smoke Tests

端到端冒烟测试位于 `tests/e2e-smoke.mjs`，针对打包产物运行，覆盖启动、设置持久化、单局流程、经济、断点续玩、暂停和记忆树。

### Prerequisites

```bash
npm install
npx playwright install chromium
```

### Run

```bash
npm run build
npm run test:e2e
```

脚本自动启动 `vite preview`（端口 4181），运行检查后关闭。全部通过输出 `ALL PASS` 并以退出码 0 结束；任何失败输出 `FAILED: n` 并以非 0 退出。

### Conventions

- 测试通过 `window.__chronoEchoGame`（Phaser 实例）与 `window.__chronoEchoDebug.getRun()`（run 状态）断言，不依赖 DOM 文本。
- 画布点击坐标基于 1280x720 设计分辨率换算。
- 新增核心流程时，在 `tests/e2e-smoke.mjs` 中同步补充检查项。
