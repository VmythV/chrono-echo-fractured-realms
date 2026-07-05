import Phaser from "phaser";
import { LANGUAGE_NAMES, t } from "../../core/i18n";
import {
  cycleDifficulty,
  cycleLanguage,
  cycleSfxVolume,
  formatVolumeLabel,
  loadSettings,
  toggleSfxEnabled,
  type GameSettings
} from "../../core/meta/settings";
import { playSfx } from "../audio/sfx";
import { DISPLAY_FONT } from "../display";
import { fadeInScene, transitionTo } from "../scene-transitions";

type SettingsButtonVariant = "primary" | "secondary";

export class SettingsScene extends Phaser.Scene {
  private difficultyButtonText!: Phaser.GameObjects.Text;
  private difficultyHintText!: Phaser.GameObjects.Text;
  private soundButtonText!: Phaser.GameObjects.Text;
  private volumeButtonText!: Phaser.GameObjects.Text;

  constructor() {
    super("SettingsScene");
  }

  create(): void {
    fadeInScene(this);
    const settings = loadSettings();

    this.add.rectangle(640, 360, 1280, 720, 0x10151c);
    this.add.text(72, 76, t("settings.title"), {
      color: "#f7f3e8",
      fontFamily: DISPLAY_FONT,
      fontSize: "42px"
    });

    this.difficultyButtonText = this.createButton(76, 190, 340, 48, this.getDifficultyLabel(settings), "secondary", () =>
      this.cycleDifficultySetting()
    );
    this.difficultyHintText = this.add.text(456, 204, this.getDifficultyHint(settings), {
      color: "#8fa3b5",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "15px",
      wordWrap: { width: 560 }
    });

    this.createButton(76, 258, 340, 48, t("settings.language", { value: LANGUAGE_NAMES[settings.language] }), "secondary", () =>
      this.cycleLanguageSetting()
    );

    this.soundButtonText = this.createButton(76, 326, 340, 48, this.getSoundLabel(settings), "secondary", () =>
      this.toggleSoundSetting()
    );
    this.volumeButtonText = this.createButton(76, 394, 340, 48, this.getVolumeLabel(settings), "secondary", () =>
      this.cycleVolumeSetting()
    );

    this.createButton(76, 490, 340, 48, t("common.back"), "primary", () => transitionTo(this, "MainMenuScene"));

    this.add.text(76, 580, t("settings.note"), {
      color: "#6f8497",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "14px",
      wordWrap: { width: 900 }
    });
  }

  private getDifficultyLabel(settings: GameSettings): string {
    return t("settings.difficulty", { value: t(`settings.difficulty.${settings.difficulty}`) });
  }

  private getDifficultyHint(settings: GameSettings): string {
    return t(`settings.difficultyHint.${settings.difficulty}`);
  }

  private getSoundLabel(settings: GameSettings): string {
    return t("settings.sound", { value: settings.sfxEnabled ? t("common.on") : t("common.off") });
  }

  private getVolumeLabel(settings: GameSettings): string {
    return t("settings.volume", { value: t(`settings.volume.${formatVolumeLabel(settings.sfxVolume)}`) });
  }

  private cycleDifficultySetting(): void {
    const settings = cycleDifficulty();
    this.difficultyButtonText.setText(this.getDifficultyLabel(settings));
    this.difficultyHintText.setText(this.getDifficultyHint(settings));
  }

  private cycleLanguageSetting(): void {
    cycleLanguage();
    this.scene.restart();
  }

  private toggleSoundSetting(): void {
    const settings = toggleSfxEnabled();
    this.soundButtonText.setText(this.getSoundLabel(settings));
  }

  private cycleVolumeSetting(): void {
    const settings = cycleSfxVolume();
    this.volumeButtonText.setText(this.getVolumeLabel(settings));
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    variant: SettingsButtonVariant,
    onClick: () => void
  ): Phaser.GameObjects.Text {
    const fill = variant === "primary" ? 0x263746 : 0x18222c;
    const stroke = variant === "primary" ? 0x8be9fd : 0x5a7288;
    const textColor = variant === "primary" ? "#f7f3e8" : "#cbd7e2";
    const button = this.add.rectangle(x, y, width, height, fill, 1).setOrigin(0, 0);
    button.setStrokeStyle(2, stroke, 1);
    button.setInteractive({ useHandCursor: true });
    button.on("pointerover", () => button.setStrokeStyle(3, 0x8be9fd, 1));
    button.on("pointerout", () => button.setStrokeStyle(2, stroke, 1));
    button.on("pointerup", () => {
      playSfx("uiClick");
      onClick();
    });

    return this.add.text(x + width / 2, y + height / 2, label, {
      align: "center",
      color: textColor,
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: variant === "primary" ? "18px" : "16px"
    }).setOrigin(0.5, 0.5);
  }
}
