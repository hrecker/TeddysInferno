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

let titleText: Phaser.GameObjects.Text;
let tunnelShader: Phaser.GameObjects.Shader;

let playButton: Phaser.GameObjects.Image;
let howToPlayButton: Phaser.GameObjects.Image;
let statsButton: Phaser.GameObjects.Image;
let statsBackButton: Phaser.GameObjects.Image;
let howToPlayBackButton: Phaser.GameObjects.Image;
let howToPlayPlayButton: Phaser.GameObjects.Image;
let musicControlButton: Phaser.GameObjects.Image;
let sfxControlButton: Phaser.GameObjects.Image;

let howToPlayTitle: Phaser.GameObjects.Text;
let howToPlayTexts: Phaser.GameObjects.Text[];
let statsTitle: Phaser.GameObjects.Text;
let statsTexts: Phaser.GameObjects.Text[];
let controlsTitle: Phaser.GameObjects.Text;
let controlsTexts: Phaser.GameObjects.Text[];
let creditsText: Phaser.GameObjects.Text;

let howToPlayExamples: Phaser.GameObjects.Image[];

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

    /** Adjust any UI elements that need to change position based on the canvas size */
    resize(force?: boolean) {
        if (! this.scene.isActive() && ! force) {
            return;
        }

        console.log("Resizing! (" + this.game.renderer.width + ", " + this.game.renderer.height + ")");
        let centerX = this.game.renderer.width / 2;
        let centerY = this.game.renderer.height / 2;
        let titleY = this.game.renderer.height / 6;
        tunnelShader.setPosition(centerX, centerY);
        titleText.setPosition(centerX, titleY);

        // Buttons
        let buttonMargin = 100;
        let buttonYAnchor = titleY + buttonMargin + 50;
        playButton.setPosition(centerX, buttonYAnchor);
        howToPlayButton.setPosition(centerX, buttonYAnchor + buttonMargin);
        statsButton.setPosition(centerX, buttonYAnchor + buttonMargin * 2);
        statsBackButton.setPosition(centerX, buttonYAnchor + buttonMargin * 3 - 25);
        howToPlayBackButton.setPosition(centerX + 275, buttonYAnchor + buttonMargin * 3 - 25);
        howToPlayPlayButton.setPosition(centerX + 275, buttonYAnchor + buttonMargin * 2 - 25);
        
        // Audio control buttons
        musicControlButton.setPosition(5, this.game.renderer.height - 60);
        sfxControlButton.setPosition(5, this.game.renderer.height - 5);

        // How to play page
        let howToPlayMargin = 75;
        let howToPlayAnchor = titleY + 50;
        howToPlayTitle.setPosition(centerX, titleY - 50);
        for (let i = 0; i < howToPlayTexts.length; i++) {
            howToPlayTexts[i].setPosition(centerX, howToPlayAnchor + (i * howToPlayMargin));
        }
        
        // Example images
        howToPlayExamples[0].setPosition(centerX - 100, howToPlayAnchor + howToPlayMargin * 2 + 15);
        howToPlayExamples[1].setPosition(centerX, howToPlayAnchor + howToPlayMargin * 2 + 15);
        howToPlayExamples[2].setPosition(centerX + 100, howToPlayAnchor + howToPlayMargin * 2 + 15);

        // Controls
        let controlsMargin = 30;
        let controlsYAnchor = howToPlayAnchor + howToPlayMargin * 3 - 10;
        controlsTitle.setPosition(centerX - 400, controlsYAnchor - 5);
        for (let i = 0; i < controlsTexts.length; i++) {
            controlsTexts[i].setPosition(centerX - 400, controlsYAnchor + ((i + 1) * controlsMargin));
        }

        // Credits
        creditsText.setPosition(this.game.renderer.width - 115, this.game.renderer.height - 40);

        // Lifetime stats
        let statsMargin = 60;
        let statsAnchor = titleY + 50;
        statsTitle.setPosition(centerX, titleY - 50);
        for (let i = 0; i < statsTexts.length; i++) {
            statsTexts[i].setPosition(centerX - 360, statsAnchor + (i * statsMargin));
        }
        timeSurvivedText.setPosition(centerX + 360, statsAnchor);
        averageTimeSurvivedText.setPosition(centerX + 360, statsAnchor + statsMargin);
        gemsCollectedText.setPosition(centerX + 360, statsAnchor + statsMargin * 2);
        enemiesKilledText.setPosition(centerX + 360, statsAnchor + statsMargin * 3);
        shotsFiredText.setPosition(centerX + 360, statsAnchor + statsMargin * 4);
        deathsText.setPosition(centerX + 360, statsAnchor + statsMargin * 5);
    }

    create() {
        showHowToPlay = getGameResults().length == 0;

        mainMenuGroup = this.add.group();
        lifetimeStatsGroup = this.add.group();
        howToPlayGroup = this.add.group();

        tunnelShader = this.add.shader("Tunnel", 0, 0, 1, 1, ["shaderTexture"]);
        tunnelShader.setScale(config()["shaderWidth"], config()["shaderWidth"]);
        titleText = this.add.text(0, 0, "Teddy's Inferno", config()["titleStyle"]).setOrigin(0.5);
        mainMenuGroup.add(titleText);

        // Buttons
        playButton = this.add.image(0, 0, "playButton").setScale(1.5);
        howToPlayButton = this.add.image(0, 0, "howToPlayButton").setScale(1.5);
        statsButton = this.add.image(0, 0, "statsButton").setScale(1.5);
        statsBackButton = this.add.image(0, 0, "backButton").setScale(1.5);
        howToPlayBackButton = this.add.image(0, 0, "backButton").setScale(1.5);
        howToPlayPlayButton = this.add.image(0, 0, "playButton").setScale(1.5);
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
        musicControlButton = this.add.image(0, 0, this.getMusicButtonTexture()).setOrigin(0, 1);
        this.configureButton(musicControlButton, musicControlButtonName);
        sfxControlButton = this.add.image(0, 0, this.getSfxButtonTexture()).setOrigin(0, 1);
        this.configureButton(sfxControlButton, sfxControlButtonName);

        // How to play page
        howToPlayTitle = this.add.text(0, 0, "How To Play", config()["titleStyle"]).setOrigin(0.5);
        howToPlayTexts = [];
        howToPlayTexts.push(this.add.text(0, 0, "Survive as long as possible.", { ...config()["howToStyle"], font: "bold 40px Verdana" }).setOrigin(0.5));
        howToPlayTexts.push(this.add.text(0, 0, "Enemies drop Gems.\nCollect Gems to increase the speed of your weapon and earn Bombs.\nGems fly towards you when you stop firing your weapon.", config()["howToStyle"]).setOrigin(0.5));
        howToPlayGroup.add(howToPlayTitle);
        howToPlayTexts.forEach(text => {
            howToPlayGroup.add(text);
        });

        // Example images
        howToPlayExamples = [];
        howToPlayExamples.push(this.add.image(0, 0, "howToPlayExample1").setScale(0.5));
        howToPlayExamples.push(this.add.image(0, 0, "howToPlayExample2").setScale(0.5));
        howToPlayExamples.push(this.add.image(0, 0, "howToPlayExample3").setScale(0.5));
        howToPlayExamples.forEach(image => {
            howToPlayGroup.add(image);
        });

        controlsTitle = this.add.text(0, 0, "Controls:", { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(0, 0.5);
        controlsTexts = [];
        controlsTexts.push(this.add.text(0, 0, "W to activate thrust", config()["controlsStyle"]).setOrigin(0, 0.5));
        controlsTexts.push(this.add.text(0, 0, "A and D to turn left and right", config()["controlsStyle"]).setOrigin(0, 0.5));
        controlsTexts.push(this.add.text(0, 0, "Shift (hold) to turn slowly", config()["controlsStyle"]).setOrigin(0, 0.5));
        controlsTexts.push(this.add.text(0, 0, "O or Left Click to fire stream of bullets", config()["controlsStyle"]).setOrigin(0, 0.5));
        controlsTexts.push(this.add.text(0, 0, "P or Right Click to fire blasts of bullets", config()["controlsStyle"]).setOrigin(0, 0.5));
        controlsTexts.push(this.add.text(0, 0, "Q to Quickturn", config()["controlsStyle"]).setOrigin(0, 0.5));
        controlsTexts.push(this.add.text(0, 0, "E to Boost", config()["controlsStyle"]).setOrigin(0, 0.5));
        controlsTexts.push(this.add.text(0, 0, "Space to activate Bomb", config()["controlsStyle"]).setOrigin(0, 0.5));
        howToPlayGroup.add(controlsTitle);
        controlsTexts.forEach(text => {
            howToPlayGroup.add(text);
        });

        // Credits
        creditsText = this.add.text(0, 0, "Music by Eric Matyas\nwww.soundimage.org",
                { ...config()["controlsStyle"], font: "20px Verdana" }).setOrigin(0.5);
        mainMenuGroup.add(creditsText);

        // Lifetime stats
        let lifetimeStats = getLifetimeStats();

        statsTitle = this.add.text(0, 0, "Statistics", config()["titleStyle"]).setOrigin(0.5);
        statsTexts = [];
        statsTexts.push(this.add.text(0, 0, "Time survived", { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(0, 0.5));
        statsTexts.push(this.add.text(0, 0, "Average time survived", { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(0, 0.5));
        statsTexts.push(this.add.text(0, 0, "Gems collected", { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(0, 0.5));
        statsTexts.push(this.add.text(0, 0, "Enemies killed", { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(0, 0.5));
        statsTexts.push(this.add.text(0, 0, "Shots fired", { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(0, 0.5));
        statsTexts.push(this.add.text(0, 0, "Deaths", { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(0, 0.5));
        timeSurvivedText = this.add.text(0, 0, lifetimeStats.score.toFixed(1), { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(1, 0.5);
        averageTimeSurvivedText = this.add.text(0, 0, this.getAverageTimeSurvived(lifetimeStats).toFixed(1), { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(1, 0.5);
        gemsCollectedText = this.add.text(0, 0, lifetimeStats.gemsCollected.toString(), { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(1, 0.5);
        enemiesKilledText = this.add.text(0, 0, lifetimeStats.enemiesKilled.toString(), { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(1, 0.5);
        shotsFiredText = this.add.text(0, 0, lifetimeStats.shotsFired.toString(), { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(1, 0.5);
        deathsText = this.add.text(0, 0, lifetimeStats.deaths.toString(), { ...config()["controlsStyle"], font: "bold 40px Verdana" }).setOrigin(1, 0.5);
        lifetimeStatsGroup.add(statsTitle);
        statsTexts.forEach(text => {
            lifetimeStatsGroup.add(text);
        });
        lifetimeStatsGroup.add(timeSurvivedText);
        lifetimeStatsGroup.add(averageTimeSurvivedText);
        lifetimeStatsGroup.add(gemsCollectedText);
        lifetimeStatsGroup.add(enemiesKilledText);
        lifetimeStatsGroup.add(shotsFiredText);
        lifetimeStatsGroup.add(deathsText);

        lifetimeStatsGroup.setVisible(false);
        howToPlayGroup.setVisible(false);

        this.resize(true);
        this.scale.on("resize", this.resize, this);

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