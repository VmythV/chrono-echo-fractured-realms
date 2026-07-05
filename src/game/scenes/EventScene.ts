import Phaser from "phaser";
import { t } from "../../core/i18n";
import {
  applyEventOption,
  canChooseEventOption,
  getEventForNode,
  type ParadoxEvent
} from "../../core/run/event-catalog";
import { completeNode, getNodeById, getRun } from "../../core/run/run-manager";
import { playSfx } from "../audio/sfx";
import { DISPLAY_FONT } from "../display";
import { drawPixelPanel, PIXEL_UI } from "../pixel-ui";
import { fadeInScene, transitionTo } from "../scene-transitions";

type EventSceneData = {
  nodeId: string;
};

export class EventScene extends Phaser.Scene {
  private nodeId = "";

  constructor() {
    super("EventScene");
  }

  init(data: EventSceneData): void {
    this.nodeId = data.nodeId;
  }

  create(): void {
    fadeInScene(this);
    const run = getRun();
    const node = getNodeById(this.nodeId);
    const event = node ? getEventForNode(node) : getEventForNode({ id: "", depth: 0, lane: 0, type: "event", label: "" });

    this.add.rectangle(640, 360, 1280, 720, 0x1a1c2c);
    this.add.text(64, 46, t(`event.${event.id}.title`), {
      color: "#f7f3e8",
      fontFamily: DISPLAY_FONT,
      fontSize: "18px"
    });
    this.add.text(64, 100, t("shards.label", { count: run.shards }), {
      color: "#d5b65f",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "17px"
    });
    this.add.text(64, 128, t("common.health", { current: run.player.health, max: run.player.maxHealth }), {
      color: "#cbd7e2",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "17px"
    });

    this.add.text(640, 236, t(`event.${event.id}.desc`), {
      align: "center",
      color: "#cbd7e2",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "19px",
      lineSpacing: 8,
      wordWrap: { width: 720 }
    }).setOrigin(0.5, 0.5);

    this.drawOption(event, "a", 330);
    this.drawOption(event, "b", 452);
  }

  private drawOption(event: ParadoxEvent, optionId: "a" | "b", y: number): void {
    const run = getRun();
    const option = event.options.find((candidate) => candidate.id === optionId);

    if (!option) {
      return;
    }

    const affordable = canChooseEventOption(option, run);
    const card = drawPixelPanel(
      this,
      640,
      y,
      720,
      96,
      affordable ? PIXEL_UI.panelDark : 0x14151f,
      affordable ? PIXEL_UI.border : 0x333c57
    );

    const label = this.add.text(640, y, t(`event.${event.id}.${optionId}`), {
      align: "center",
      color: affordable ? "#e7edf2" : "#5a7288",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "17px",
      lineSpacing: 6,
      wordWrap: { width: 640 }
    }).setOrigin(0.5, 0.5);

    if (!affordable) {
      this.add.text(640, y + 34, t("shop.notEnough"), {
        align: "center",
        color: "#f18f6f",
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "13px"
      }).setOrigin(0.5, 0.5);
      return;
    }

    card.inner.setInteractive({ useHandCursor: true });
    card.inner.on("pointerover", () => card.frame.setFillStyle(PIXEL_UI.accentBright));
    card.inner.on("pointerout", () => card.frame.setFillStyle(PIXEL_UI.border));
    card.inner.on("pointerup", () => {
      playSfx("uiClick");
      this.chooseOption(event, optionId);
    });
    label.setData("optionId", optionId);
  }

  private chooseOption(event: ParadoxEvent, optionId: "a" | "b"): void {
    applyEventOption(event, optionId, getRun());
    completeNode(this.nodeId);
    transitionTo(this, "MapScene");
  }
}
