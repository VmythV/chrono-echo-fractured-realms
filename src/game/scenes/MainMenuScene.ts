import Phaser from "phaser";
import { t } from "../../core/i18n";
import { formatCorruptionState } from "../../core/meta/corruption";
import { clearSaveData, loadSaveData, type SaveData } from "../../core/meta/save-state";
import { formatResidues } from "../../core/meta/time-residue";
import { clearRunSnapshot, hasResumableRun, resumeSavedRun, startNewRun } from "../../core/run/run-manager";
import { playSfx } from "../audio/sfx";

type MenuButtonVariant = "primary" | "secondary";

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super("MainMenuScene");
  }

  create(): void {
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
    this.add.rectangle(640, 360, 1280, 720, 0x10151c);

    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0x263746, 0.68);
    graphics.beginPath();
    graphics.moveTo(110, 570);
    graphics.lineTo(284, 458);
    graphics.lineTo(452, 494);
    graphics.lineTo(636, 338);
    graphics.lineTo(812, 470);
    graphics.lineTo(1014, 520);
    graphics.lineTo(1168, 448);
    graphics.strokePath();

    [
      [110, 570, 14, 0x6edbd6],
      [284, 458, 20, 0x8fd694],
      [452, 494, 16, 0xd5b65f],
      [636, 338, 24, 0x8be9fd],
      [812, 470, 17, 0xf18f6f],
      [1014, 520, 26, 0xb57be8],
      [1168, 448, 14, 0x6edbd6]
    ].forEach(([x, y, radius, color]) => {
      graphics.fillStyle(color, 0.2);
      graphics.fillCircle(x, y, radius);
      graphics.lineStyle(2, color, 0.82);
      graphics.strokeCircle(x, y, radius);
    });

    this.add.rectangle(640, 360, 1280, 720, 0x10151c, 0.3);
  }

  private drawTitle(): void {
    this.add.text(72, 76, "Chrono Echo", {
      color: "#f7f3e8",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "54px"
    });
    this.add.text(76, 136, "Fractured Realms", {
      color: "#8be9fd",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "24px"
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
    this.createButton(76, y, 230, 42, t("menu.memoryTree"), "secondary", () => this.scene.start("MemoryScene"));
    y += 60;
    this.createButton(76, y, 230, 42, t("menu.settings"), "secondary", () => this.scene.start("SettingsScene"));
    y += 60;
    this.createButton(76, y, 230, 42, t("menu.resetSave"), "secondary", () => this.resetSave());
  }

  private continueRun(): void {
    if (resumeSavedRun()) {
      this.scene.start("MapScene");
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
    const fill = variant === "primary" ? 0x263746 : 0x18222c;
    const stroke = variant === "primary" ? 0x8be9fd : 0x5a7288;
    const textColor = variant === "primary" ? "#f7f3e8" : "#cbd7e2";
    const button = this.add.rectangle(x, y, width, height, fill, 1).setOrigin(0, 0);
    button.setStrokeStyle(2, stroke, 1);
    button.setInteractive({ useHandCursor: true });
    button.on("pointerover", () => button.setStrokeStyle(3, 0x8be9fd, 1));
    button.on("pointerout", () => button.setStrokeStyle(2, stroke, 1));
    button.on("pointerup", () => {
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
    this.scene.start("MapScene");
  }

  private resetSave(): void {
    clearSaveData();
    clearRunSnapshot();
    this.scene.restart();
  }
}
