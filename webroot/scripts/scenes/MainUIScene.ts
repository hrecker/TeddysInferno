import { config } from "../model/Config";
import { addTimerListener } from "../state/TimerState";

let timerText: Phaser.GameObjects.Text;

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

    create() {
        timerText = this.add.text(480, 25, "0.0", config()["timerFontStyle"]);
        timerText.setOrigin(0.5);
        timerText.alpha = 0.75;
        addTimerListener(this.timerListener, this);
    }
}
