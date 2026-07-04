import Phaser from "phaser";
import { getRun, startNewRun } from "../../core/run/run-manager";
import { getRuleSlotText } from "../../core/run/reward-catalog";

export class SummaryScene extends Phaser.Scene {
  constructor() {
    super("SummaryScene");
  }

  create(): void {
    const run = getRun();
    const won = run.result === "won";

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
      `Rule slots: ${getRuleSlotText(run)}`,
      `Skills: ${this.formatSkillUpgrades()}`,
      `Rules: ${this.formatRules()}`
    ];

    this.add.text(640, 330, stats.join("\n"), {
      align: "center",
      color: "#e7edf2",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "20px",
      lineSpacing: 10,
      wordWrap: { width: 760 }
    }).setOrigin(0.5, 0.5);

    const button = this.add.rectangle(640, 500, 210, 46, 0x263746, 1);
    button.setStrokeStyle(2, 0x8be9fd, 0.9);
    button.setInteractive({ useHandCursor: true });
    button.on("pointerup", () => this.startNextRun());

    this.add.text(640, 500, "Start New Run", {
      align: "center",
      color: "#e7edf2",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "17px"
    }).setOrigin(0.5, 0.5);

    this.input.keyboard?.once("keydown-R", () => this.startNextRun());
  }

  private startNextRun(): void {
    startNewRun();
    this.scene.start("MapScene");
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
}
