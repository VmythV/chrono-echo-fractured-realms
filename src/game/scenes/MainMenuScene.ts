import Phaser from "phaser";
import { t } from "../../core/i18n";
import { formatCorruptionState } from "../../core/meta/corruption";
import { clearSaveData, loadSaveData, type SaveData } from "../../core/meta/save-state";
import { formatResidues } from "../../core/meta/time-residue";
import { clearRunSnapshot, hasResumableRun, resumeSavedRun, startNewRun } from "../../core/run/run-manager";
import { playSfx } from "../audio/sfx";
import { DISPLAY_FONT } from "../display";
import { makePixelButton } from "../pixel-ui";
import { fadeInScene, transitionTo } from "../scene-transitions";

type MenuButtonVariant = "primary" | "secondary";

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super("MainMenuScene");
  }

  create(): void {
    fadeInScene(this);
    const saveData = loadSaveData();

    this.drawBackground();
    this.drawTitle();
    this.drawSaveSummary(saveData);
    this.drawActions();
    this.drawControlsHint();
  }

  private drawControlsHint(): void {
    this.add.text(76, 612, t("menu.controlsHint"), {
      color: "#8fa3b5",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "15px",
      lineSpacing: 6
    });
  }

  private drawBackground(): void {
    this.add.rectangle(640, 360, 1280, 720, 0x1a1c2c);

    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0x29366f, 0.68);
    graphics.beginPath();
    graphics.moveTo(110, 570);
    graphics.lineTo(360, 486);
    graphics.lineTo(452, 494);
    graphics.lineTo(636, 338);
    graphics.lineTo(812, 470);
    graphics.lineTo(1014, 520);
    graphics.lineTo(1168, 448);
    graphics.strokePath();

    [
      [110, 570, 14, 0x73eff7],
      [360, 486, 20, 0xa7f070],
      [452, 494, 16, 0xffcd75],
      [636, 338, 24, 0x41a6f6],
      [812, 470, 17, 0xb13e53],
      [1014, 520, 26, 0x3b5dc9],
      [1168, 448, 14, 0x73eff7]
    ].forEach(([x, y, radius, color], index) => {
      const node = this.add.circle(x, y, radius, color, 0.2);
      node.setStrokeStyle(2, color, 0.82);
      this.tweens.add({
        targets: node,
        alpha: 0.45,
        scale: 1.18,
        yoyo: true,
        repeat: -1,
        duration: 1500 + index * 160,
        delay: index * 210,
        ease: "sine.inOut"
      });
    });

    if (!this.textures.exists("menu-soft")) {
      const soft = this.add.graphics();
      soft.fillStyle(0xffffff, 0.18);
      soft.fillCircle(9, 9, 8);
      soft.fillStyle(0xffffff, 0.4);
      soft.fillCircle(9, 9, 5);
      soft.fillStyle(0xffffff, 0.85);
      soft.fillCircle(9, 9, 2.5);
      soft.generateTexture("menu-soft", 18, 18);
      soft.destroy();
    }

    this.add
      .particles(0, 0, "menu-soft", {
        emitZone: {
          type: "random" as const,
          source: new Phaser.Geom.Rectangle(
            0,
            120,
            1280,
            600
          ) as unknown as Phaser.Types.GameObjects.Particles.RandomZoneSource
        },
        lifespan: { min: 5000, max: 9000 },
        speedY: { min: -14, max: -5 },
        speedX: { min: -4, max: 4 },
        alpha: { start: 0.16, end: 0 },
        scale: { start: 0.8, end: 0.2 },
        frequency: 300,
        tint: [0x73eff7, 0xa7f070, 0x3b5dc9],
        blendMode: "ADD"
      })
      .setDepth(1);

    this.add.rectangle(640, 360, 1280, 720, 0x1a1c2c, 0.3);
  }

  private drawTitle(): void {
    this.add.text(72, 76, "Chrono Echo", {
      color: "#f7f3e8",
      fontFamily: DISPLAY_FONT,
      fontSize: "30px"
    });
    this.add.text(76, 136, "Fractured Realms", {
      color: "#8be9fd",
      fontFamily: DISPLAY_FONT,
      fontSize: "13px"
    });
    this.add.text(76, 184, t("menu.tagline"), {
      color: "#cbd7e2",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "18px",
      wordWrap: { width: 440 }
    });
  }

  private drawSaveSummary(saveData: SaveData): void {
    const latestRun = saveData.runHistory[0];

    this.add.text(760, 82, t("menu.timelineState"), {
      color: "#f7f3e8",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "28px"
    });

    const lastRunValue = latestRun
      ? t("menu.lastRunValue", {
          result: latestRun.result === "won" ? t("common.won") : t("common.lost"),
          nodes: latestRun.nodesCleared
        })
      : t("common.none");
    const summaryLines = [
      t("menu.activeResidues", { value: formatResidues(saveData.activeResidues) }),
      t("menu.lastRun", { value: lastRunValue }),
      t("menu.lastCorruption", { value: formatCorruptionState(saveData.lastRunCorruption) }),
      t("menu.highestCorruption", { value: formatCorruptionState(saveData.highestCorruption) }),
      t("menu.memories", { count: saveData.memories })
    ];

    this.add.text(760, 134, summaryLines.join("\n"), {
      color: "#cbd7e2",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "17px",
      lineSpacing: 10,
      wordWrap: { width: 430 }
    });

    this.drawRecentHistory(saveData);
  }

  private drawRecentHistory(saveData: SaveData): void {
    this.add.text(760, 316, t("menu.recentRuns"), {
      color: "#f7f3e8",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "20px"
    });

    const historyLines =
      saveData.runHistory.length === 0
        ? [t("menu.noRuns")]
        : saveData.runHistory.slice(0, 4).map((entry, index) =>
            t("menu.historyLine", {
              index: index + 1,
              result: entry.result === "won" ? t("common.won") : t("common.lost"),
              nodes: entry.nodesCleared,
              corruption: entry.corruption
            })
          );

    this.add.text(760, 356, historyLines.join("\n"), {
      color: "#cbd7e2",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "16px",
      lineSpacing: 8,
      wordWrap: { width: 430 }
    });
  }

  private drawActions(): void {
    const resumable = hasResumableRun();
    let y = 294;

    if (resumable) {
      this.createButton(76, y, 230, 48, t("menu.continueRun"), "primary", () => this.continueRun());
      y += 68;
    }

    this.createButton(76, y, 230, resumable ? 42 : 48, t("menu.startRun"), resumable ? "secondary" : "primary", () =>
      this.startRun()
    );
    y += resumable ? 60 : 68;
    this.createButton(76, y, 230, 42, t("menu.memoryTree"), "secondary", () => transitionTo(this, "MemoryScene"));
    y += 60;
    this.createButton(76, y, 230, 42, t("menu.settings"), "secondary", () => transitionTo(this, "SettingsScene"));
    y += 60;
    this.createButton(76, y, 230, 42, t("menu.resetSave"), "secondary", () => this.resetSave());
  }

  private continueRun(): void {
    if (resumeSavedRun()) {
      transitionTo(this, "MapScene");
      return;
    }

    this.scene.restart();
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    variant: MenuButtonVariant,
    onClick: () => void
  ): Phaser.GameObjects.Text {
    const textColor = variant === "primary" ? "#f4f4f4" : "#94b0c2";
    makePixelButton(this, x + width / 2, y + height / 2, width, height, variant === "primary", () => {
      playSfx("uiClick");
      onClick();
    });

    return this.add.text(x + width / 2, y + height / 2, label, {
      align: "center",
      color: textColor,
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: variant === "primary" ? "18px" : "16px"
    }).setOrigin(0.5, 0.5);
  }

  private startRun(): void {
    startNewRun();
    transitionTo(this, "MapScene");
  }

  private resetSave(): void {
    clearSaveData();
    clearRunSnapshot();
    this.scene.restart();
  }
}
