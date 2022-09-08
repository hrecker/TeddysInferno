import { config } from "../model/Config";
import { playSound, SoundEffect } from "../model/Sound";
import { getLifetimeStats } from "../state/GameResultState";
import { getSettings, setMusicEnabled, setSfxEnabled } from "../state/Settings";

// Currently selected button
let selectedButton: string;
const musicControlButtonName = "musicControlButton";
const sfxControlButtonName = "sfxControlButton";

// Groups to allow easily showing and hiding multiple UI elements
let mainMenuGroup: Phaser.GameObjects.Group;
let lifetimeStatsGroup: Phaser.GameObjects.Group;

// Stats texts
let timeSurvivedText: Phaser.GameObjects.Text;
let gemsCollectedText: Phaser.GameObjects.Text;
let enemiesKilledText: Phaser.GameObjects.Text;
let shotsFiredText: Phaser.GameObjects.Text;
let deathsText: Phaser.GameObjects.Text;

/** Main Menu scene */
export class MenuScene extends Phaser.Scene {
    constructor() {
        super({
            key: "MenuScene"
        });
    }

    getMusicButtonTexture() {
        return getSettings().musicEnabled ? "musicOnButton" : "musicOffButton";
    }

    getSfxButtonTexture() {
        return getSettings().sfxEnabled ? "soundOnButton" : "soundOffButton";
    }

    getDefaultTexture(buttonName: string) {
        if (buttonName == musicControlButtonName) {
            return this.getMusicButtonTexture();
        }
        if (buttonName == sfxControlButtonName) {
            return this.getSfxButtonTexture();
        }
        return buttonName;
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
        let backButton = this.add.image(centerX, buttonYAnchor + buttonMargin * 3 + 50, "backButton").setScale(1.5);
        this.configureButton(playButton, "playButton");
        this.configureButton(statsButton, "statsButton");
        this.configureButton(backButton, "backButton");
        mainMenuGroup.add(playButton);
        mainMenuGroup.add(statsButton);
        lifetimeStatsGroup.add(backButton);
        
        // Audio control buttons
        let musicControlButton = this.add.image(5, this.game.renderer.height - 60, this.getMusicButtonTexture()).setOrigin(0, 1);
        this.configureButton(musicControlButton, musicControlButtonName);
        let sfxControlButton = this.add.image(5, this.game.renderer.height - 5, this.getSfxButtonTexture()).setOrigin(0, 1);
        this.configureButton(sfxControlButton, sfxControlButtonName);

        // Controls
        let controlsMargin = 35;
        let controlsYAnchor = buttonYAnchor + buttonMargin + 75;
        mainMenuGroup.add(this.add.text(centerX, controlsYAnchor, "Controls:", { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(0.5));
        mainMenuGroup.add(this.add.text(centerX, controlsYAnchor + controlsMargin, "- W to activate thrust", config()["controlsStyle"]).setOrigin(0.5));
        mainMenuGroup.add(this.add.text(centerX, controlsYAnchor + controlsMargin * 2, "- A and D to turn left and right", config()["controlsStyle"]).setOrigin(0.5));
        mainMenuGroup.add(this.add.text(centerX, controlsYAnchor + controlsMargin * 3, "- O or left click to fire stream of bullets", config()["controlsStyle"]).setOrigin(0.5));
        mainMenuGroup.add(this.add.text(centerX, controlsYAnchor + controlsMargin * 4, "- P or right click to fire blast of bullets", config()["controlsStyle"]).setOrigin(0.5));
        mainMenuGroup.add(this.add.text(centerX, controlsYAnchor + controlsMargin * 5, "- Q to quickturn", config()["controlsStyle"]).setOrigin(0.5));
        mainMenuGroup.add(this.add.text(centerX, controlsYAnchor + controlsMargin * 6, "- E to boost", config()["controlsStyle"]).setOrigin(0.5));
        mainMenuGroup.add(this.add.text(centerX, controlsYAnchor + controlsMargin * 7, "- Space to activate bomb", config()["controlsStyle"]).setOrigin(0.5));

        // Lifetime stats
        let lifetimeStats = getLifetimeStats();

        let statsMargin = 60;
        lifetimeStatsGroup.add(this.add.text(centerX, this.game.renderer.height / 8, "Statistics", config()["titleStyle"]).setOrigin(0.5));
        lifetimeStatsGroup.add(this.add.text(centerX - 320, buttonYAnchor, "Time survived", { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(0, 0.5));
        lifetimeStatsGroup.add(this.add.text(centerX - 320, buttonYAnchor + statsMargin, "Gems collected", { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(0, 0.5));
        lifetimeStatsGroup.add(this.add.text(centerX - 320, buttonYAnchor + statsMargin * 2, "Enemies killed", { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(0, 0.5));
        lifetimeStatsGroup.add(this.add.text(centerX - 320, buttonYAnchor + statsMargin * 3, "Shots fired", { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(0, 0.5));
        lifetimeStatsGroup.add(this.add.text(centerX - 320, buttonYAnchor + statsMargin * 4, "Deaths", { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(0, 0.5));
        timeSurvivedText = this.add.text(centerX + 320, buttonYAnchor, lifetimeStats.score.toFixed(1), { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(1, 0.5);
        gemsCollectedText = this.add.text(centerX + 320, buttonYAnchor + statsMargin, lifetimeStats.gemsCollected.toString(), { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(1, 0.5);
        enemiesKilledText = this.add.text(centerX + 320, buttonYAnchor + statsMargin * 2, lifetimeStats.enemiesKilled.toString(), { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(1, 0.5);
        shotsFiredText = this.add.text(centerX + 320, buttonYAnchor + statsMargin * 3, lifetimeStats.shotsFired.toString(), { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(1, 0.5);
        deathsText = this.add.text(centerX + 320, buttonYAnchor + statsMargin * 4, lifetimeStats.deaths.toString(), { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(1, 0.5);
        lifetimeStatsGroup.add(timeSurvivedText);
        lifetimeStatsGroup.add(gemsCollectedText);
        lifetimeStatsGroup.add(enemiesKilledText);
        lifetimeStatsGroup.add(shotsFiredText);
        lifetimeStatsGroup.add(deathsText);

        lifetimeStatsGroup.setVisible(false);
        //TODO credits - button is from Kenney asset pack

        //TODO added this for quicker testing - just skips the main menu scene and opens the game scene
        //this.handleButtonClick("play");
    }

    configureButton(button: Phaser.GameObjects.Image, buttonName: string) {
        button.setInteractive();
        button.on('pointerout', () => {
            button.setTexture(this.getDefaultTexture(buttonName)); 
            selectedButton = null;
        });
        button.on('pointerdown', () => {
            button.setTexture(this.getDefaultTexture(buttonName) + "Down"); 
            selectedButton = buttonName;
            playSound(this, SoundEffect.ButtonClick);
        });
        button.on('pointerup', () => {
            if (selectedButton === buttonName) {
                this.handleButtonClick(buttonName);
            }
            button.setTexture(this.getDefaultTexture(buttonName)); 
            selectedButton = null;
        });
    }

    handleButtonClick(buttonName) {
        switch (buttonName) {
            case "backButton":
                // Back to the main menu from the stats menu
                mainMenuGroup.setVisible(true);
                lifetimeStatsGroup.setVisible(false);
                break;
            case "playButton":
                // Start game
                this.scene.start("MainScene")
                          .start("MainUIScene")
                          .stop();
                break;
            case musicControlButtonName:
                // Toggle music
                setMusicEnabled(!getSettings().musicEnabled);
                break;
            case sfxControlButtonName:
                // Toggle sfx
                setSfxEnabled(!getSettings().sfxEnabled);
                break;
            case "statsButton":
                // Show stats
                mainMenuGroup.setVisible(false);
                lifetimeStatsGroup.setVisible(true);
                break;
        }
    }
}