import Phaser from "phaser";
import { formatCorruptionCombatEffect, formatCorruptionState } from "../../core/meta/corruption";
import { getCurrentAvailableNodes, getRun, selectNode, startNewRun } from "../../core/run/run-manager";
import { getRuleSlotText } from "../../core/run/reward-catalog";
import type { NodeType, RunNode } from "../../core/run/run-state";

const NODE_COLORS: Record<NodeType, number> = {
  combat: 0x5a7288,
  elite: 0xf18f6f,
  event: 0x8fd694,
  shop: 0xd5b65f,
  rest: 0x6edbd6,
  boss: 0xb57be8
};

export class MapScene extends Phaser.Scene {
  constructor() {
    super("MapScene");
  }

  create(): void {
    const run = getRun();

    if (run.result !== "running") {
      this.scene.start("SummaryScene");
      return;
    }

    this.add.rectangle(640, 360, 1280, 720, 0x10151c);
    this.add.text(40, 28, "Time Tree", {
      color: "#f7f3e8",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "32px"
    });
    this.add.text(40, 72, `Health ${run.player.health}/${run.player.maxHealth}`, {
      color: "#cbd7e2",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "18px"
    });
    this.add.text(40, 102, `Rewards ${run.rewardsTaken.length}`, {
      color: "#cbd7e2",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "18px"
    });
    this.add.text(40, 132, `Rules ${getRuleSlotText(run)} ${this.formatRules()}`, {
      color: "#cbd7e2",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "15px",
      wordWrap: { width: 780 }
    });
    this.add.text(40, 158, `Skills ${this.formatSkillUpgrades()}`, {
      color: "#cbd7e2",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "15px",
      wordWrap: { width: 780 }
    });

    this.drawMap();
    this.drawTimelineReport();
    this.drawStartOverButton();
  }

  private drawMap(): void {
    const run = getRun();
    const availableIds = new Set(getCurrentAvailableNodes().map((node) => node.id));
    const completedIds = new Set(run.completedNodeIds);
    const selectedIds = new Set(run.selectedNodeIds);
    const startX = 120;
    const gapX = 135;

    run.map.forEach((layer, depth) => {
      const x = startX + depth * gapX;
      this.add.text(x, 194, `${depth + 1}`, {
        color: "#6f8497",
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "14px"
      }).setOrigin(0.5, 0.5);

      layer.forEach((node, index) => {
        const y = this.getNodeY(layer.length, index);
        this.drawNode(node, x, y, availableIds.has(node.id), completedIds.has(node.id), selectedIds.has(node.id));
      });
    });

    const bossX = startX + run.map.length * gapX;
    this.drawNode(
      run.bossNode,
      bossX,
      360,
      availableIds.has(run.bossNode.id),
      completedIds.has(run.bossNode.id),
      selectedIds.has(run.bossNode.id)
    );
  }

  private drawNode(node: RunNode, x: number, y: number, available: boolean, completed: boolean, selected: boolean): void {
    const color = NODE_COLORS[node.type];
    const alpha = available || completed ? 1 : 0.32;
    const radius = node.type === "boss" ? 39 : 31;
    const circle = this.add.circle(x, y, radius, color, alpha);
    circle.setStrokeStyle(selected ? 4 : 2, selected ? 0xf7f3e8 : 0x2f4053, 1);

    this.add.text(x, y - 4, this.shortLabel(node.type), {
      align: "center",
      color: "#10151c",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: node.type === "boss" ? "14px" : "13px"
    }).setOrigin(0.5, 0.5).setAlpha(alpha);

    this.add.text(x, y + radius + 18, node.label, {
      align: "center",
      color: available ? "#e7edf2" : "#6f8497",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "13px"
    }).setOrigin(0.5, 0.5);

    if (!available) {
      return;
    }

    circle.setInteractive({ useHandCursor: true });
    circle.on("pointerover", () => circle.setScale(1.08));
    circle.on("pointerout", () => circle.setScale(1));
    circle.on("pointerup", () => this.enterNode(node.id));
  }

  private enterNode(nodeId: string): void {
    const node = selectNode(nodeId);

    if (node.type === "combat" || node.type === "elite" || node.type === "boss") {
      this.scene.start("CombatScene", { nodeId: node.id });
      return;
    }

    this.scene.start("RewardScene", { nodeId: node.id, context: node.type });
  }

  private drawStartOverButton(): void {
    const button = this.add.rectangle(1148, 48, 156, 38, 0x263746, 1);
    button.setStrokeStyle(2, 0x5a7288, 1);
    button.setInteractive({ useHandCursor: true });
    button.on("pointerup", () => {
      startNewRun();
      this.scene.restart();
    });

    this.add.text(1148, 48, "New Run", {
      align: "center",
      color: "#e7edf2",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "16px"
    }).setOrigin(0.5, 0.5);
  }

  private drawTimelineReport(): void {
    const run = getRun();
    const title = this.add.text(820, 88, "Timeline Report", {
      color: "#f7f3e8",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "18px"
    });
    title.setOrigin(0, 0);

    const reportLines =
      run.appliedResidues.length === 0
        ? ["No active residue."]
        : run.appliedResidues.map((residue) => `${residue.title}: ${residue.description}`);
    const timelineLines = [
      `Corruption: ${formatCorruptionState(run.corruption)}`,
      formatCorruptionCombatEffect(run.corruption),
      ...reportLines
    ];

    this.add.text(820, 118, timelineLines.join("\n"), {
      color: "#cbd7e2",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "13px",
      lineSpacing: 5,
      wordWrap: { width: 390 }
    });
  }

  private getNodeY(count: number, index: number): number {
    if (count === 2) {
      return index === 0 ? 292 : 428;
    }

    return 250 + index * 110;
  }

  private shortLabel(type: NodeType): string {
    const labels: Record<NodeType, string> = {
      combat: "COM",
      elite: "ELT",
      event: "EVT",
      shop: "SHP",
      rest: "RST",
      boss: "BOSS"
    };

    return labels[type];
  }

  private formatRules(): string {
    const rules = getRun().activeRules;

    if (rules.length === 0) {
      return "None";
    }

    return rules
      .map((rule) => (rule.stacks > 1 ? `${rule.title} x${rule.stacks}` : rule.title))
      .join(" / ");
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

    return upgrades.length > 0 ? upgrades.join(" / ") : "Base";
  }
}
