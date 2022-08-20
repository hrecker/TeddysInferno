import { config } from "../model/Config";
import { getLifetimeStats } from "../state/GameResultState";

// Currently selected button
let selectedButton: string;

// Groups to allow easily showing and hiding multiple UI elements
let mainMenuGroup: Phaser.GameObjects.Group;
let lifetimeStatsGroup: Phaser.GameObjects.Group;

// Stats texts
let timeSurvivedText: Phaser.GameObjects.Text;
let gemsCollectedText: Phaser.GameObjects.Text;
let enemiesKilledText: Phaser.GameObjects.Text;
let shotsFiredText: Phaser.GameObjects.Text;

/** Main Menu scene */
export class MenuScene extends Phaser.Scene {
    constructor() {
        super({
            key: "MenuScene"
        });
    }

    create() {
        mainMenuGroup = this.add.group();
        lifetimeStatsGroup = this.add.group();

        let centerX = this.game.renderer.width / 2;
        let centerY = this.game.renderer.height / 2;
        this.add.shader("Tunnel",  centerX, centerY, 
                this.game.renderer.width * 2, this.game.renderer.height * 3, ["shaderTexture"]);
        mainMenuGroup.add(this.add.text(centerX, this.game.renderer.height / 8, "Teddy's Inferno", config()["titleStyle"]).setOrigin(0.5));

        // Buttons
        let buttonYAnchor = centerY - 125;
        let buttonMargin = 90;
        let playButton = this.add.image(centerX, buttonYAnchor, "playButton").setScale(1.5);
        let statsButton = this.add.image(centerX, buttonYAnchor + buttonMargin, "statsButton").setScale(1.5);
        let backButton = this.add.image(centerX, buttonYAnchor + buttonMargin * 3, "backButton").setScale(1.5);
        this.configureButton(playButton, "play", "playButton", "playButtonDown");
        this.configureButton(statsButton, "stats", "statsButton", "statsButtonDown");
        this.configureButton(backButton, "back", "backButton", "backButtonDown");
        mainMenuGroup.add(playButton);
        mainMenuGroup.add(statsButton);
        lifetimeStatsGroup.add(backButton);

        // Controls
        let controlsMargin = 40;
        let controlsYAnchor = buttonYAnchor + buttonMargin + 75;
        mainMenuGroup.add(this.add.text(centerX, controlsYAnchor, "Controls:", { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(0.5));
        mainMenuGroup.add(this.add.text(centerX, controlsYAnchor + controlsMargin, "- W to activate thrust", config()["controlsStyle"]).setOrigin(0.5));
        mainMenuGroup.add(this.add.text(centerX, controlsYAnchor + controlsMargin * 2, "- A and D to turn left and right", config()["controlsStyle"]).setOrigin(0.5));
        mainMenuGroup.add(this.add.text(centerX, controlsYAnchor + controlsMargin * 3, "- O or left click to fire stream of bullets", config()["controlsStyle"]).setOrigin(0.5));
        mainMenuGroup.add(this.add.text(centerX, controlsYAnchor + controlsMargin * 4, "- P or right click to fire blast of bullets", config()["controlsStyle"]).setOrigin(0.5));
        mainMenuGroup.add(this.add.text(centerX, controlsYAnchor + controlsMargin * 5, "- Q to quickturn", config()["controlsStyle"]).setOrigin(0.5));
        mainMenuGroup.add(this.add.text(centerX, controlsYAnchor + controlsMargin * 6, "- E to boost", config()["controlsStyle"]).setOrigin(0.5));

        // Lifetime stats
        let lifetimeStats = getLifetimeStats();

        let statsMargin = 60;
        lifetimeStatsGroup.add(this.add.text(centerX, this.game.renderer.height / 8, "Statistics", config()["titleStyle"]).setOrigin(0.5));
        lifetimeStatsGroup.add(this.add.text(centerX - 320, buttonYAnchor, "Time survived", { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(0, 0.5));
        lifetimeStatsGroup.add(this.add.text(centerX - 320, buttonYAnchor + statsMargin, "Gems collected", { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(0, 0.5));
        lifetimeStatsGroup.add(this.add.text(centerX - 320, buttonYAnchor + statsMargin * 2, "Enemies killed", { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(0, 0.5));
        lifetimeStatsGroup.add(this.add.text(centerX - 320, buttonYAnchor + statsMargin * 3, "Shots fired", { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(0, 0.5));
        timeSurvivedText = this.add.text(centerX + 320, buttonYAnchor, lifetimeStats.score.toFixed(1), { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(1, 0.5);
        gemsCollectedText = this.add.text(centerX + 320, buttonYAnchor + statsMargin, lifetimeStats.gemsCollected.toString(), { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(1, 0.5);
        enemiesKilledText = this.add.text(centerX + 320, buttonYAnchor + statsMargin * 2, lifetimeStats.enemiesKilled.toString(), { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(1, 0.5);
        shotsFiredText = this.add.text(centerX + 320, buttonYAnchor + statsMargin * 3, lifetimeStats.shotsFired.toString(), { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(1, 0.5);
        lifetimeStatsGroup.add(timeSurvivedText);
        lifetimeStatsGroup.add(gemsCollectedText);
        lifetimeStatsGroup.add(enemiesKilledText);
        lifetimeStatsGroup.add(shotsFiredText);

        lifetimeStatsGroup.setVisible(false);
        //TODO credits - button is from Kenney asset pack

        //TODO added this for quicker testing - just skips the main menu scene and opens the game scene
        //this.handleButtonClick("play");
    }

    configureButton(button: Phaser.GameObjects.Image, buttonName: string, defaultTexture: string, downTexture: string) {
        button.setInteractive();
        button.on('pointerout', () => {
            button.setTexture(defaultTexture); 
            selectedButton = null;
        });
        button.on('pointerdown', () => {
            button.setTexture(downTexture);
            selectedButton = buttonName;
        });
        button.on('pointerup', () => {
            if (selectedButton === buttonName) {
                this.handleButtonClick(buttonName);
            }
            button.setTexture(defaultTexture);
            selectedButton = null;
        });
    }

    handleButtonClick(buttonName) {
        switch (buttonName) {
            case "back":
                // Back to the main menu from the stats menu
                mainMenuGroup.setVisible(true);
                lifetimeStatsGroup.setVisible(false);
                break;
            case "play":
                // Start game
                this.scene.start("MainScene")
                          .start("MainUIScene")
                          .stop();
                break;
            case "stats":
                // Show stats
                mainMenuGroup.setVisible(false);
                lifetimeStatsGroup.setVisible(true);
                break;
        }
    }
}