import Phaser from "phaser";
import { t } from "../../core/i18n";
import {
  formatCorruptionState,
  getCorruptionTier,
  getCorruptionTierTitle,
  type CorruptionTier
} from "../../core/meta/corruption";
import { getDifficultyModifiers, type DifficultyModifiers } from "../../core/meta/difficulty";
import { loadSettings } from "../../core/meta/settings";
import {
  awardCombatShards,
  completeNode,
  failRun,
  getNodeById,
  getRun,
  recordTimeSkillCast,
  setPlayerHealth
} from "../../core/run/run-manager";
import { MAX_TEMPORAL_RULES } from "../../core/run/reward-catalog";
import type { NodeType, TemporalRuleId } from "../../core/run/run-state";
import { playSfx } from "../audio/sfx";

type ArcadeImage = Phaser.Physics.Arcade.Image;

type EnemyKind = "chaser" | "shooter" | "anomaly" | "boss";
type ResultMode = "reward" | "summary";
type BossVariant = "warden" | "glitch";

type EnemyState = {
  sprite: ArcadeImage;
  kind: EnemyKind;
  health: number;
  maxHealth: number;
  speed: number;
  fireCooldownMs: number;
  fireElapsedMs: number;
  frozenMs: number;
  windupMs: number;
  attackCycle: number;
};

type ProjectileState = {
  sprite: ArcadeImage;
  owner: "player" | "enemy";
  damage: number;
  frozenMs: number;
  storedVelocity?: Phaser.Math.Vector2;
  lifespanMs: number;
};

type RewindSnapshot = {
  x: number;
  y: number;
  health: number;
  time: number;
};

const ARENA = {
  x: 360,
  y: 80,
  width: 780,
  height: 560
};

const PLAYER = {
  speed: 260,
  dashSpeed: 760,
  dashDurationMs: 130,
  dashCooldownMs: 900,
  attackCooldownMs: 220,
  attackSpeed: 680,
  attackDamage: 22,
  maxHealth: 100,
  invulnerableAfterHitMs: 520
};

const TIME_SKILLS = {
  freezeCooldownMs: 10000,
  freezeDurationMs: 2000,
  freezeRadius: 210,
  rewindCooldownMs: 14000,
  rewindWindowMs: 3000,
  snapshotIntervalMs: 100,
  rewindRestoreRatio: 0.6
};

const MEMORY_SKILLS = {
  echoCooldownMs: 7000,
  echoSpreadRad: 0.22,
  echoDamageRatio: 0.6,
  anchorWindowMs: 5000,
  anchorCooldownMs: 9000,
  anchorExpiredCooldownMs: 4000,
  anchorInvulnerableMs: 600
};

export class CombatScene extends Phaser.Scene {
  private nodeId = "";
  private nodeType: NodeType = "combat";
  private nodeDepth = 0;
  private bossVariant: BossVariant = "warden";
  private freezeDurationLimitMs = TIME_SKILLS.freezeDurationMs;
  private player!: ArcadeImage;
  private aimLine!: Phaser.GameObjects.Line;
  private freezePreview!: Phaser.GameObjects.Arc;
  private rewindTrail!: Phaser.GameObjects.Graphics;
  private combatHud!: Phaser.GameObjects.Graphics;
  private enemyHud!: Phaser.GameObjects.Graphics;
  private hudText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private resultPanelElements: Array<Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text> = [];
  private keys!: Record<"W" | "A" | "S" | "D" | "Q" | "E" | "R" | "F" | "SPACE", Phaser.Input.Keyboard.Key>;
  private enemies: EnemyState[] = [];
  private projectiles: ProjectileState[] = [];
  private snapshots: RewindSnapshot[] = [];
  private playerHealth = PLAYER.maxHealth;
  private playerInvulnerableMs = 0;
  private attackElapsedMs = PLAYER.attackCooldownMs;
  private dashCooldownMs = 0;
  private dashRemainingMs = 0;
  private dashVector = new Phaser.Math.Vector2();
  private freezeCooldownMs = 0;
  private rewindCooldownMs = 0;
  private playerMaxHealth = PLAYER.maxHealth;
  private attackDamage = PLAYER.attackDamage;
  private freezeRadius = TIME_SKILLS.freezeRadius;
  private freezeImpactDamage = 0;
  private freezeCooldownLimitMs = TIME_SKILLS.freezeCooldownMs;
  private rewindCooldownLimitMs = TIME_SKILLS.rewindCooldownMs;
  private rewindShieldLimitMs = 0;
  private rewindShieldMs = 0;
  private hasEchoAttack = false;
  private hasTimeAnchor = false;
  private echoCooldownMs = 0;
  private anchorCooldownMs = 0;
  private anchorRemainingMs = 0;
  private anchorPosition: Phaser.Math.Vector2 | null = null;
  private anchorMarker: Phaser.GameObjects.Arc | null = null;
  private corruption = 0;
  private corruptionTier: CorruptionTier = getCorruptionTier(0);
  private difficultyModifiers: DifficultyModifiers = getDifficultyModifiers("normal");
  private activeRules = new Map<TemporalRuleId, number>();
  private splitSecondReady = false;
  private snapshotElapsedMs = 0;
  private roomState: "playing" | "won" | "lost" = "playing";
  private resultMode: ResultMode = "reward";
  private paused = false;
  private pausePanelElements: Array<Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text> = [];

  constructor() {
    super("CombatScene");
  }

  init(data: { nodeId?: string } = {}): void {
    const run = getRun();
    const node = data.nodeId ? getNodeById(data.nodeId) : undefined;
    this.nodeId = node?.id ?? "prototype-combat";
    this.nodeType = node?.type ?? "combat";
    this.nodeDepth = node?.depth ?? 0;
    this.bossVariant = run.corruption >= 50 ? "glitch" : "warden";
    this.freezeDurationLimitMs = Math.max(800, TIME_SKILLS.freezeDurationMs + run.player.freezeDurationBonusMs);
    this.enemies = [];
    this.projectiles = [];
    this.snapshots = [];
    this.resultPanelElements = [];
    this.playerMaxHealth = run.player.maxHealth;
    this.playerHealth = Math.max(1, Math.min(run.player.health, this.playerMaxHealth));
    this.attackDamage = PLAYER.attackDamage + run.player.attackDamageBonus;
    this.freezeRadius = TIME_SKILLS.freezeRadius + run.player.freezeRadiusBonus;
    this.freezeImpactDamage = run.player.freezeImpactDamage;
    this.freezeCooldownLimitMs = Math.max(4500, TIME_SKILLS.freezeCooldownMs - run.player.freezeCooldownReductionMs);
    this.rewindCooldownLimitMs = Math.max(6000, TIME_SKILLS.rewindCooldownMs - run.player.rewindCooldownReductionMs);
    this.rewindShieldLimitMs = run.player.rewindShieldDurationMs;
    this.rewindShieldMs = 0;
    this.hasEchoAttack = run.player.hasEchoAttack;
    this.hasTimeAnchor = run.player.hasTimeAnchor;
    this.echoCooldownMs = 0;
    this.anchorCooldownMs = 0;
    this.anchorRemainingMs = 0;
    this.anchorPosition = null;
    this.anchorMarker = null;
    this.corruption = run.corruption;
    this.corruptionTier = getCorruptionTier(run.corruption);
    this.difficultyModifiers = getDifficultyModifiers(loadSettings().difficulty);
    this.activeRules = new Map(run.activeRules.map((rule) => [rule.id, Math.max(1, rule.stacks)] as const));
    this.splitSecondReady = false;
    this.playerInvulnerableMs = 0;
    this.attackElapsedMs = PLAYER.attackCooldownMs;
    this.dashCooldownMs = 0;
    this.dashRemainingMs = 0;
    this.dashVector.set(0, 0);
    this.freezeCooldownMs = 0;
    this.rewindCooldownMs = 0;
    this.snapshotElapsedMs = 0;
    this.roomState = "playing";
    this.resultMode = "reward";
    this.paused = false;
    this.pausePanelElements = [];
  }

  create(): void {
    this.createGeneratedTextures();
    this.createArena();
    this.createPlayer();
    this.createEnemies();
    this.createHud();
    this.createInput();
    this.physics.world.setBounds(ARENA.x, ARENA.y, ARENA.width, ARENA.height);
    this.showCorruptionStatus();
  }

  update(time: number, delta: number): void {
    if (this.paused) {
      return;
    }

    if (this.roomState !== "playing") {
      this.updateHud();
      return;
    }

    this.updateTimers(delta);
    this.recordRewindSnapshot(time, delta);
    this.updatePlayer(delta);
    this.updateAimLine();
    this.updateEnemies(delta);
    this.updateProjectiles(delta);
    this.checkProjectileHits();
    this.checkPlayerEnemyContact();
    this.cleanupDestroyedObjects();
    this.checkRoomState();
    this.updateHud();
  }

  private createGeneratedTextures(): void {
    this.makeCircleTexture("player-core", 18, 0x6edbd6, 0x122a33);
    this.makeCircleTexture("chaser-core", 18, 0xe06f5d, 0x341815);
    this.makeCircleTexture("shooter-core", 18, 0xd5b65f, 0x352b13);
    this.makeCircleTexture("anomaly-core", 18, 0x9a8cf0, 0x241a45);
    this.makeCircleTexture("boss-core", 30, 0xb57be8, 0x2d1838);
    this.makeCircleTexture("player-shot", 6, 0x8be9fd, 0x0f3c45);
    this.makeCircleTexture("enemy-shot", 7, 0xf18f6f, 0x4a1f17);
  }

  private makeCircleTexture(key: string, radius: number, fill: number, stroke: number): void {
    if (this.textures.exists(key)) {
      return;
    }

    const size = radius * 2 + 6;
    const graphics = this.add.graphics();
    graphics.fillStyle(fill, 1);
    graphics.fillCircle(size / 2, size / 2, radius);
    graphics.lineStyle(3, stroke, 1);
    graphics.strokeCircle(size / 2, size / 2, radius);
    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  private createArena(): void {
    this.add.rectangle(640, 360, 1280, 720, 0x10151c);
    this.add.rectangle(
      ARENA.x + ARENA.width / 2,
      ARENA.y + ARENA.height / 2,
      ARENA.width,
      ARENA.height,
      0x18222c
    );
    this.add
      .rectangle(
        ARENA.x + ARENA.width / 2,
        ARENA.y + ARENA.height / 2,
        ARENA.width,
        ARENA.height
      )
      .setStrokeStyle(2, 0x5a7288, 1);

    const grid = this.add.grid(
      ARENA.x + ARENA.width / 2,
      ARENA.y + ARENA.height / 2,
      ARENA.width,
      ARENA.height,
      64,
      64,
      0x1d2a35,
      0.36,
      0x263746,
      0.4
    );
    grid.setAltFillStyle(0x1a2630, 0.36);
    grid.setDepth(0);
  }

  private createPlayer(): void {
    this.player = this.physics.add.image(ARENA.x + ARENA.width / 2, ARENA.y + ARENA.height - 120, "player-core");
    this.player.setCircle(18, 3, 3);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);
  }

  private createEnemies(): void {
    if (this.nodeType === "boss") {
      this.spawnEnemy("boss", ARENA.x + ARENA.width / 2, ARENA.y + 130);
      return;
    }

    this.spawnEnemy("chaser", ARENA.x + 210, ARENA.y + 250);
    this.spawnEnemy(this.nodeDepth >= 3 ? "anomaly" : "chaser", ARENA.x + ARENA.width - 210, ARENA.y + 265);
    this.spawnEnemy("shooter", ARENA.x + ARENA.width / 2, ARENA.y + 100);

    if (this.nodeType === "elite") {
      this.spawnEnemy("anomaly", ARENA.x + ARENA.width / 2, ARENA.y + 330);
    }
  }

  private spawnEnemy(kind: EnemyKind, x: number, y: number): void {
    const textures: Record<EnemyKind, string> = {
      chaser: "chaser-core",
      shooter: "shooter-core",
      anomaly: "anomaly-core",
      boss: "boss-core"
    };
    const sprite = this.physics.add.image(x, y, textures[kind]);
    sprite.setCircle(kind === "boss" ? 30 : 18, 3, 3);
    sprite.setCollideWorldBounds(true);
    sprite.setDepth(8);

    const speeds: Record<EnemyKind, number> = {
      chaser: 145,
      shooter: 95,
      anomaly: 40,
      boss: this.bossVariant === "glitch" ? 84 : 68
    };
    const fireCooldowns: Record<EnemyKind, number> = {
      chaser: 0,
      shooter: 1300,
      anomaly: 2400,
      boss: this.bossVariant === "glitch" ? 1500 : 1150
    };
    const initialElapsed: Record<EnemyKind, number> = {
      chaser: 0,
      shooter: 500,
      anomaly: 1400,
      boss: 500
    };

    this.enemies.push({
      sprite,
      kind,
      health: this.getEnemyHealth(kind),
      maxHealth: this.getEnemyHealth(kind),
      speed: speeds[kind],
      fireCooldownMs: fireCooldowns[kind],
      fireElapsedMs: initialElapsed[kind],
      frozenMs: 0,
      windupMs: 0,
      attackCycle: 0
    });
  }

  private getEnemyHealth(kind: EnemyKind): number {
    const baseHealth: Record<EnemyKind, number> = {
      chaser: 48,
      shooter: 62,
      anomaly: 54,
      boss: this.bossVariant === "glitch" ? 260 : 220
    };
    const eliteMultiplier = this.nodeType === "elite" && kind !== "boss" ? 1.25 : 1;

    return Math.round(
      baseHealth[kind] *
        eliteMultiplier *
        this.corruptionTier.enemyHealthMultiplier *
        this.difficultyModifiers.enemyHealthMultiplier
    );
  }

  private createHud(): void {
    const extraSkillLines = Number(this.hasEchoAttack) + Number(this.hasTimeAnchor);
    this.add.rectangle(16, 14, 292, 250 + extraSkillLines * 24, 0x10151c, 0.9).setOrigin(0, 0).setDepth(19);
    this.combatHud = this.add.graphics();
    this.combatHud.setDepth(20);
    this.enemyHud = this.add.graphics();
    this.enemyHud.setDepth(18);

    this.aimLine = this.add.line(0, 0, 0, 0, 0, 0, 0x8be9fd, 0.55);
    this.aimLine.setOrigin(0, 0);
    this.aimLine.setDepth(12);

    this.freezePreview = this.add.circle(0, 0, this.freezeRadius);
    this.freezePreview.setStrokeStyle(2, 0x8be9fd, 0.24);
    this.freezePreview.setFillStyle(0x8be9fd, 0.05);
    this.freezePreview.setDepth(3);
    this.freezePreview.setVisible(false);

    this.rewindTrail = this.add.graphics();
    this.rewindTrail.setDepth(4);

    this.hudText = this.add.text(24, 20, "", {
      color: "#e7edf2",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "17px",
      lineSpacing: 6
    });
    this.hudText.setDepth(20);

    this.statusText = this.add.text(640, 676, "", {
      align: "center",
      color: "#f7f3e8",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "18px"
    });
    this.statusText.setOrigin(0.5, 0.5);
    this.statusText.setDepth(20);

    this.createResultPanel();
    this.createPausePanel();
  }

  private createInput(): void {
    if (!this.input.keyboard) {
      throw new Error("Keyboard input is required for the combat prototype.");
    }

    this.keys = this.input.keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      Q: Phaser.Input.Keyboard.KeyCodes.Q,
      E: Phaser.Input.Keyboard.KeyCodes.E,
      R: Phaser.Input.Keyboard.KeyCodes.R,
      F: Phaser.Input.Keyboard.KeyCodes.F,
      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE
    }) as typeof this.keys;

    this.input.keyboard.addCapture("W,A,S,D,Q,E,R,F,SPACE");
    this.input.keyboard.on("keydown-ESC", () => this.togglePause());
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown() && !this.paused) {
        this.tryFirePlayerShot();
      }
    });
  }

  private togglePause(): void {
    if (this.roomState !== "playing") {
      return;
    }

    this.paused = !this.paused;

    if (this.paused) {
      this.physics.world.pause();
    } else {
      this.physics.world.resume();
    }

    this.setPausePanelVisible(this.paused);
  }

  private createPausePanel(): void {
    const panel = this.add.rectangle(640, 360, 400, 240, 0x10151c, 0.95);
    panel.setStrokeStyle(2, 0x5a7288, 1);
    panel.setDepth(40);

    const title = this.add.text(640, 296, t("pause.title"), {
      align: "center",
      color: "#f7f3e8",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "28px"
    }).setOrigin(0.5, 0.5).setDepth(41);

    const hint = this.add.text(640, 338, t("pause.hint"), {
      align: "center",
      color: "#8fa3b5",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "14px",
      wordWrap: { width: 340 }
    }).setOrigin(0.5, 0.5).setDepth(41);

    const resumeButton = this.add.rectangle(640, 392, 200, 42, 0x263746, 1);
    resumeButton.setStrokeStyle(2, 0x8be9fd, 0.9);
    resumeButton.setDepth(41);
    resumeButton.setInteractive({ useHandCursor: true });
    resumeButton.on("pointerup", () => {
      playSfx("uiClick");
      this.togglePause();
    });

    const resumeText = this.add.text(640, 392, t("pause.resume"), {
      align: "center",
      color: "#e7edf2",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "16px"
    }).setOrigin(0.5, 0.5).setDepth(42);

    const menuButton = this.add.rectangle(640, 446, 200, 42, 0x18222c, 1);
    menuButton.setStrokeStyle(2, 0x5a7288, 1);
    menuButton.setDepth(41);
    menuButton.setInteractive({ useHandCursor: true });
    menuButton.on("pointerup", () => {
      playSfx("uiClick");
      this.physics.world.resume();
      this.scene.start("MainMenuScene");
    });

    const menuText = this.add.text(640, 446, t("summary.mainMenu"), {
      align: "center",
      color: "#cbd7e2",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "16px"
    }).setOrigin(0.5, 0.5).setDepth(42);

    this.pausePanelElements = [panel, title, hint, resumeButton, resumeText, menuButton, menuText];
    this.setPausePanelVisible(false);
  }

  private setPausePanelVisible(visible: boolean): void {
    this.pausePanelElements.forEach((element) => {
      element.setVisible(visible);
    });
  }

  private updateTimers(delta: number): void {
    this.attackElapsedMs += delta;
    this.dashCooldownMs = Math.max(0, this.dashCooldownMs - delta);
    this.freezeCooldownMs = Math.max(0, this.freezeCooldownMs - delta);
    this.rewindCooldownMs = Math.max(0, this.rewindCooldownMs - delta);
    this.rewindShieldMs = Math.max(0, this.rewindShieldMs - delta);
    this.echoCooldownMs = Math.max(0, this.echoCooldownMs - delta);
    this.anchorCooldownMs = Math.max(0, this.anchorCooldownMs - delta);

    if (this.anchorPosition) {
      this.anchorRemainingMs -= delta;

      if (this.anchorRemainingMs <= 0) {
        this.clearAnchor();
        this.anchorCooldownMs = MEMORY_SKILLS.anchorExpiredCooldownMs;
      }
    }
    if (this.getRuleStacks("emergencyLoop") > 0 && this.playerHealth <= this.playerMaxHealth * 0.35) {
      this.rewindCooldownMs = Math.max(0, this.rewindCooldownMs - delta * this.getRuleStacks("emergencyLoop"));
    }
    this.playerInvulnerableMs = Math.max(0, this.playerInvulnerableMs - delta);
    this.enemies.forEach((enemy) => {
      enemy.frozenMs = Math.max(0, enemy.frozenMs - delta);
    });
  }

  private recordRewindSnapshot(time: number, delta: number): void {
    this.snapshotElapsedMs += delta;

    if (this.snapshotElapsedMs < TIME_SKILLS.snapshotIntervalMs) {
      return;
    }

    this.snapshotElapsedMs = 0;
    this.snapshots.push({
      x: this.player.x,
      y: this.player.y,
      health: this.playerHealth,
      time
    });

    const cutoff = time - TIME_SKILLS.rewindWindowMs - 200;
    this.snapshots = this.snapshots.filter((snapshot) => snapshot.time >= cutoff);
  }

  private updatePlayer(delta: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.keys.Q)) {
      this.tryTimeFreeze();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.E)) {
      this.tryTimeRewind();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.R)) {
      this.tryEchoAttack();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.F)) {
      this.tryTimeAnchor();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
      this.tryDash();
    }

    if (this.input.activePointer.leftButtonDown()) {
      this.tryFirePlayerShot();
    }

    if (this.dashRemainingMs > 0) {
      this.dashRemainingMs = Math.max(0, this.dashRemainingMs - delta);
      this.player.setVelocity(this.dashVector.x * PLAYER.dashSpeed, this.dashVector.y * PLAYER.dashSpeed);
      return;
    }

    const movement = this.getMovementVector();
    this.player.setVelocity(movement.x * PLAYER.speed, movement.y * PLAYER.speed);
  }

  private getMovementVector(): Phaser.Math.Vector2 {
    const x = Number(this.keys.D.isDown) - Number(this.keys.A.isDown);
    const y = Number(this.keys.S.isDown) - Number(this.keys.W.isDown);
    const movement = new Phaser.Math.Vector2(x, y);

    if (movement.lengthSq() > 0) {
      movement.normalize();
    }

    return movement;
  }

  private updateAimLine(): void {
    const pointer = this.input.activePointer;
    pointer.updateWorldPoint(this.cameras.main);
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY);
    const endX = this.player.x + Math.cos(angle) * 58;
    const endY = this.player.y + Math.sin(angle) * 58;
    this.aimLine.setTo(this.player.x, this.player.y, endX, endY);
    this.freezePreview.setPosition(pointer.worldX, pointer.worldY);
    this.freezePreview.setVisible(
      this.keys.Q.isDown && this.freezeCooldownMs <= 0 && this.isInsideArena(pointer.worldX, pointer.worldY)
    );

    this.rewindTrail.clear();
    this.rewindTrail.lineStyle(2, 0x6edbd6, 0.2);
    this.snapshots.forEach((snapshot, index) => {
      if (index % 4 === 0) {
        this.rewindTrail.strokeCircle(snapshot.x, snapshot.y, 10);
      }
    });
  }

  private tryDash(): void {
    if (this.dashCooldownMs > 0 || this.dashRemainingMs > 0) {
      return;
    }

    const movement = this.getMovementVector();
    const direction = movement.lengthSq() > 0 ? movement : this.getAimVector();
    this.dashVector.copy(direction).normalize();
    this.dashRemainingMs = PLAYER.dashDurationMs;
    this.dashCooldownMs = PLAYER.dashCooldownMs;
    this.playerInvulnerableMs = Math.max(this.playerInvulnerableMs, PLAYER.dashDurationMs);
    playSfx("dash");

    if (this.getRuleStacks("fastTimeline") > 0) {
      this.attackElapsedMs = PLAYER.attackCooldownMs;
      this.showStatus(t("reward.fastTimeline.title"));
    }
  }

  private tryFirePlayerShot(): void {
    if (this.attackElapsedMs < PLAYER.attackCooldownMs) {
      return;
    }

    this.attackElapsedMs = 0;
    playSfx("playerShot");
    let damage = this.attackDamage;
    if (this.splitSecondReady) {
      const bonusDamage = 12 * this.getRuleStacks("splitSecond");
      damage += bonusDamage;
      this.splitSecondReady = false;
      this.showFloatingText(t("status.splitBonus", { value: bonusDamage }), this.player.x, this.player.y - 42, "#8be9fd");
    }

    const direction = this.getAimVector();
    const projectile = this.physics.add.image(this.player.x, this.player.y, "player-shot");
    projectile.setCircle(6, 3, 3);
    projectile.setVelocity(direction.x * PLAYER.attackSpeed, direction.y * PLAYER.attackSpeed);
    projectile.setDepth(9);
    this.projectiles.push({
      sprite: projectile,
      owner: "player",
      damage,
      frozenMs: 0,
      lifespanMs: 900
    });
  }

  private getAimVector(): Phaser.Math.Vector2 {
    const pointer = this.input.activePointer;
    pointer.updateWorldPoint(this.cameras.main);
    const vector = new Phaser.Math.Vector2(pointer.worldX - this.player.x, pointer.worldY - this.player.y);

    if (vector.lengthSq() === 0) {
      vector.set(1, 0);
    }

    return vector.normalize();
  }

  private tryEchoAttack(): void {
    if (!this.hasEchoAttack || this.echoCooldownMs > 0) {
      return;
    }

    this.echoCooldownMs = MEMORY_SKILLS.echoCooldownMs;
    const baseAngle = Math.atan2(this.getAimVector().y, this.getAimVector().x);
    const echoDamage = Math.max(1, Math.round(this.attackDamage * MEMORY_SKILLS.echoDamageRatio));

    [-MEMORY_SKILLS.echoSpreadRad, 0, MEMORY_SKILLS.echoSpreadRad].forEach((offset) => {
      const direction = new Phaser.Math.Vector2(Math.cos(baseAngle + offset), Math.sin(baseAngle + offset));
      const projectile = this.physics.add.image(this.player.x, this.player.y, "player-shot");
      projectile.setCircle(6, 3, 3);
      projectile.setVelocity(direction.x * PLAYER.attackSpeed, direction.y * PLAYER.attackSpeed);
      projectile.setDepth(9);
      projectile.setTint(0x9a8cf0);
      this.projectiles.push({
        sprite: projectile,
        owner: "player",
        damage: echoDamage,
        frozenMs: 0,
        lifespanMs: 900
      });
    });

    playSfx("echo");
    this.showStatus(t("status.echoAttack"));
  }

  private tryTimeAnchor(): void {
    if (!this.hasTimeAnchor) {
      return;
    }

    if (!this.anchorPosition) {
      if (this.anchorCooldownMs > 0) {
        return;
      }

      this.anchorPosition = new Phaser.Math.Vector2(this.player.x, this.player.y);
      this.anchorRemainingMs = MEMORY_SKILLS.anchorWindowMs;
      this.anchorMarker = this.add.circle(this.player.x, this.player.y, 22);
      this.anchorMarker.setStrokeStyle(2, 0x8fd694, 0.8);
      this.anchorMarker.setFillStyle(0x8fd694, 0.08);
      this.anchorMarker.setDepth(5);
      playSfx("anchorPlace");
      this.showStatus(t("status.anchorSet"));
      return;
    }

    this.player.setPosition(this.anchorPosition.x, this.anchorPosition.y);
    this.player.setVelocity(0, 0);
    this.playerInvulnerableMs = Math.max(this.playerInvulnerableMs, MEMORY_SKILLS.anchorInvulnerableMs);
    this.playRewindPulse(this.anchorPosition.x, this.anchorPosition.y);
    this.clearAnchor();
    this.anchorCooldownMs = MEMORY_SKILLS.anchorCooldownMs;
    playSfx("rewind");
    this.showStatus(t("status.anchorReturn"));
  }

  private clearAnchor(): void {
    this.anchorPosition = null;
    this.anchorRemainingMs = 0;
    this.anchorMarker?.destroy();
    this.anchorMarker = null;
  }

  private tryTimeFreeze(): void {
    if (this.freezeCooldownMs > 0) {
      return;
    }

    this.freezeCooldownMs = this.freezeCooldownLimitMs;
    recordTimeSkillCast("freeze");
    playSfx("freeze");
    const pointer = this.input.activePointer;
    pointer.updateWorldPoint(this.cameras.main);
    const center = new Phaser.Math.Vector2(pointer.worldX, pointer.worldY);
    this.playFreezePulse(center.x, center.y, this.freezeRadius);

    this.enemies.forEach((enemy) => {
      if (!enemy.sprite.active) {
        return;
      }

      const distance = Phaser.Math.Distance.Between(center.x, center.y, enemy.sprite.x, enemy.sprite.y);
      if (distance <= this.freezeRadius) {
        enemy.frozenMs = this.freezeDurationLimitMs;
        enemy.sprite.setTint(0x8be9fd);
        enemy.sprite.setVelocity(0, 0);

        if (this.freezeImpactDamage > 0) {
          enemy.health -= this.freezeImpactDamage;
          this.showFloatingText(`${this.freezeImpactDamage}`, enemy.sprite.x, enemy.sprite.y - 52, "#8be9fd");

          if (enemy.health <= 0) {
            this.showFloatingText(t("status.break"), enemy.sprite.x, enemy.sprite.y, "#8be9fd");
            enemy.sprite.destroy();
          }
        }
      }
    });

    this.projectiles.forEach((projectile) => {
      if (projectile.owner === "enemy") {
        const distance = Phaser.Math.Distance.Between(center.x, center.y, projectile.sprite.x, projectile.sprite.y);
        if (distance <= this.freezeRadius) {
          projectile.frozenMs = this.freezeDurationLimitMs;
          projectile.storedVelocity = new Phaser.Math.Vector2(
            projectile.sprite.body?.velocity.x ?? 0,
            projectile.sprite.body?.velocity.y ?? 0
          );
          projectile.sprite.setTint(0x8be9fd);
          projectile.sprite.setVelocity(0, 0);
        }
      }
    });

    this.showStatus(this.armSplitSecond() ? t("status.splitSecondReady") : t("status.timeFreeze"));
  }

  private tryTimeRewind(): void {
    if (this.rewindCooldownMs > 0 || this.snapshots.length === 0) {
      return;
    }

    const targetTime = this.time.now - TIME_SKILLS.rewindWindowMs;
    const snapshot =
      this.snapshots.find((candidate) => candidate.time >= targetTime) ?? this.snapshots[0];
    const restoredHealth = Math.round(
      this.playerHealth + Math.max(0, snapshot.health - this.playerHealth) * TIME_SKILLS.rewindRestoreRatio
    );

    this.player.setPosition(snapshot.x, snapshot.y);
    this.player.setVelocity(0, 0);
    this.playerHealth = Math.min(this.playerMaxHealth, restoredHealth);
    this.playerInvulnerableMs = 800;
    this.rewindCooldownMs = this.rewindCooldownLimitMs;
    recordTimeSkillCast("rewind");
    playSfx("rewind");
    if (this.rewindShieldLimitMs > 0) {
      this.rewindShieldMs = this.rewindShieldLimitMs;
      this.showFloatingText(t("status.shield"), this.player.x, this.player.y - 46, "#8fd694");
    }
    this.playRewindPulse(snapshot.x, snapshot.y);
    this.showStatus(
      this.armSplitSecond()
        ? t("status.splitSecondReady")
        : this.rewindShieldMs > 0
          ? t("reward.borrowedBreath.title")
          : t("status.timeRewind")
    );
  }

  private updateEnemies(delta: number): void {
    this.enemies.forEach((enemy) => {
      if (!enemy.sprite.active) {
        return;
      }

      if (enemy.frozenMs > 0) {
        enemy.sprite.setVelocity(0, 0);
        return;
      }

      enemy.sprite.clearTint();

      if (enemy.kind === "chaser") {
        this.physics.moveToObject(enemy.sprite, this.player, enemy.speed);
        return;
      }

      if (enemy.kind === "boss") {
        this.updateBoss(enemy, delta);
        return;
      }

      if (enemy.kind === "anomaly") {
        this.updateAnomaly(enemy, delta);
        return;
      }

      this.updateShooter(enemy, delta);
    });
  }

  private updateBoss(enemy: EnemyState, delta: number): void {
    const distance = Phaser.Math.Distance.Between(enemy.sprite.x, enemy.sprite.y, this.player.x, this.player.y);

    if (distance > 280) {
      this.physics.moveToObject(enemy.sprite, this.player, enemy.speed);
    } else {
      enemy.sprite.setVelocity(0, 0);
    }

    enemy.fireElapsedMs += delta;
    if (enemy.fireElapsedMs >= enemy.fireCooldownMs) {
      enemy.fireElapsedMs = 0;

      if (this.bossVariant === "glitch" && enemy.attackCycle % 2 === 0) {
        this.fireBossRing(enemy);
      } else {
        this.fireBossBurst(enemy);
      }

      enemy.attackCycle += 1;
    }
  }

  private updateAnomaly(enemy: EnemyState, delta: number): void {
    if (enemy.windupMs > 0) {
      enemy.sprite.setVelocity(0, 0);
      enemy.windupMs -= delta;

      if (enemy.windupMs <= 0) {
        this.fireEnemyShot(enemy, 300, 8);
      }
      return;
    }

    this.physics.moveToObject(enemy.sprite, this.player, enemy.speed);

    enemy.fireElapsedMs += delta;
    if (enemy.fireElapsedMs >= enemy.fireCooldownMs) {
      enemy.fireElapsedMs = 0;
      this.blinkAnomaly(enemy);
    }
  }

  private blinkAnomaly(enemy: EnemyState): void {
    this.playBlinkPulse(enemy.sprite.x, enemy.sprite.y);

    const margin = 46;
    const angle = Math.random() * Math.PI * 2;
    const distance = 240 + Math.random() * 80;
    const targetX = Phaser.Math.Clamp(
      this.player.x + Math.cos(angle) * distance,
      ARENA.x + margin,
      ARENA.x + ARENA.width - margin
    );
    const targetY = Phaser.Math.Clamp(
      this.player.y + Math.sin(angle) * distance,
      ARENA.y + margin,
      ARENA.y + ARENA.height - margin
    );

    enemy.sprite.setPosition(targetX, targetY);
    enemy.sprite.setVelocity(0, 0);
    enemy.windupMs = 350;
    this.playBlinkPulse(targetX, targetY);
    playSfx("blink");
  }

  private playBlinkPulse(x: number, y: number): void {
    const pulse = this.add.circle(x, y, 26);
    pulse.setStrokeStyle(2, 0x9a8cf0, 0.85);
    pulse.setFillStyle(0x9a8cf0, 0.1);
    pulse.setDepth(6);
    this.tweens.add({
      targets: pulse,
      alpha: 0,
      scale: 1.5,
      duration: 300,
      ease: "Quad.easeOut",
      onComplete: () => pulse.destroy()
    });
  }

  private fireBossRing(enemy: EnemyState): void {
    const shots = 8;
    for (let index = 0; index < shots; index++) {
      const angle = (Math.PI * 2 * index) / shots;
      const direction = new Phaser.Math.Vector2(Math.cos(angle), Math.sin(angle));
      this.spawnEnemyProjectile(enemy.sprite.x, enemy.sprite.y, direction, 210, this.getEnemyDamage(6));
    }
  }

  private updateShooter(enemy: EnemyState, delta: number): void {
    const distance = Phaser.Math.Distance.Between(enemy.sprite.x, enemy.sprite.y, this.player.x, this.player.y);
    const direction = new Phaser.Math.Vector2(this.player.x - enemy.sprite.x, this.player.y - enemy.sprite.y);
    direction.normalize();

    if (distance < 260) {
      enemy.sprite.setVelocity(-direction.x * enemy.speed, -direction.y * enemy.speed);
    } else if (distance > 340) {
      enemy.sprite.setVelocity(direction.x * enemy.speed, direction.y * enemy.speed);
    } else {
      enemy.sprite.setVelocity(0, 0);
    }

    enemy.fireElapsedMs += delta;
    if (enemy.fireElapsedMs >= enemy.fireCooldownMs) {
      enemy.fireElapsedMs = 0;
      this.fireEnemyShot(enemy, 330, 8);
    }
  }

  private fireEnemyShot(enemy: EnemyState, speed: number, damage: number): void {
    const direction = new Phaser.Math.Vector2(this.player.x - enemy.sprite.x, this.player.y - enemy.sprite.y);
    direction.normalize();

    this.spawnEnemyProjectile(enemy.sprite.x, enemy.sprite.y, direction, speed, this.getEnemyDamage(damage));
  }

  private fireBossBurst(enemy: EnemyState): void {
    const baseAngle = Phaser.Math.Angle.Between(enemy.sprite.x, enemy.sprite.y, this.player.x, this.player.y);
    [-0.32, 0, 0.32].forEach((offset) => {
      const direction = new Phaser.Math.Vector2(Math.cos(baseAngle + offset), Math.sin(baseAngle + offset));
      this.spawnEnemyProjectile(enemy.sprite.x, enemy.sprite.y, direction, 260, this.getEnemyDamage(7));
    });
  }

  private spawnEnemyProjectile(
    x: number,
    y: number,
    direction: Phaser.Math.Vector2,
    speed: number,
    damage: number
  ): void {
    const projectile = this.physics.add.image(x, y, "enemy-shot");
    projectile.setCircle(7, 3, 3);
    projectile.setVelocity(direction.x * speed, direction.y * speed);
    projectile.setDepth(9);
    this.projectiles.push({
      sprite: projectile,
      owner: "enemy",
      damage,
      frozenMs: 0,
      lifespanMs: 1800
    });
  }

  private updateProjectiles(delta: number): void {
    this.projectiles.forEach((projectile) => {
      if (!projectile.sprite.active) {
        return;
      }

      projectile.lifespanMs -= delta;
      if (projectile.lifespanMs <= 0) {
        projectile.sprite.destroy();
        return;
      }

      if (projectile.frozenMs > 0) {
        projectile.frozenMs = Math.max(0, projectile.frozenMs - delta);
        projectile.sprite.setVelocity(0, 0);
      } else {
        if (projectile.storedVelocity) {
          projectile.sprite.setVelocity(projectile.storedVelocity.x, projectile.storedVelocity.y);
          projectile.storedVelocity = undefined;
        }
        projectile.sprite.clearTint();
      }
    });
  }

  private checkProjectileHits(): void {
    this.projectiles.forEach((projectile) => {
      if (!projectile.sprite.active) {
        return;
      }

      if (projectile.owner === "player") {
        for (const enemy of this.enemies) {
          if (!enemy.sprite.active || !this.physics.overlap(projectile.sprite, enemy.sprite)) {
            continue;
          }

          let damage = projectile.damage;
          const storedImpactBonus = enemy.frozenMs > 0 ? 10 * this.getRuleStacks("storedImpact") : 0;

          if (storedImpactBonus > 0) {
            damage += storedImpactBonus;
            this.showFloatingText(
              t("status.storedBonus", { value: storedImpactBonus }),
              enemy.sprite.x,
              enemy.sprite.y - 52,
              "#8be9fd"
            );
          }

          enemy.health -= damage;
          projectile.sprite.destroy();
          this.showFloatingText(`${damage}`, enemy.sprite.x, enemy.sprite.y - 30, "#f7d06e");
          enemy.sprite.setScale(1.12);
          this.tweens.add({
            targets: enemy.sprite,
            scale: 1,
            duration: 90
          });

          if (enemy.health <= 0) {
            playSfx("enemyBreak");
            this.showFloatingText(t("status.break"), enemy.sprite.x, enemy.sprite.y, "#8be9fd");
            enemy.sprite.destroy();
          } else {
            playSfx("enemyHit");
          }
          break;
        }
      } else if (this.physics.overlap(projectile.sprite, this.player)) {
        projectile.sprite.destroy();
        this.damagePlayer(projectile.damage);
      }
    });
  }

  private checkPlayerEnemyContact(): void {
    this.enemies.forEach((enemy) => {
      if (enemy.sprite.active && this.physics.overlap(this.player, enemy.sprite)) {
        this.damagePlayer(this.getEnemyDamage(7));
      }
    });
  }

  private damagePlayer(amount: number): void {
    if (this.roomState !== "playing" || this.playerInvulnerableMs > 0) {
      return;
    }

    if (this.rewindShieldMs > 0) {
      this.rewindShieldMs = 0;
      this.playerInvulnerableMs = PLAYER.invulnerableAfterHitMs;
      playSfx("shieldBlock");
      this.showFloatingText(t("status.shield"), this.player.x, this.player.y - 34, "#8fd694");
      this.player.setTint(0x8fd694);
      this.time.delayedCall(120, () => this.player.clearTint());
      return;
    }

    this.playerHealth = Math.max(0, this.playerHealth - amount);
    this.playerInvulnerableMs = PLAYER.invulnerableAfterHitMs;
    playSfx("playerHurt");
    this.cameras.main.shake(130, 0.004);
    this.showFloatingText(`${amount}`, this.player.x, this.player.y - 34, "#f18f6f");
    this.player.setTint(0xf7d06e);
    this.tweens.add({
      targets: this.player,
      alpha: 0.55,
      yoyo: true,
      repeat: 2,
      duration: 70,
      onComplete: () => {
        this.player.clearTint();
        this.player.setAlpha(1);
      }
    });
  }

  private cleanupDestroyedObjects(): void {
    this.enemies = this.enemies.filter((enemy) => enemy.sprite.active);
    this.projectiles = this.projectiles.filter((projectile) => projectile.sprite.active);
  }

  private checkRoomState(): void {
    if (this.playerHealth <= 0) {
      this.roomState = "lost";
      this.player.setVelocity(0, 0);
      playSfx("defeat");
      setPlayerHealth(0);
      failRun("summary.playerDefeated");
      this.showResultPanel(t("result.lostTitle"), t("result.lostBody"), t("result.summaryAction"), "summary");
      this.input.keyboard?.once("keydown-R", () => this.advanceAfterResult());
      return;
    }

    if (this.enemies.length === 0) {
      this.roomState = "won";
      this.player.setVelocity(0, 0);
      playSfx("victory");
      setPlayerHealth(this.playerHealth);
      const shardsGained = awardCombatShards(this.nodeType);
      const shardsLine = shardsGained > 0 ? `\n${t("result.shardsGained", { value: shardsGained })}` : "";

      if (this.nodeType === "boss") {
        completeNode(this.nodeId);
        const bossName = t(this.bossVariant === "glitch" ? "node.bossName2" : "node.bossName");
        this.showResultPanel(
          t("result.bossTitle", { name: bossName }),
          t("result.bossBody") + shardsLine,
          t("result.summaryAction"),
          "summary"
        );
      } else {
        this.showResultPanel(
          this.nodeType === "elite" ? t("result.eliteTitle") : t("result.nodeTitle"),
          t("result.winBody") + shardsLine,
          t("result.rewardAction"),
          "reward"
        );
      }

      this.input.keyboard?.once("keydown-R", () => this.advanceAfterResult());
    }
  }

  private updateHud(): void {
    this.drawCombatHud();
    this.drawEnemyHud();

    const freeze = this.formatCooldown(this.freezeCooldownMs);
    const rewind = this.formatCooldown(this.rewindCooldownMs);
    const dash = this.formatCooldown(this.dashCooldownMs);
    const hudLines = [
      t("common.health", { current: this.playerHealth, max: this.playerMaxHealth }),
      t("hud.enemies", { count: this.enemies.length }),
      t("hud.freeze", { value: freeze }),
      t("hud.rewind", { value: rewind }),
      t("hud.dash", { value: dash })
    ];

    if (this.hasEchoAttack) {
      hudLines.push(t("hud.echo", { value: this.formatCooldown(this.echoCooldownMs) }));
    }

    if (this.hasTimeAnchor) {
      hudLines.push(
        t("hud.anchor", {
          value: this.anchorPosition ? t("hud.anchorSetState") : this.formatCooldown(this.anchorCooldownMs)
        })
      );
    }

    hudLines.push(
      t("hud.corruption", { value: formatCorruptionState(this.corruption) }),
      this.getCombatSkillState(),
      this.getCombatRuleState(),
      t("hud.controls")
    );
    this.hudText.setText(hudLines);
  }

  private getCombatSkillState(): string {
    const skillStates: string[] = [];

    if (this.freezeRadius > TIME_SKILLS.freezeRadius) {
      skillStates.push(t("hud.freezeBonus", { value: this.freezeRadius - TIME_SKILLS.freezeRadius }));
    }

    if (this.freezeImpactDamage > 0) {
      skillStates.push(t("hud.hitBonus", { value: this.freezeImpactDamage }));
    }

    if (this.rewindShieldMs > 0) {
      skillStates.push(t("hud.shieldTime", { value: Math.ceil(this.rewindShieldMs / 1000) }));
    } else if (this.rewindShieldLimitMs > 0) {
      skillStates.push(t("hud.shieldReady"));
    }

    return t("hud.skills", {
      value: skillStates.length > 0 ? skillStates.join(" / ") : t("common.base")
    });
  }

  private armSplitSecond(): boolean {
    if (this.getRuleStacks("splitSecond") === 0) {
      return false;
    }

    this.splitSecondReady = true;
    return true;
  }

  private getCombatRuleState(): string {
    const activeStates: string[] = [t("hud.rules", { count: this.activeRules.size, max: MAX_TEMPORAL_RULES })];

    if (this.splitSecondReady) {
      activeStates.push(t("hud.splitReady"));
    }

    if (this.getRuleStacks("emergencyLoop") > 0 && this.playerHealth <= this.playerMaxHealth * 0.35) {
      activeStates.push(t("hud.emergencyLoop"));
    }

    return activeStates.join(" / ");
  }

  private getRuleStacks(ruleId: TemporalRuleId): number {
    return this.activeRules.get(ruleId) ?? 0;
  }

  private drawCombatHud(): void {
    this.combatHud.clear();
    this.drawBar(this.combatHud, 168, 31, 78, 9, this.playerHealth / this.playerMaxHealth, 0x6edbd6);
    this.drawBar(
      this.combatHud,
      180,
      88,
      66,
      7,
      1 - this.freezeCooldownMs / this.freezeCooldownLimitMs,
      0x8be9fd
    );
    this.drawBar(
      this.combatHud,
      180,
      115,
      66,
      7,
      1 - this.rewindCooldownMs / this.rewindCooldownLimitMs,
      0x8fd694
    );
    this.drawBar(this.combatHud, 180, 132, 66, 7, 1 - this.dashCooldownMs / PLAYER.dashCooldownMs, 0xf7d06e);
  }

  private drawEnemyHud(): void {
    this.enemyHud.clear();

    this.enemies.forEach((enemy) => {
      if (!enemy.sprite.active) {
        return;
      }

      const barX = enemy.sprite.x - 24;
      const barY = enemy.sprite.y - 34;
      this.drawBar(this.enemyHud, barX, barY, 48, 5, enemy.health / enemy.maxHealth, 0xf18f6f);

      if (enemy.frozenMs > 0) {
        const frozenRatio = enemy.frozenMs / this.freezeDurationLimitMs;
        this.enemyHud.lineStyle(2, 0x8be9fd, 0.65);
        this.enemyHud.strokeCircle(enemy.sprite.x, enemy.sprite.y, 26);
        this.drawBar(this.enemyHud, barX, barY - 7, 48, 4, frozenRatio, 0x8be9fd);
      }
    });
  }

  private drawBar(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    progress: number,
    fill: number
  ): void {
    const ratio = Phaser.Math.Clamp(progress, 0, 1);
    graphics.fillStyle(0x071016, 0.82);
    graphics.fillRoundedRect(x, y, width, height, 3);
    graphics.fillStyle(fill, 0.95);
    graphics.fillRoundedRect(x, y, width * ratio, height, 3);
  }

  private formatCooldown(valueMs: number): string {
    if (valueMs <= 0) {
      return t("common.ready");
    }

    return `${Math.ceil(valueMs / 1000)}s`;
  }

  private getEnemyDamage(baseDamage: number): number {
    const rawDamage = (baseDamage + this.corruptionTier.enemyDamageBonus) * this.difficultyModifiers.enemyDamageMultiplier;
    return Math.max(1, Math.round(rawDamage));
  }

  private showCorruptionStatus(): void {
    if (this.corruptionTier.id === "stable") {
      return;
    }

    this.showStatus(t("status.corruption", { tier: getCorruptionTierTitle(this.corruptionTier) }));
  }

  private showStatus(message: string): void {
    this.statusText.setText(message);
    this.time.delayedCall(1300, () => {
      if (this.roomState === "playing" && this.statusText.text === message) {
        this.statusText.setText("");
      }
    });
  }

  private showFloatingText(text: string, x: number, y: number, color: string): void {
    const damageText = this.add.text(x, y, text, {
      align: "center",
      color,
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "16px"
    });
    damageText.setOrigin(0.5, 0.5);
    damageText.setDepth(22);
    this.tweens.add({
      targets: damageText,
      y: y - 28,
      alpha: 0,
      duration: 520,
      ease: "Quad.easeOut",
      onComplete: () => damageText.destroy()
    });
  }

  private playFreezePulse(x: number, y: number, radius: number): void {
    const pulse = this.add.circle(x, y, radius);
    pulse.setStrokeStyle(3, 0x8be9fd, 0.8);
    pulse.setFillStyle(0x8be9fd, 0.08);
    pulse.setDepth(6);
    this.tweens.add({
      targets: pulse,
      alpha: 0,
      scale: 1.12,
      duration: 320,
      ease: "Quad.easeOut",
      onComplete: () => pulse.destroy()
    });
  }

  private playRewindPulse(x: number, y: number): void {
    const pulse = this.add.circle(x, y, 42);
    pulse.setStrokeStyle(3, 0x8fd694, 0.9);
    pulse.setFillStyle(0x8fd694, 0.08);
    pulse.setDepth(6);
    this.tweens.add({
      targets: pulse,
      alpha: 0,
      scale: 2.1,
      duration: 360,
      ease: "Quad.easeOut",
      onComplete: () => pulse.destroy()
    });
  }

  private createResultPanel(): void {
    const panel = this.add.rectangle(640, 360, 420, 210, 0x10151c, 0.94);
    panel.setStrokeStyle(2, 0x5a7288, 1);
    panel.setDepth(30);

    const title = this.add.text(640, 310, "", {
      align: "center",
      color: "#f7f3e8",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "28px"
    });
    title.setOrigin(0.5, 0.5);
    title.setDepth(31);
    title.setData("role", "result-title");

    const body = this.add.text(640, 352, "", {
      align: "center",
      color: "#cbd7e2",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "16px",
      wordWrap: { width: 340 }
    });
    body.setOrigin(0.5, 0.5);
    body.setDepth(31);
    body.setData("role", "result-body");

    const restartButton = this.add.rectangle(640, 414, 190, 42, 0x263746, 1);
    restartButton.setStrokeStyle(2, 0x8be9fd, 0.8);
    restartButton.setDepth(31);
    restartButton.setInteractive({ useHandCursor: true });
    restartButton.on("pointerup", () => {
      playSfx("uiClick");
      this.advanceAfterResult();
    });

    const restartText = this.add.text(640, 414, t("common.continue"), {
      align: "center",
      color: "#e7edf2",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "16px"
    });
    restartText.setOrigin(0.5, 0.5);
    restartText.setDepth(32);
    restartText.setData("role", "result-action");

    this.resultPanelElements = [panel, title, body, restartButton, restartText];
    this.setResultPanelVisible(false);
  }

  private showResultPanel(title: string, body: string, actionLabel: string, resultMode: ResultMode): void {
    this.resultMode = resultMode;
    this.resultPanelElements.forEach((element) => {
      if (element.getData("role") === "result-title" && element instanceof Phaser.GameObjects.Text) {
        element.setText(title);
      }

      if (element.getData("role") === "result-body" && element instanceof Phaser.GameObjects.Text) {
        element.setText(body);
      }

      if (element.getData("role") === "result-action" && element instanceof Phaser.GameObjects.Text) {
        element.setText(actionLabel);
      }
    });
    this.setResultPanelVisible(true);
    this.statusText.setText("");
  }

  private setResultPanelVisible(visible: boolean): void {
    this.resultPanelElements.forEach((element) => {
      element.setVisible(visible);
    });
  }

  private advanceAfterResult(): void {
    if (this.resultMode === "summary") {
      this.scene.start("SummaryScene");
      return;
    }

    this.scene.start("RewardScene", {
      nodeId: this.nodeId,
      context: this.nodeType === "elite" ? "elite" : "combat"
    });
  }

  private isInsideArena(x: number, y: number): boolean {
    return x >= ARENA.x && x <= ARENA.x + ARENA.width && y >= ARENA.y && y <= ARENA.y + ARENA.height;
  }
}
