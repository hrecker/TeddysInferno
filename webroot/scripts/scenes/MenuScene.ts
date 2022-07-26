import { config } from "../model/Config";

// Currently selected button
let selectedButton: string;

/** Main Menu scene */
export class MenuScene extends Phaser.Scene {
    constructor() {
        super({
            key: "MenuScene"
        });
    }

    create() {
        this.cameras.main.setBackgroundColor(config()["backgroundColor"]);

        let centerX = this.game.renderer.width / 2;
        let centerY = this.game.renderer.height / 2;
        this.add.text(centerX, this.game.renderer.height / 8, "Teddy's Inferno", config()["titleStyle"]).setOrigin(0.5);

        // Play button
        let playButton = this.add.image(centerX, centerY - 75, "playButton").setScale(1.5);
        playButton.setInteractive();
        playButton.on('pointerout', () => {
            playButton.setTexture("playButton"); 
            selectedButton = null;
        });
        playButton.on('pointerdown', () => {
            playButton.setTexture("playButtonDown");
            selectedButton = "playButton";
        });
        playButton.on('pointerup', () => {
            if (selectedButton === "playButton") {
                this.handleButtonClick("playButton");
            }
            playButton.setTexture("playButton");
            selectedButton = null;
        });

        // Controls
        this.add.text(centerX, playButton.y + 75, "Controls:", { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(0.5);
        this.add.text(centerX, playButton.y + 115, "- W to activate thrust", config()["controlsStyle"]).setOrigin(0.5);
        this.add.text(centerX, playButton.y + 155, "- A and D to turn left and right", config()["controlsStyle"]).setOrigin(0.5);
        this.add.text(centerX, playButton.y + 195, "- O or left click to fire stream of bullets", config()["controlsStyle"]).setOrigin(0.5);
        this.add.text(centerX, playButton.y + 235, "- P or right click to fire blast of bullets", config()["controlsStyle"]).setOrigin(0.5);
        this.add.text(centerX, playButton.y + 275, "- Q to quickturn", config()["controlsStyle"]).setOrigin(0.5);
        this.add.text(centerX, playButton.y + 315, "- E to boost", config()["controlsStyle"]).setOrigin(0.5);

        //TODO credits - button is from Kenney asset pack

        //TODO added this for quicker testing - just skips the main menu scene and opens the game scene
        this.handleButtonClick("playButton");
    }

    handleButtonClick(buttonName) {
        switch (buttonName) {
            case "playButton":
                // Start game
                this.scene.start("MainScene")
                          .start("MainUIScene")
                          .stop();
                break;
        }
    }
}