import Phaser from "phaser";
import { isTranslationKey, t } from "../../core/i18n";
import { formatCorruptionState } from "../../core/meta/corruption";
import { applyReward, completeNode, getNodeById, getRewards, getRun, spendShards } from "../../core/run/run-manager";
import { getRuleSlotText, SHOP_PRICES } from "../../core/run/reward-catalog";
import type { RewardContext, RewardKind } from "../../core/run/run-state";
import { playSfx } from "../audio/sfx";
import { DISPLAY_FONT } from "../display";
import { drawPixelPanel, makePixelButton, PIXEL_UI } from "../pixel-ui";
import { fadeInScene, transitionTo } from "../scene-transitions";

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
    fadeInScene(this);
    const run = getRun();
    const node = getNodeById(this.nodeId);
    const choices = getRewards(this.context);
    const title = node
      ? t("reward.title", { label: node.type === "boss" ? t("node.bossName") : t(`node.${node.type}`) })
      : t("reward.fallbackTitle");

    this.add.rectangle(640, 360, 1280, 720, 0x1a1c2c);
    this.add.text(64, 46, title, {
      color: "#f7f3e8",
      fontFamily: DISPLAY_FONT,
      fontSize: "18px"
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
    this.add.text(64, 172, t("shards.label", { count: run.shards }), {
      color: "#d5b65f",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "16px"
    });

    const isShop = this.context === "shop";

    choices.forEach((choice, index) => {
      const x = 300 + index * 320;
      const price = SHOP_PRICES[choice.kind];
      const affordable = !isShop || run.shards >= price;
      const card = drawPixelPanel(
        this,
        x,
        372,
        272,
        292,
        affordable ? PIXEL_UI.panelDark : 0x14151f,
        affordable ? PIXEL_UI.border : 0x333c57
      );

      if (affordable) {
        card.inner.setInteractive({ useHandCursor: true });
        card.inner.on("pointerover", () => card.frame.setFillStyle(PIXEL_UI.accentBright));
        card.inner.on("pointerout", () => card.frame.setFillStyle(PIXEL_UI.border));
        card.inner.on("pointerup", () => this.chooseReward(choice.id, isShop ? price : 0));
      }

      const titleKey = `reward.${choice.id}.title`;
      const descriptionKey = `reward.${choice.id}.desc`;
      const dimmedColor = affordable ? undefined : "#5a7288";

      this.add.text(x, 250, t(`kind.${choice.kind}`), {
        align: "center",
        color: dimmedColor ?? REWARD_KIND_COLORS[choice.kind],
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "14px"
      }).setOrigin(0.5, 0.5);

      this.add.text(x, 296, isTranslationKey(titleKey) ? t(titleKey) : choice.title, {
        align: "center",
        color: dimmedColor ?? "#f7f3e8",
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "21px",
        wordWrap: { width: 236 }
      }).setOrigin(0.5, 0.5);

      this.add.text(x, 392, isTranslationKey(descriptionKey) ? t(descriptionKey) : choice.description, {
        align: "center",
        color: dimmedColor ?? "#cbd7e2",
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "15px",
        lineSpacing: 5,
        wordWrap: { width: 232 }
      }).setOrigin(0.5, 0.5);

      const actionText = isShop
        ? affordable
          ? `${t("shop.buy")} (${t("shop.price", { value: price })})`
          : t("shop.notEnough")
        : t("reward.choose");
      this.add.text(x, 494, actionText, {
        align: "center",
        color: affordable ? "#8be9fd" : "#f18f6f",
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "14px"
      }).setOrigin(0.5, 0.5);
    });

    if (isShop) {
      this.drawLeaveButton();
    }
  }

  private drawLeaveButton(): void {
    makePixelButton(this, 640, 590, 190, 44, false, () => {
      playSfx("uiClick");
      completeNode(this.nodeId);
      transitionTo(this, "MapScene");
    });

    this.add.text(640, 590, t("shop.leave"), {
      align: "center",
      color: "#cbd7e2",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "16px"
    }).setOrigin(0.5, 0.5);
  }

  private chooseReward(rewardId: string, price: number): void {
    playSfx("uiClick");

    if (price > 0 && !spendShards(price)) {
      return;
    }

    applyReward(rewardId, this.context);
    completeNode(this.nodeId);
    transitionTo(this, "MapScene");
  }
}
