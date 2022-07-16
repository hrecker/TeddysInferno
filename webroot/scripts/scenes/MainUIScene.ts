// UI displayed over MainScene
let timerText: Phaser.GameObjects.Text;

export class MainUIScene extends Phaser.Scene {
    constructor() {
        super({
            key: "MainUIScene"
        });
    }

    preload() {
    }

    create() {
        let timerStyle = { 
            font: "36px verdana"
        };

        timerText = this.add.text(480, 25, "0.0", timerStyle);
        timerText.setOrigin(0.5);
        timerText.setStroke("black", 3);
        timerText.alpha = 0.75;
    }
}

export function setTimerText(text) {
    if (timerText) {
        timerText.setText(text);
    }
}