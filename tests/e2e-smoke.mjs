// End-to-end smoke tests for the packaged build.
// Usage: npm run build && npm run test:e2e
// Requires: npx playwright install chromium

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { chromium } from "playwright";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 4181;
const BASE_URL = `http://127.0.0.1:${PORT}/`;

if (!existsSync(join(projectRoot, "dist", "index.html"))) {
  console.error("dist/index.html not found. Run `npm run build` first.");
  process.exit(1);
}

const server = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], {
  cwd: projectRoot,
  stdio: "ignore"
});

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const response = await fetch(BASE_URL);
      if (response.ok) {
        return;
      }
    } catch {
      // server not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("vite preview did not start");
}

const results = [];
const pageErrors = [];

function record(name, pass, detail = "") {
  results.push({ name, pass });
  console.log(`${pass ? "PASS" : "FAIL"} ${name}${detail ? " :: " + detail : ""}`);
}

async function sceneTexts(page, sceneKey) {
  return page.evaluate((key) => {
    const scene = window.__chronoEchoGame.scene.getScene(key);
    return scene.children.list.filter((o) => o.type === "Text").map((t) => t.text);
  }, sceneKey);
}

async function clickGamePoint(page, gameX, gameY) {
  const box = await page.locator("canvas").boundingBox();
  await page.mouse.click(box.x + (gameX / 1280) * box.width, box.y + (gameY / 720) * box.height);
  await page.waitForTimeout(300);
}

async function clickUntil(page, gameX, gameY, predicate) {
  for (let attempt = 0; attempt < 4; attempt++) {
    await clickGamePoint(page, gameX, gameY);
    await page.waitForTimeout(300);
    if (await page.evaluate(predicate)) {
      return true;
    }
  }
  return false;
}

async function clickUntilScene(page, gameX, gameY, sceneKey) {
  for (let attempt = 0; attempt < 4; attempt++) {
    await clickGamePoint(page, gameX, gameY);
    await page.waitForTimeout(300);
    if (await page.evaluate((key) => window.__chronoEchoGame.scene.isActive(key), sceneKey)) {
      return true;
    }
  }
  return false;
}

async function waitForScene(page, key) {
  await page.waitForFunction(
    (sceneKey) => window.__chronoEchoGame && window.__chronoEchoGame.scene.isActive(sceneKey),
    key,
    { timeout: 15000 }
  );
}

async function reloadToMenu(page) {
  await page.reload();
  await waitForScene(page, "MainMenuScene");
  await page.waitForTimeout(400);
}

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on("pageerror", (error) => pageErrors.push(String(error)));

  // 1. Boot
  await page.goto(BASE_URL);
  await waitForScene(page, "MainMenuScene");
  await page.evaluate(() => localStorage.clear());
  await reloadToMenu(page);
  const bootStatus = await page.evaluate(() => document.getElementById("boot-status"));
  record("packaged build boots to menu", bootStatus === null);

  // 2. Language switch persists
  await page.evaluate(() => {
    localStorage.setItem(
      "chrono-echo-settings-v1",
      JSON.stringify({ version: 1, sfxEnabled: true, sfxVolume: 0.7, difficulty: "normal", language: "zh" })
    );
  });
  await reloadToMenu(page);
  let texts = await sceneTexts(page, "MainMenuScene");
  record("chinese language persists", texts.includes("开始一局"));
  await page.evaluate(() => {
    const settings = JSON.parse(localStorage.getItem("chrono-echo-settings-v1"));
    settings.language = "en";
    localStorage.setItem("chrono-echo-settings-v1", JSON.stringify(settings));
  });
  await reloadToMenu(page);

  // 3. Run flow: event node applies its effect
  await clickUntilScene(page, 191, 318, "MapScene"); // Start Run
  const seed = await page.evaluate(() => window.__chronoEchoDebug.getRun().seed);
  await clickUntilScene(page, 120, 428, "EventScene"); // depth-0 event node
  await clickUntilScene(page, 640, 452, "MapScene"); // option B: +10 shards
  let runState = await page.evaluate(() => {
    const state = window.__chronoEchoDebug.getRun();
    return { depth: state.currentDepth, shards: state.shards };
  });
  record("event choice applies", runState.depth === 1 && runState.shards === 10, JSON.stringify(runState));

  // 4. Combat win awards shards, reward returns to map
  await clickUntilScene(page, 255, 250, "CombatScene"); // depth-1 combat
  await page.evaluate(() => {
    const scene = window.__chronoEchoGame.scene.getScene("CombatScene");
    scene.enemies.forEach((enemy) => enemy.sprite.destroy());
  });
  await page.waitForTimeout(500);
  await clickUntilScene(page, 640, 414, "RewardScene"); // Continue
  await clickUntilScene(page, 300, 370, "MapScene"); // take first reward
  runState = await page.evaluate(() => {
    const state = window.__chronoEchoDebug.getRun();
    return { shards: state.shards, rewards: state.rewardsTaken.length };
  });
  record("combat win awards 15 shards", runState.shards === 25 && runState.rewards === 1, JSON.stringify(runState));

  // 5. Continue Run restores the same run after reload
  await reloadToMenu(page);
  texts = await sceneTexts(page, "MainMenuScene");
  record("continue run offered", texts.includes("Continue Run"));
  await clickUntilScene(page, 191, 318, "MapScene"); // Continue Run
  const resumed = await page.evaluate(() => {
    const state = window.__chronoEchoDebug.getRun();
    return { seed: state.seed, shards: state.shards, depth: state.currentDepth };
  });
  record("resumed run matches", resumed.seed === seed && resumed.shards === 25 && resumed.depth === 2, JSON.stringify(resumed));

  // 6. Pause and resume in combat
  await clickUntilScene(page, 390, 292, "CombatScene"); // depth-2 combat
  await page.keyboard.press("Escape", { delay: 120 });
  await page.waitForTimeout(250);
  let pauseState = await page.evaluate(() => {
    const scene = window.__chronoEchoGame.scene.getScene("CombatScene");
    return { paused: scene.paused, physicsPaused: scene.physics.world.isPaused };
  });
  record("esc pauses combat", pauseState.paused && pauseState.physicsPaused, JSON.stringify(pauseState));
  await clickGamePoint(page, 640, 392); // Resume
  pauseState = await page.evaluate(() => {
    const scene = window.__chronoEchoGame.scene.getScene("CombatScene");
    return { paused: scene.paused, physicsPaused: scene.physics.world.isPaused };
  });
  record("resume unpauses combat", !pauseState.paused && !pauseState.physicsPaused, JSON.stringify(pauseState));

  // 7. Memory tree unlock
  await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem("chrono-echo-save-v1")) ?? {
      version: 1,
      activeResidues: [],
      runHistory: [],
      highestCorruption: 0,
      lastRunCorruption: 0,
      memories: 0,
      unlockedMemories: []
    };
    save.memories = 50;
    save.unlockedMemories = [];
    localStorage.setItem("chrono-echo-save-v1", JSON.stringify(save));
    localStorage.removeItem("chrono-echo-run-v1");
  });
  await reloadToMenu(page);
  await clickUntilScene(page, 191, 383, "MemoryScene"); // Memory Tree (no resumable run)
  const unlockedVitality = await clickUntil(page, 250, 260, () =>
    JSON.parse(localStorage.getItem("chrono-echo-save-v1")).unlockedMemories.includes("vitality")
  );
  const memoriesLeft = await page.evaluate(() => JSON.parse(localStorage.getItem("chrono-echo-save-v1")).memories);
  record("memory node unlock deducts cost", unlockedVitality && memoriesLeft === 40, `memories=${memoriesLeft}`);

  // 8. Reset Save clears save but keeps settings
  await clickUntilScene(page, 191, 630, "MainMenuScene"); // Back
  await clickUntil(page, 191, 519, () => localStorage.getItem("chrono-echo-save-v1") === null); // Reset Save
  const afterReset = await page.evaluate(() => ({
    save: localStorage.getItem("chrono-echo-save-v1"),
    settings: localStorage.getItem("chrono-echo-settings-v1")
  }));
  record("reset clears save, keeps settings", afterReset.save === null && afterReset.settings !== null);

  record("no page errors", pageErrors.length === 0, pageErrors.join(" ; "));

  await browser.close();
}

let exitCode = 0;

try {
  await waitForServer();
  await run();
  const failed = results.filter((r) => !r.pass).length;
  console.log(failed === 0 ? "ALL PASS" : `FAILED: ${failed}`);
  exitCode = failed === 0 ? 0 : 1;
} catch (error) {
  console.error("SMOKE TEST ERROR:", error);
  exitCode = 1;
} finally {
  server.kill();
}

process.exit(exitCode);
