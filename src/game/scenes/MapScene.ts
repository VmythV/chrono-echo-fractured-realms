import Phaser from "phaser";
import { t } from "../../core/i18n";
import { formatCorruptionCombatEffect, formatCorruptionState } from "../../core/meta/corruption";
import { loadSettings } from "../../core/meta/settings";
import { getResidueDescription, getResidueTitle } from "../../core/meta/time-residue";
import {
  getCurrentAvailableNodes,
  getNodeById,
  getRun,
  saveRunSnapshot,
  selectNode,
  startNewRun
} from "../../core/run/run-manager";
import { getRuleSlotText } from "../../core/run/reward-catalog";
import type { NodeType, RunNode } from "../../core/run/run-state";
import { playSfx } from "../audio/sfx";
import { DISPLAY_FONT } from "../display";
import { makePixelButton } from "../pixel-ui";
import { fadeInScene, transitionTo } from "../scene-transitions";

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

    saveRunSnapshot();
    fadeInScene(this);

    this.add.rectangle(640, 360, 1280, 720, 0x1a1c2c);
    this.add.text(40, 28, t("map.title"), {
      color: "#f7f3e8",
      fontFamily: DISPLAY_FONT,
      fontSize: "18px"
    });
    this.add.text(40, 72, t("common.health", { current: run.player.health, max: run.player.maxHealth }), {
      color: "#cbd7e2",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "18px"
    });
    this.add.text(40, 102, t("map.rewards", { count: run.rewardsTaken.length }), {
      color: "#cbd7e2",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "18px"
    });
    this.add.text(250, 72, t("shards.label", { count: run.shards }), {
      color: "#d5b65f",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "18px"
    });
    this.add.text(40, 132, t("map.rules", { slots: getRuleSlotText(run), list: this.formatRules() }), {
      color: "#cbd7e2",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "15px",
      wordWrap: { width: 780 }
    });
    this.add.text(40, 158, t("map.skills", { list: this.formatSkillUpgrades() }), {
      color: "#cbd7e2",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "15px",
      wordWrap: { width: 780 }
    });

    this.drawRouteTrace();
    this.drawMap();
    this.drawTimelineReport();
    this.drawStartOverButton();
  }

  private drawRouteTrace(): void {
    const run = getRun();
    this.data.set("routeSegments", 0);
    const points = run.selectedNodeIds
      .map((nodeId) => this.getNodePosition(nodeId))
      .filter((point): point is { x: number; y: number } => point !== null);

    if (points.length < 2) {
      return;
    }

    const trace = this.add.graphics();
    trace.lineStyle(3, 0x8be9fd, 0.4);
    trace.beginPath();
    points.forEach((point, index) => {
      if (index === 0) {
        trace.moveTo(point.x, point.y);
      } else {
        trace.lineTo(point.x, point.y);
      }
    });
    trace.strokePath();

    points.forEach((point) => {
      trace.fillStyle(0x8be9fd, 0.5);
      trace.fillCircle(point.x, point.y, 5);
    });

    this.data.set("routeSegments", points.length - 1);
  }

  private getNodePosition(nodeId: string): { x: number; y: number } | null {
    const run = getRun();
    const node = getNodeById(nodeId);

    if (!node) {
      return null;
    }

    const x = 120 + node.depth * 135;

    if (node.type === "boss") {
      return { x, y: 360 };
    }

    return { x, y: this.getNodeY(run.map[node.depth]?.length ?? 1, node.lane) };
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

    this.add.text(x, y - 4, t(`node.short.${node.type}`), {
      align: "center",
      color: "#10151c",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: node.type === "boss" ? "14px" : "13px"
    }).setOrigin(0.5, 0.5).setAlpha(alpha);

    this.add.text(x, y + radius + 18, this.getNodeLabel(node), {
      align: "center",
      color: available ? "#e7edf2" : "#6f8497",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "13px"
    }).setOrigin(0.5, 0.5);

    if (!available) {
      return;
    }

    circle.setInteractive({ useHandCursor: true });
    circle.on("pointerover", () => circle.setStrokeStyle(4, 0xf7f3e8, 1));
    circle.on("pointerout", () => circle.setStrokeStyle(selected ? 4 : 2, selected ? 0xf7f3e8 : 0x2f4053, 1));
    circle.on("pointerup", () => this.enterNode(node.id));
    this.tweens.add({
      targets: circle,
      scale: 1.07,
      yoyo: true,
      repeat: -1,
      duration: 820,
      ease: "sine.inOut"
    });
  }

  private enterNode(nodeId: string): void {
    playSfx("uiClick");
    const node = selectNode(nodeId);

    if (node.type === "combat" || node.type === "elite" || node.type === "boss") {
      transitionTo(this, "CombatScene", { nodeId: node.id });
      return;
    }

    if (node.type === "event") {
      transitionTo(this, "EventScene", { nodeId: node.id });
      return;
    }

    transitionTo(this, "RewardScene", { nodeId: node.id, context: node.type });
  }

  private getNodeLabel(node: RunNode): string {
    if (node.type === "boss") {
      return getRun().corruption >= 50 ? t("node.bossName2") : t("node.bossName");
    }

    return t(`node.${node.type}`);
  }

  private drawStartOverButton(): void {
    makePixelButton(this, 1148, 48, 156, 38, false, () => {
      playSfx("uiClick");
      startNewRun();
      this.scene.restart();
    });

    this.add.text(1148, 48, t("map.newRun"), {
      align: "center",
      color: "#e7edf2",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "16px"
    }).setOrigin(0.5, 0.5);
  }

  private drawTimelineReport(): void {
    const run = getRun();
    const settings = loadSettings();
    const title = this.add.text(820, 88, t("map.timelineReport"), {
      color: "#f7f3e8",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "18px"
    });
    title.setOrigin(0, 0);

    const reportLines =
      run.appliedResidues.length === 0
        ? [t("map.noResidue")]
        : run.appliedResidues.map((residue) => `${getResidueTitle(residue)}: ${getResidueDescription(residue)}`);
    const timelineLines = [
      t("map.difficulty", { value: t(`settings.difficulty.${settings.difficulty}`) }),
      t("map.corruption", { value: formatCorruptionState(run.corruption) }),
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
      .join(" / ");
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

    return upgrades.length > 0 ? upgrades.join(" / ") : t("common.base");
  }
}
