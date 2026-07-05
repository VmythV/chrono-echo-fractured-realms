import Phaser from "phaser";
import { formatCorruptionState } from "../../core/meta/corruption";
import { finalizeRunResidues, formatResidues } from "../../core/meta/time-residue";
import { getRun, startNewRun } from "../../core/run/run-manager";
import { getRuleSlotText } from "../../core/run/reward-catalog";
import { playSfx } from "../audio/sfx";

export class SummaryScene extends Phaser.Scene {
  constructor() {
    super("SummaryScene");
  }

  create(): void {
    const run = getRun();
    const won = run.result === "won";
    const generatedResidues = finalizeRunResidues(run);

    this.add.rectangle(640, 360, 1280, 720, 0x10151c);
    this.add.text(640, 160, won ? "Run Complete" : "Timeline Collapsed", {
      align: "center",
      color: "#f7f3e8",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "42px"
    }).setOrigin(0.5, 0.5);

    this.add.text(640, 220, run.summaryReason || "The run has ended.", {
      align: "center",
      color: "#cbd7e2",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "18px",
      wordWrap: { width: 560 }
    }).setOrigin(0.5, 0.5);

    const stats = [
      `Nodes cleared: ${run.completedNodeIds.length}`,
      `Rewards taken: ${run.rewardsTaken.length}`,
      `Final health: ${run.player.health}/${run.player.maxHealth}`,
      `Attack bonus: +${run.player.attackDamageBonus}`,
      `Corruption: ${formatCorruptionState(run.corruption)}`,
      `Rule slots: ${getRuleSlotText(run)}`,
      `Skills: ${this.formatSkillUpgrades()}`,
      `Rules: ${this.formatRules()}`,
      `Generated residues: ${formatResidues(generatedResidues)}`
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

    this.createButton(522, 590, "Start New Run", 0x263746, 0x8be9fd, () => this.startNextRun());
    this.createButton(758, 590, "Main Menu", 0x18222c, 0x5a7288, () => this.scene.start("MainMenuScene"));

    this.input.keyboard?.once("keydown-R", () => this.startNextRun());
  }

  private startNextRun(): void {
    startNewRun();
    this.scene.start("MapScene");
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
      return "None";
    }

    return rules
      .map((rule) => (rule.stacks > 1 ? `${rule.title} x${rule.stacks}` : rule.title))
      .join(", ");
  }

  private formatSkillUpgrades(): string {
    const player = getRun().player;
    const upgrades: string[] = [];

    if (player.freezeRadiusBonus > 0) {
      upgrades.push(`Freeze radius +${player.freezeRadiusBonus}`);
    }

    if (player.freezeImpactDamage > 0) {
      upgrades.push(`Freeze hit ${player.freezeImpactDamage}`);
    }

    if (player.rewindShieldDurationMs > 0) {
      upgrades.push(`Rewind shield ${Math.round(player.rewindShieldDurationMs / 100) / 10}s`);
    }

    return upgrades.length > 0 ? upgrades.join(", ") : "Base";
  }

  private formatGeneratedResidueDetails(): string {
    const residues = getRun().generatedResidues;

    if (residues.length === 0) {
      return "No residue was generated.";
    }

    return residues.map((residue) => `${residue.title}: ${residue.description}`).join("\n");
  }
}
