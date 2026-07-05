import Phaser from "phaser";
import { t } from "../../core/i18n";
import { getMemoryNodeStatus, MEMORY_TREE, unlockMemoryNode, type MemoryNode } from "../../core/meta/memory-tree";
import { loadSaveData } from "../../core/meta/save-state";
import { playSfx } from "../audio/sfx";
import { DISPLAY_FONT } from "../display";
import { drawPixelPanel, makePixelButton, PIXEL_UI } from "../pixel-ui";
import { fadeInScene, transitionTo } from "../scene-transitions";

const NODE_POSITIONS: Record<MemoryNode["id"], { x: number; y: number }> = {
  vitality: { x: 250, y: 260 },
  sharpness: { x: 250, y: 452 },
  echoAttack: { x: 640, y: 260 },
  timeAnchor: { x: 640, y: 452 },
  merchantPact: { x: 1030, y: 260 }
};

export class MemoryScene extends Phaser.Scene {
  constructor() {
    super("MemoryScene");
  }

  create(): void {
    fadeInScene(this);
    const saveData = loadSaveData();

    this.add.rectangle(640, 360, 1280, 720, 0x1a1c2c);
    this.add.text(72, 56, t("memory.title"), {
      color: "#f7f3e8",
      fontFamily: DISPLAY_FONT,
      fontSize: "24px"
    });
    this.add.text(76, 118, t("memory.balance", { count: saveData.memories }), {
      color: "#d5b65f",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "20px"
    });
    this.add.text(76, 150, t("memory.hint"), {
      color: "#6f8497",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "14px"
    });

    this.drawBranchLink("vitality", "sharpness");
    this.drawBranchLink("echoAttack", "timeAnchor");
    MEMORY_TREE.forEach((node) => this.drawNode(node));

    this.drawBackButton();
  }

  private drawBranchLink(fromId: MemoryNode["id"], toId: MemoryNode["id"]): void {
    const from = NODE_POSITIONS[fromId];
    const to = NODE_POSITIONS[toId];
    const link = this.add.line(0, 0, from.x, from.y + 78, to.x, to.y - 78, 0x2f4053, 1);
    link.setOrigin(0, 0);
    link.setLineWidth(2);
  }

  private drawNode(node: MemoryNode): void {
    const saveData = loadSaveData();
    const status = getMemoryNodeStatus(node, saveData);
    const position = NODE_POSITIONS[node.id];
    const unlocked = status === "unlocked";
    const available = status === "available";

    const card = drawPixelPanel(
      this,
      position.x,
      position.y,
      320,
      156,
      unlocked ? 0x1d3b46 : available ? PIXEL_UI.panelDark : 0x14151f,
      unlocked ? 0x38b764 : available ? PIXEL_UI.accent : 0x333c57
    );

    this.add.text(position.x, position.y - 50, t(`memory.${node.id}.title`), {
      align: "center",
      color: unlocked ? "#6edbd6" : available ? "#f7f3e8" : "#5a7288",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "20px"
    }).setOrigin(0.5, 0.5);

    this.add.text(position.x, position.y - 6, t(`memory.${node.id}.desc`), {
      align: "center",
      color: unlocked || available ? "#cbd7e2" : "#5a7288",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "14px",
      lineSpacing: 5,
      wordWrap: { width: 284 }
    }).setOrigin(0.5, 0.5);

    const stateText =
      status === "unlocked"
        ? t("memory.unlockedTag")
        : status === "available"
          ? t("memory.unlockAction", { cost: node.cost })
          : status === "missingRequirement" && node.requires
            ? t("memory.requires", { name: t(`memory.${node.requires}.title`) })
            : `${t("memory.notEnough")} (${node.cost})`;

    this.add.text(position.x, position.y + 54, stateText, {
      align: "center",
      color: status === "unlocked" ? "#6edbd6" : status === "available" ? "#8be9fd" : "#f18f6f",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "14px"
    }).setOrigin(0.5, 0.5);

    if (!available) {
      return;
    }

    card.inner.setInteractive({ useHandCursor: true });
    card.inner.on("pointerover", () => card.frame.setFillStyle(PIXEL_UI.accentBright));
    card.inner.on("pointerout", () => card.frame.setFillStyle(PIXEL_UI.accent));
    card.inner.on("pointerup", () => {
      playSfx("uiClick");

      if (unlockMemoryNode(node.id)) {
        this.scene.restart();
      }
    });
  }

  private drawBackButton(): void {
    makePixelButton(this, 191, 630, 230, 48, true, () => {
      playSfx("uiClick");
      transitionTo(this, "MainMenuScene");
    });

    this.add.text(191, 630, t("common.back"), {
      align: "center",
      color: "#f7f3e8",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "18px"
    }).setOrigin(0.5, 0.5);
  }
}
