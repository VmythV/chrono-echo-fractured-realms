import Phaser from "phaser";
import { isTranslationKey, t } from "../../core/i18n";
import { formatCorruptionState } from "../../core/meta/corruption";
import {
  finalizeRunResidues,
  formatResidues,
  getResidueDescription,
  getResidueTitle
} from "../../core/meta/time-residue";
import { getRun, startNewRun } from "../../core/run/run-manager";
import { getRuleSlotText } from "../../core/run/reward-catalog";
import { playSfx } from "../audio/sfx";
import { DISPLAY_FONT } from "../display";
import { fadeInScene, transitionTo } from "../scene-transitions";

export class SummaryScene extends Phaser.Scene {
  constructor() {
    super("SummaryScene");
  }

  create(): void {
    fadeInScene(this);
    const run = getRun();
    const won = run.result === "won";
    const generatedResidues = finalizeRunResidues(run);

    this.add.rectangle(640, 360, 1280, 720, 0x10151c);
    this.add.text(640, 160, won ? t("summary.wonTitle") : t("result.lostTitle"), {
      align: "center",
      color: "#f7f3e8",
      fontFamily: DISPLAY_FONT,
      fontSize: "42px"
    }).setOrigin(0.5, 0.5);

    const summaryReason = isTranslationKey(run.summaryReason) ? t(run.summaryReason) : run.summaryReason;
    this.add.text(640, 220, summaryReason || t("summary.runEnded"), {
      align: "center",
      color: "#cbd7e2",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "18px",
      wordWrap: { width: 560 }
    }).setOrigin(0.5, 0.5);

    const stats = [
      t("summary.nodesCleared", { value: run.completedNodeIds.length }),
      t("summary.rewardsTaken", { value: run.rewardsTaken.length }),
      t("summary.finalHealth", { current: run.player.health, max: run.player.maxHealth }),
      t("summary.attackBonus", { value: run.player.attackDamageBonus }),
      t("summary.shards", { value: run.shards }),
      t("summary.corruption", { value: formatCorruptionState(run.corruption) }),
      t("summary.ruleSlots", { value: getRuleSlotText(run) }),
      t("summary.skills", { value: this.formatSkillUpgrades() }),
      t("summary.rules", { value: this.formatRules() }),
      t("summary.generatedResidues", { value: formatResidues(generatedResidues) }),
      t("summary.memoriesEarned", { value: run.memoriesEarned })
    ];

    this.add.text(640, 342, stats.join("\n"), {
      align: "center",
      color: "#e7edf2",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "16px",
      lineSpacing: 6,
      wordWrap: { width: 840 }
    }).setOrigin(0.5, 0.5);

    this.add.text(640, 500, this.formatGeneratedResidueDetails(), {
      align: "center",
      color: "#cbd7e2",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "14px",
      lineSpacing: 5,
      wordWrap: { width: 760 }
    }).setOrigin(0.5, 0.5);

    this.createButton(522, 590, t("summary.startNewRun"), 0x263746, 0x8be9fd, () => this.startNextRun());
    this.createButton(758, 590, t("summary.mainMenu"), 0x18222c, 0x5a7288, () => transitionTo(this, "MainMenuScene"));

    this.input.keyboard?.once("keydown-R", () => this.startNextRun());
  }

  private startNextRun(): void {
    startNewRun();
    transitionTo(this, "MapScene");
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    fill: number,
    stroke: number,
    onClick: () => void
  ): void {
    const button = this.add.rectangle(x, y, 210, 46, fill, 1);
    button.setStrokeStyle(2, stroke, 0.9);
    button.setInteractive({ useHandCursor: true });
    button.on("pointerover", () => button.setStrokeStyle(3, 0x8be9fd, 1));
    button.on("pointerout", () => button.setStrokeStyle(2, stroke, 0.9));
    button.on("pointerup", () => {
      playSfx("uiClick");
      onClick();
    });

    this.add.text(x, y, label, {
      align: "center",
      color: "#e7edf2",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "17px"
    }).setOrigin(0.5, 0.5);
  }

  private formatRules(): string {
    const rules = getRun().activeRules;

    if (rules.length === 0) {
      return t("common.none");
    }

    return rules
      .map((rule) => {
        const title = t(`reward.${rule.id}.title`);
        return rule.stacks > 1 ? `${title} x${rule.stacks}` : title;
      })
      .join(", ");
  }

  private formatSkillUpgrades(): string {
    const player = getRun().player;
    const upgrades: string[] = [];

    if (player.freezeRadiusBonus > 0) {
      upgrades.push(t("skill.freezeRadius", { value: player.freezeRadiusBonus }));
    }

    if (player.freezeImpactDamage > 0) {
      upgrades.push(t("skill.freezeHit", { value: player.freezeImpactDamage }));
    }

    if (player.rewindShieldDurationMs > 0) {
      upgrades.push(t("skill.rewindShield", { value: Math.round(player.rewindShieldDurationMs / 100) / 10 }));
    }

    return upgrades.length > 0 ? upgrades.join(", ") : t("common.base");
  }

  private formatGeneratedResidueDetails(): string {
    const residues = getRun().generatedResidues;

    if (residues.length === 0) {
      return t("summary.noResidue");
    }

    return residues.map((residue) => `${getResidueTitle(residue)}: ${getResidueDescription(residue)}`).join("\n");
  }
}
