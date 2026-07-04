import Phaser from "phaser";

type ArcadeImage = Phaser.Physics.Arcade.Image;

type EnemyKind = "chaser" | "shooter";

type EnemyState = {
  sprite: ArcadeImage;
  kind: EnemyKind;
  health: number;
  maxHealth: number;
  speed: number;
  fireCooldownMs: number;
  fireElapsedMs: number;
  frozenMs: number;
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

export class CombatScene extends Phaser.Scene {
  private player!: ArcadeImage;
  private aimLine!: Phaser.GameObjects.Line;
  private freezePreview!: Phaser.GameObjects.Arc;
  private rewindTrail!: Phaser.GameObjects.Graphics;
  private combatHud!: Phaser.GameObjects.Graphics;
  private enemyHud!: Phaser.GameObjects.Graphics;
  private hudText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private resultPanelElements: Array<Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text> = [];
  private keys!: Record<"W" | "A" | "S" | "D" | "Q" | "E" | "SPACE", Phaser.Input.Keyboard.Key>;
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
  private snapshotElapsedMs = 0;
  private roomState: "playing" | "won" | "lost" = "playing";

  constructor() {
    super("CombatScene");
  }

  init(): void {
    this.enemies = [];
    this.projectiles = [];
    this.snapshots = [];
    this.resultPanelElements = [];
    this.playerHealth = PLAYER.maxHealth;
    this.playerInvulnerableMs = 0;
    this.attackElapsedMs = PLAYER.attackCooldownMs;
    this.dashCooldownMs = 0;
    this.dashRemainingMs = 0;
    this.dashVector.set(0, 0);
    this.freezeCooldownMs = 0;
    this.rewindCooldownMs = 0;
    this.snapshotElapsedMs = 0;
    this.roomState = "playing";
  }

  create(): void {
    this.createGeneratedTextures();
    this.createArena();
    this.createPlayer();
    this.createEnemies();
    this.createHud();
    this.createInput();
    this.physics.world.setBounds(ARENA.x, ARENA.y, ARENA.width, ARENA.height);
  }

  update(time: number, delta: number): void {
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
    this.spawnEnemy("chaser", ARENA.x + 210, ARENA.y + 250);
    this.spawnEnemy("chaser", ARENA.x + ARENA.width - 210, ARENA.y + 265);
    this.spawnEnemy("shooter", ARENA.x + ARENA.width / 2, ARENA.y + 100);
  }

  private spawnEnemy(kind: EnemyKind, x: number, y: number): void {
    const texture = kind === "chaser" ? "chaser-core" : "shooter-core";
    const sprite = this.physics.add.image(x, y, texture);
    sprite.setCircle(18, 3, 3);
    sprite.setCollideWorldBounds(true);
    sprite.setDepth(8);

    this.enemies.push({
      sprite,
      kind,
      health: kind === "chaser" ? 48 : 62,
      maxHealth: kind === "chaser" ? 48 : 62,
      speed: kind === "chaser" ? 145 : 95,
      fireCooldownMs: kind === "shooter" ? 1300 : 0,
      fireElapsedMs: kind === "shooter" ? 500 : 0,
      frozenMs: 0
    });
  }

  private createHud(): void {
    this.add.rectangle(16, 14, 292, 174, 0x10151c, 0.9).setOrigin(0, 0).setDepth(19);
    this.combatHud = this.add.graphics();
    this.combatHud.setDepth(20);
    this.enemyHud = this.add.graphics();
    this.enemyHud.setDepth(18);

    this.aimLine = this.add.line(0, 0, 0, 0, 0, 0, 0x8be9fd, 0.55);
    this.aimLine.setOrigin(0, 0);
    this.aimLine.setDepth(12);

    this.freezePreview = this.add.circle(0, 0, TIME_SKILLS.freezeRadius);
    this.freezePreview.setStrokeStyle(2, 0x8be9fd, 0.24);
    this.freezePreview.setFillStyle(0x8be9fd, 0.05);
    this.freezePreview.setDepth(3);
    this.freezePreview.setVisible(false);

    this.rewindTrail = this.add.graphics();
    this.rewindTrail.setDepth(4);

    this.hudText = this.add.text(24, 20, "", {
      color: "#e7edf2",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "18px",
      lineSpacing: 8
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
      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE
    }) as typeof this.keys;

    this.input.keyboard.addCapture("W,A,S,D,Q,E,SPACE");
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        this.tryFirePlayerShot();
      }
    });
  }

  private updateTimers(delta: number): void {
    this.attackElapsedMs += delta;
    this.dashCooldownMs = Math.max(0, this.dashCooldownMs - delta);
    this.freezeCooldownMs = Math.max(0, this.freezeCooldownMs - delta);
    this.rewindCooldownMs = Math.max(0, this.rewindCooldownMs - delta);
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
  }

  private tryFirePlayerShot(): void {
    if (this.attackElapsedMs < PLAYER.attackCooldownMs) {
      return;
    }

    this.attackElapsedMs = 0;
    const direction = this.getAimVector();
    const projectile = this.physics.add.image(this.player.x, this.player.y, "player-shot");
    projectile.setCircle(6, 3, 3);
    projectile.setVelocity(direction.x * PLAYER.attackSpeed, direction.y * PLAYER.attackSpeed);
    projectile.setDepth(9);
    this.projectiles.push({
      sprite: projectile,
      owner: "player",
      damage: PLAYER.attackDamage,
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

  private tryTimeFreeze(): void {
    if (this.freezeCooldownMs > 0) {
      return;
    }

    this.freezeCooldownMs = TIME_SKILLS.freezeCooldownMs;
    const pointer = this.input.activePointer;
    pointer.updateWorldPoint(this.cameras.main);
    const center = new Phaser.Math.Vector2(pointer.worldX, pointer.worldY);
    this.playFreezePulse(center.x, center.y);

    this.enemies.forEach((enemy) => {
      if (!enemy.sprite.active) {
        return;
      }

      const distance = Phaser.Math.Distance.Between(center.x, center.y, enemy.sprite.x, enemy.sprite.y);
      if (distance <= TIME_SKILLS.freezeRadius) {
        enemy.frozenMs = TIME_SKILLS.freezeDurationMs;
        enemy.sprite.setTint(0x8be9fd);
        enemy.sprite.setVelocity(0, 0);
      }
    });

    this.projectiles.forEach((projectile) => {
      if (projectile.owner === "enemy") {
        const distance = Phaser.Math.Distance.Between(center.x, center.y, projectile.sprite.x, projectile.sprite.y);
        if (distance <= TIME_SKILLS.freezeRadius) {
          projectile.frozenMs = TIME_SKILLS.freezeDurationMs;
          projectile.storedVelocity = new Phaser.Math.Vector2(
            projectile.sprite.body?.velocity.x ?? 0,
            projectile.sprite.body?.velocity.y ?? 0
          );
          projectile.sprite.setTint(0x8be9fd);
          projectile.sprite.setVelocity(0, 0);
        }
      }
    });

    this.showStatus("Time Freeze");
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
    this.playerHealth = Math.min(PLAYER.maxHealth, restoredHealth);
    this.playerInvulnerableMs = 800;
    this.rewindCooldownMs = TIME_SKILLS.rewindCooldownMs;
    this.playRewindPulse(snapshot.x, snapshot.y);
    this.showStatus("Time Rewind");
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

      this.updateShooter(enemy, delta);
    });
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
      this.fireEnemyShot(enemy);
    }
  }

  private fireEnemyShot(enemy: EnemyState): void {
    const direction = new Phaser.Math.Vector2(this.player.x - enemy.sprite.x, this.player.y - enemy.sprite.y);
    direction.normalize();

    const projectile = this.physics.add.image(enemy.sprite.x, enemy.sprite.y, "enemy-shot");
    projectile.setCircle(7, 3, 3);
    projectile.setVelocity(direction.x * 330, direction.y * 330);
    projectile.setDepth(9);
    this.projectiles.push({
      sprite: projectile,
      owner: "enemy",
      damage: 8,
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

          enemy.health -= projectile.damage;
          projectile.sprite.destroy();
          this.showFloatingText(`${projectile.damage}`, enemy.sprite.x, enemy.sprite.y - 30, "#f7d06e");
          enemy.sprite.setScale(1.12);
          this.tweens.add({
            targets: enemy.sprite,
            scale: 1,
            duration: 90
          });

          if (enemy.health <= 0) {
            this.showFloatingText("Break", enemy.sprite.x, enemy.sprite.y, "#8be9fd");
            enemy.sprite.destroy();
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
        this.damagePlayer(7);
      }
    });
  }

  private damagePlayer(amount: number): void {
    if (this.playerInvulnerableMs > 0 || this.roomState !== "playing") {
      return;
    }

    this.playerHealth = Math.max(0, this.playerHealth - amount);
    this.playerInvulnerableMs = PLAYER.invulnerableAfterHitMs;
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
      this.showResultPanel("Timeline Collapsed", "The fracture overran this prototype room.");
      this.input.keyboard?.once("keydown-R", () => this.restartPrototype());
      return;
    }

    if (this.enemies.length === 0) {
      this.roomState = "won";
      this.player.setVelocity(0, 0);
      this.showResultPanel("Fracture Stabilized", "The room is clear and the combat loop is complete.");
      this.input.keyboard?.once("keydown-R", () => this.restartPrototype());
    }
  }

  private updateHud(): void {
    this.drawCombatHud();
    this.drawEnemyHud();

    const freeze = this.formatCooldown(this.freezeCooldownMs);
    const rewind = this.formatCooldown(this.rewindCooldownMs);
    const dash = this.formatCooldown(this.dashCooldownMs);
    this.hudText.setText([
      `Health ${this.playerHealth}/${PLAYER.maxHealth}`,
      `Enemies ${this.enemies.length}`,
      `Q Freeze ${freeze}`,
      `E Rewind ${rewind}`,
      `Space Dash ${dash}`,
      "WASD move, mouse aim, left click attack"
    ]);
  }

  private drawCombatHud(): void {
    this.combatHud.clear();
    this.drawBar(this.combatHud, 168, 31, 78, 9, this.playerHealth / PLAYER.maxHealth, 0x6edbd6);
    this.drawBar(
      this.combatHud,
      180,
      88,
      66,
      7,
      1 - this.freezeCooldownMs / TIME_SKILLS.freezeCooldownMs,
      0x8be9fd
    );
    this.drawBar(
      this.combatHud,
      180,
      115,
      66,
      7,
      1 - this.rewindCooldownMs / TIME_SKILLS.rewindCooldownMs,
      0x8fd694
    );
    this.drawBar(this.combatHud, 180, 142, 66, 7, 1 - this.dashCooldownMs / PLAYER.dashCooldownMs, 0xf7d06e);
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
        const frozenRatio = enemy.frozenMs / TIME_SKILLS.freezeDurationMs;
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
      return "ready";
    }

    return `${Math.ceil(valueMs / 1000)}s`;
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

  private playFreezePulse(x: number, y: number): void {
    const pulse = this.add.circle(x, y, TIME_SKILLS.freezeRadius);
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
    restartButton.on("pointerup", () => this.restartPrototype());

    const restartText = this.add.text(640, 414, "Restart Prototype", {
      align: "center",
      color: "#e7edf2",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "16px"
    });
    restartText.setOrigin(0.5, 0.5);
    restartText.setDepth(32);

    this.resultPanelElements = [panel, title, body, restartButton, restartText];
    this.setResultPanelVisible(false);
  }

  private showResultPanel(title: string, body: string): void {
    this.resultPanelElements.forEach((element) => {
      if (element.getData("role") === "result-title" && element instanceof Phaser.GameObjects.Text) {
        element.setText(title);
      }

      if (element.getData("role") === "result-body" && element instanceof Phaser.GameObjects.Text) {
        element.setText(body);
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

  private restartPrototype(): void {
    this.scene.restart();
  }

  private isInsideArena(x: number, y: number): boolean {
    return x >= ARENA.x && x <= ARENA.x + ARENA.width && y >= ARENA.y && y <= ARENA.y + ARENA.height;
  }
}
