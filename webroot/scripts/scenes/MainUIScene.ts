import { config } from "../model/Config";
import { addAbilityListener } from "../state/AbilityState";
import { addTimerListener } from "../state/TimerState";

let timerText: Phaser.GameObjects.Text;

// Ability icons and masks for cooldown
let boostIcon: Phaser.GameObjects.Image;
let quickTurnIcon: Phaser.GameObjects.Image;
let boostIconMask: Phaser.GameObjects.Graphics;
let quickTurnIconMask: Phaser.GameObjects.Graphics;

/** UI displayed over MainScene */
export class MainUIScene extends Phaser.Scene {
    constructor() {
        super({
            key: "MainUIScene"
        });
    }

    /** Update the text of the timer */
    setTimerText(text) {
        if (timerText) {
            timerText.setText(text);
        }
    }

    /** Listen for updates to the game timer and update the text of the timer */
    timerListener(timer, scene) {
        scene.setTimerText((Math.round(timer / 100.0) / 10).toFixed(1));
    }

    /** Listen for the player using their abilities */
    abilityListener(ability, cooldownMs, scene) {
        switch (ability) {
            case "boost":
                scene.startCooldownTween(boostIcon, boostIconMask, cooldownMs);
                break;
            case "quickTurn":
                scene.startCooldownTween(quickTurnIcon, quickTurnIconMask, cooldownMs);
                break;
        }
    }

    /** Start tween for cooldown on ability icons */
    startCooldownTween(icon, mask, cooldownMs) {
        mask.y = 72;
        mask.alpha = 0.2;
        icon.alpha = 0.2;
        this.tweens.add({
            targets: mask,
            y: {
                from: 72,
                to: 0
            },
            duration: cooldownMs,
            onComplete: function() {
                mask.alpha = 0.8;
                icon.alpha = 0.8;
            }
        });
    }

    create() {
        timerText = this.add.text(this.game.renderer.width / 2, 24, "0.0", config()["timerFontStyle"]);
        timerText.setOrigin(0.5);
        timerText.alpha = 0.75;
        addTimerListener(this.timerListener, this);

        addAbilityListener(this.abilityListener, this);

        boostIcon = this.add.image(this.game.renderer.width - 112, 40, "boostIcon").setAlpha(0.8);
        quickTurnIcon = this.add.image(this.game.renderer.width - 40, 40, "quickTurnIcon").setAlpha(0.8);

        boostIconMask = this.add.graphics().setVisible(false).setAlpha(0.8);
        quickTurnIconMask = this.add.graphics().setVisible(false).setAlpha(0.8);
        boostIconMask.fillStyle(0xffffff).fillRect(this.game.renderer.width - 144, 8, 64, 64);
        quickTurnIconMask.fillStyle(0xffffff).fillRect(this.game.renderer.width - 72, 8, 64, 64);

        boostIcon.setMask(boostIconMask.createGeometryMask());
        quickTurnIcon.setMask(quickTurnIconMask.createGeometryMask());
    }
}
