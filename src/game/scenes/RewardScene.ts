import Phaser from "phaser";
import { isTranslationKey, t } from "../../core/i18n";
import { formatCorruptionState } from "../../core/meta/corruption";
import { applyReward, completeNode, getNodeById, getRewards, getRun } from "../../core/run/run-manager";
import { getRuleSlotText } from "../../core/run/reward-catalog";
import type { RewardContext, RewardKind } from "../../core/run/run-state";
import { playSfx } from "../audio/sfx";

type RewardSceneData = {
  nodeId: string;
  context: RewardContext;
};

const REWARD_KIND_COLORS: Record<RewardKind, string> = {
  Upgrade: "#f7d06e",
  Rule: "#8be9fd",
  Recovery: "#8fd694",
  Corrupted: "#f18f6f"
};

export class RewardScene extends Phaser.Scene {
  private nodeId = "";
  private context: RewardSceneData["context"] = "combat";

  constructor() {
    super("RewardScene");
  }

  init(data: RewardSceneData): void {
    this.nodeId = data.nodeId;
    this.context = data.context;
  }

  create(): void {
    const run = getRun();
    const node = getNodeById(this.nodeId);
    const choices = getRewards(this.context);
    const title = node
      ? t("reward.title", { label: node.type === "boss" ? t("node.bossName") : t(`node.${node.type}`) })
      : t("reward.fallbackTitle");

    this.add.rectangle(640, 360, 1280, 720, 0x10151c);
    this.add.text(64, 46, title, {
      color: "#f7f3e8",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "32px"
    });
    this.add.text(64, 92, t("common.health", { current: run.player.health, max: run.player.maxHealth }), {
      color: "#cbd7e2",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "18px"
    });
    this.add.text(64, 120, t("reward.ruleSlots", { value: getRuleSlotText(run) }), {
      color: "#cbd7e2",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "16px"
    });
    this.add.text(64, 146, t("reward.corruption", { value: formatCorruptionState(run.corruption) }), {
      color: "#cbd7e2",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "16px"
    });

    choices.forEach((choice, index) => {
      const x = 300 + index * 320;
      const card = this.add.rectangle(x, 370, 260, 240, 0x18222c, 1);
      card.setStrokeStyle(2, 0x5a7288, 1);
      card.setInteractive({ useHandCursor: true });
      card.on("pointerover", () => card.setStrokeStyle(3, 0x8be9fd, 1));
      card.on("pointerout", () => card.setStrokeStyle(2, 0x5a7288, 1));
      card.on("pointerup", () => this.chooseReward(choice.id));

      const titleKey = `reward.${choice.id}.title`;
      const descriptionKey = `reward.${choice.id}.desc`;

      this.add.text(x, 280, t(`kind.${choice.kind}`), {
        align: "center",
        color: REWARD_KIND_COLORS[choice.kind],
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "14px"
      }).setOrigin(0.5, 0.5);

      this.add.text(x, 326, isTranslationKey(titleKey) ? t(titleKey) : choice.title, {
        align: "center",
        color: "#f7f3e8",
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "22px",
        wordWrap: { width: 210 }
      }).setOrigin(0.5, 0.5);

      this.add.text(x, 394, isTranslationKey(descriptionKey) ? t(descriptionKey) : choice.description, {
        align: "center",
        color: "#cbd7e2",
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "16px",
        lineSpacing: 6,
        wordWrap: { width: 210 }
      }).setOrigin(0.5, 0.5);

      this.add.text(x, 468, t("reward.choose"), {
        align: "center",
        color: "#8be9fd",
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "15px"
      }).setOrigin(0.5, 0.5);
    });
  }

  private chooseReward(rewardId: string): void {
    playSfx("uiClick");
    applyReward(rewardId, this.context);
    completeNode(this.nodeId);
    this.scene.start("MapScene");
  }
}
