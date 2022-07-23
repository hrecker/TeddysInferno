import { config } from "../model/Config";

let timerText: Phaser.GameObjects.Text;

/** UI displayed over MainScene */
export class MainUIScene extends Phaser.Scene {
    constructor() {
        super({
            key: "MainUIScene"
        });
    }

    preload() {
    }

    create() {
        timerText = this.add.text(480, 25, "0.0", config()["timerFontStyle"]);
        timerText.setOrigin(0.5);
        timerText.alpha = 0.75;
    }
}

export function setTimerText(text) {
    if (timerText) {
        timerText.setText(text);
    }
}