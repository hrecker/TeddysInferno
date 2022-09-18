import { config } from "../model/Config";
import { GameResult } from "../model/GameResult";
import { playSound, SoundEffect } from "../model/Sound";
import { getGameResults, getLifetimeStats } from "../state/GameResultState";
import { getSettings, setMusicEnabled, setSfxEnabled } from "../state/Settings";

// Currently selected button
let selectedButton: string;
const musicControlButtonName = "musicControlButton";
const sfxControlButtonName = "sfxControlButton";

// Groups to allow easily showing and hiding multiple UI elements
let mainMenuGroup: Phaser.GameObjects.Group;
let lifetimeStatsGroup: Phaser.GameObjects.Group;
let howToPlayGroup: Phaser.GameObjects.Group;

// Stats texts
let timeSurvivedText: Phaser.GameObjects.Text;
let averageTimeSurvivedText: Phaser.GameObjects.Text;
let gemsCollectedText: Phaser.GameObjects.Text;
let enemiesKilledText: Phaser.GameObjects.Text;
let shotsFiredText: Phaser.GameObjects.Text;
let deathsText: Phaser.GameObjects.Text;

// Whether to show how to play page when play is clicked
let showHowToPlay: boolean;

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

    getAverageTimeSurvived(lifetimeStats: GameResult): number {
        return lifetimeStats.score / lifetimeStats.deaths;
    }

    create() {
        showHowToPlay = getGameResults().length == 0;

        mainMenuGroup = this.add.group();
        lifetimeStatsGroup = this.add.group();
        howToPlayGroup = this.add.group();

        let centerX = this.game.renderer.width / 2;
        let centerY = this.game.renderer.height / 2;
        let titleY = this.game.renderer.height / 6;
        this.add.shader("Tunnel",  centerX, centerY, 
                this.game.renderer.width * 2, this.game.renderer.height * 3, ["shaderTexture"]);
        mainMenuGroup.add(this.add.text(centerX, titleY, "Teddy's Inferno", config()["titleStyle"]).setOrigin(0.5));

        // Buttons
        let buttonMargin = 100;
        let buttonYAnchor = titleY + buttonMargin + 50;
        let playButton = this.add.image(centerX, buttonYAnchor, "playButton").setScale(1.5);
        let howToPlayButton = this.add.image(centerX, buttonYAnchor + buttonMargin, "howToPlayButton").setScale(1.5);
        let statsButton = this.add.image(centerX, buttonYAnchor + buttonMargin * 2, "statsButton").setScale(1.5);
        let statsBackButton = this.add.image(centerX, buttonYAnchor + buttonMargin * 3 - 25, "backButton").setScale(1.5);
        let howToPlayBackButton = this.add.image(centerX + 275, buttonYAnchor + buttonMargin * 3 - 25, "backButton").setScale(1.5);
        let howToPlayPlayButton = this.add.image(centerX + 275, buttonYAnchor + buttonMargin * 2 - 25, "playButton").setScale(1.5);
        this.configureButton(playButton, "playButton");
        this.configureButton(howToPlayButton, "howToPlayButton");
        this.configureButton(statsButton, "statsButton");
        this.configureButton(statsBackButton, "backButton");
        this.configureButton(howToPlayBackButton, "backButton");
        this.configureButton(howToPlayPlayButton, "playButton");
        mainMenuGroup.add(playButton);
        mainMenuGroup.add(howToPlayButton);
        mainMenuGroup.add(statsButton);
        lifetimeStatsGroup.add(statsBackButton);
        howToPlayGroup.add(howToPlayBackButton);
        howToPlayGroup.add(howToPlayPlayButton);
        
        // Audio control buttons
        let musicControlButton = this.add.image(5, this.game.renderer.height - 60, this.getMusicButtonTexture()).setOrigin(0, 1);
        this.configureButton(musicControlButton, musicControlButtonName);
        let sfxControlButton = this.add.image(5, this.game.renderer.height - 5, this.getSfxButtonTexture()).setOrigin(0, 1);
        this.configureButton(sfxControlButton, sfxControlButtonName);

        // How to play page
        let howToPlayMargin = 75;
        let howToPlayAnchor = titleY + 50;
        howToPlayGroup.add(this.add.text(centerX, titleY - 50, "How To Play", config()["titleStyle"]).setOrigin(0.5));
        howToPlayGroup.add(this.add.text(centerX, howToPlayAnchor, "Survive as long as possible.", { ...config()["howToStyle"], font: "bold 40px Verdana" }).setOrigin(0.5));
        howToPlayGroup.add(this.add.text(centerX, howToPlayAnchor + howToPlayMargin, "Enemies drop Gems.\nCollect Gems to increase the speed of your weapon and earn Bombs.\nGems fly towards you when you stop firing your weapon.", config()["howToStyle"]).setOrigin(0.5));
        
        // Example images
        howToPlayGroup.add(this.add.image(centerX - 100, howToPlayAnchor + howToPlayMargin * 2 + 15, "howToPlayExample1").setScale(0.5));
        howToPlayGroup.add(this.add.image(centerX, howToPlayAnchor + howToPlayMargin * 2 + 15, "howToPlayExample2").setScale(0.5));
        howToPlayGroup.add(this.add.image(centerX + 100, howToPlayAnchor + howToPlayMargin * 2 + 15, "howToPlayExample3").setScale(0.5));

        let controlsMargin = 30;
        let controlsYAnchor = howToPlayAnchor + howToPlayMargin * 3;
        howToPlayGroup.add(this.add.text(centerX - 400, controlsYAnchor - 5, "Controls:", { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(0, 0.5));
        howToPlayGroup.add(this.add.text(centerX - 400, controlsYAnchor + controlsMargin, "W to activate thrust", config()["controlsStyle"]).setOrigin(0, 0.5));
        howToPlayGroup.add(this.add.text(centerX - 400, controlsYAnchor + controlsMargin * 2, "A and D to turn left and right", config()["controlsStyle"]).setOrigin(0, 0.5));
        howToPlayGroup.add(this.add.text(centerX - 400, controlsYAnchor + controlsMargin * 3, "O or left click to fire stream of bullets", config()["controlsStyle"]).setOrigin(0, 0.5));
        howToPlayGroup.add(this.add.text(centerX - 400, controlsYAnchor + controlsMargin * 4, "P or right click to fire blasts of bullets", config()["controlsStyle"]).setOrigin(0, 0.5));
        howToPlayGroup.add(this.add.text(centerX - 400, controlsYAnchor + controlsMargin * 5, "Q to Quickturn", config()["controlsStyle"]).setOrigin(0, 0.5));
        howToPlayGroup.add(this.add.text(centerX - 400, controlsYAnchor + controlsMargin * 6, "E to Boost", config()["controlsStyle"]).setOrigin(0, 0.5));
        howToPlayGroup.add(this.add.text(centerX - 400, controlsYAnchor + controlsMargin * 7, "Space to activate Bomb", config()["controlsStyle"]).setOrigin(0, 0.5));

        // Credits
        mainMenuGroup.add(this.add.text(this.game.renderer.width - 115, this.game.renderer.height - 40, "Music by Eric Matyas\nwww.soundimage.org",
                { ...config()["controlsStyle"], font: "20px Verdana" }).setOrigin(0.5));

        // Lifetime stats
        let lifetimeStats = getLifetimeStats();

        let statsMargin = 60;
        let statsAnchor = titleY + 50;
        lifetimeStatsGroup.add(this.add.text(centerX, titleY - 50, "Statistics", config()["titleStyle"]).setOrigin(0.5));
        lifetimeStatsGroup.add(this.add.text(centerX - 360, statsAnchor, "Time survived", { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(0, 0.5));
        lifetimeStatsGroup.add(this.add.text(centerX - 360, statsAnchor + statsMargin, "Average time survived", { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(0, 0.5));
        lifetimeStatsGroup.add(this.add.text(centerX - 360, statsAnchor + statsMargin * 2, "Gems collected", { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(0, 0.5));
        lifetimeStatsGroup.add(this.add.text(centerX - 360, statsAnchor + statsMargin * 3, "Enemies killed", { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(0, 0.5));
        lifetimeStatsGroup.add(this.add.text(centerX - 360, statsAnchor + statsMargin * 4, "Shots fired", { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(0, 0.5));
        lifetimeStatsGroup.add(this.add.text(centerX - 360, statsAnchor + statsMargin * 5, "Deaths", { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(0, 0.5));
        timeSurvivedText = this.add.text(centerX + 360, statsAnchor, lifetimeStats.score.toFixed(1), { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(1, 0.5);
        averageTimeSurvivedText = this.add.text(centerX + 360, statsAnchor + statsMargin, this.getAverageTimeSurvived(lifetimeStats).toFixed(1), { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(1, 0.5);
        gemsCollectedText = this.add.text(centerX + 360, statsAnchor + statsMargin * 2, lifetimeStats.gemsCollected.toString(), { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(1, 0.5);
        enemiesKilledText = this.add.text(centerX + 360, statsAnchor + statsMargin * 3, lifetimeStats.enemiesKilled.toString(), { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(1, 0.5);
        shotsFiredText = this.add.text(centerX + 360, statsAnchor + statsMargin * 4, lifetimeStats.shotsFired.toString(), { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(1, 0.5);
        deathsText = this.add.text(centerX + 360, statsAnchor + statsMargin * 5, lifetimeStats.deaths.toString(), { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(1, 0.5);
        lifetimeStatsGroup.add(timeSurvivedText);
        lifetimeStatsGroup.add(averageTimeSurvivedText);
        lifetimeStatsGroup.add(gemsCollectedText);
        lifetimeStatsGroup.add(enemiesKilledText);
        lifetimeStatsGroup.add(shotsFiredText);
        lifetimeStatsGroup.add(deathsText);

        lifetimeStatsGroup.setVisible(false);
        howToPlayGroup.setVisible(false);

        //For quicker testing - just skips the main menu scene and opens the game scene
        //this.handleButtonClick("playButton");
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
                // Back to the main menu from the stats or how to play menu
                mainMenuGroup.setVisible(true);
                howToPlayGroup.setVisible(false);
                lifetimeStatsGroup.setVisible(false);
                break;
            case "howToPlayButton":
                // Show how to play
                mainMenuGroup.setVisible(false);
                howToPlayGroup.setVisible(true);
                showHowToPlay = false;
                break;
            case "playButton":
                if (showHowToPlay) {
                    // Show how to play screen when playing for the first time
                    this.handleButtonClick("howToPlayButton");
                } else {
                    // Start game
                    this.scene.start("MainScene")
                            .start("MainUIScene")
                            .stop();
                }
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