import { Ability, addAbilityListener, addBombCountListener, addGemCountListener,
         addPlayerDeathListener, addPlayerSpawnListener, addTimerListener, addWeaponLevelListener, clearListeners } from "../events/EventMessenger";
import { config } from "../model/Config";
import { getSound, playSound, SoundEffect } from "../model/Sound";
import { Challenge, getChallengeDisplayName, getCurrentChallenge } from "../state/ChallengeState";
import { getGameResults, getLatestGameResult, getLatestGameResultIndex } from "../state/GameResultState";
import { getStartingBombCount } from "../units/UnitStatus";

let timerText: Phaser.GameObjects.BitmapText;

// Ability icons and masks for cooldown
let boostIcon: Phaser.GameObjects.Image;
let quickTurnIcon: Phaser.GameObjects.Image;
let boostIconMask: Phaser.GameObjects.Graphics;
let quickTurnIconMask: Phaser.GameObjects.Graphics;

// Upgrade UI
let levelProgressOutline: Phaser.GameObjects.Image;
let levelProgress: Phaser.GameObjects.Graphics;
let weaponLevelText: Phaser.GameObjects.Text;
let bombCountText: Phaser.GameObjects.Text;
let progressColor: number;

// Leaderboard UI
type LeaderboardRow = {
    seconds: Phaser.GameObjects.Text;
    gems: Phaser.GameObjects.Text;
    kills: Phaser.GameObjects.Text;
    shots: Phaser.GameObjects.Text;
};

let leaderboardTitle: Phaser.GameObjects.Text;
let challengeLabel: Phaser.GameObjects.Text;
let leaderboardNumbers: Phaser.GameObjects.Text[];
let leaderboardRows: LeaderboardRow[];
const leaderboardColumnMargin = 50;
const defaultLeaderboardRowColor = "#FFF7E4";
const highlightLeaderboardRowColor = "#B0EB93";

let maxRankWidth: number;
let maxSecondsWidth: number;
let maxGemsWidth: number;
let maxKillsWidth: number;
let maxShotsWidth: number;

let buttonY: number;

// Currently selected button
let selectedButton: string;
let menuButton: Phaser.GameObjects.Image;
let retryButton: Phaser.GameObjects.Image;

let retryKey: Phaser.Input.Keyboard.Key;
let isRetryStarted = false;

/** UI displayed over MainScene */
export class MainUIScene extends Phaser.Scene {
    constructor() {
        super({
            key: "MainUIScene"
        });
    }

    /** Update the text of the timer */
    setTimerText(text) {
        if (timerText && timerText.text !== text) {
            timerText.setText(text);
        }
    }

    /** Listen for updates to the game timer and update the text of the timer */
    timerListener(timer: number, scene: MainUIScene) {
        scene.setTimerText((Math.round(timer / 100.0) / 10).toFixed(1));
    }

    /** Listen for the player using their abilities */
    abilityListener(ability: Ability, cooldownMs: number, scene: MainUIScene) {
        switch (ability) {
            case Ability.Boost:
                scene.startCooldownTween(boostIcon, boostIconMask, cooldownMs);
                break;
            case Ability.QuickTurn:
                scene.startCooldownTween(quickTurnIcon, quickTurnIconMask, cooldownMs);
                break;
        }
    }

    /** Listen for the player gaining gems */
    gemCountListener(gemCount: number, previousThreshold: number, nextThreshold: number, scene: MainUIScene) {
        levelProgress.clear();
        levelProgress.fillStyle(progressColor);
        let rectWidth = (levelProgressOutline.width - 8) * ((gemCount - previousThreshold) / (nextThreshold - previousThreshold));
        levelProgress.fillRect(levelProgressOutline.getTopLeft().x + 4, levelProgressOutline.getTopLeft().y + 5, rectWidth, levelProgressOutline.height - 10);
    }

    /** Listen for the player increasing weapon level */
    weaponLevelListener(weaponLevel: number, scene: MainUIScene) {
        // Weapon level is 0-indexed, but we should display the base level as level 1
        weaponLevelText.setText("Level " + (weaponLevel + 1));
        if (weaponLevel == config()["weaponUpgradeThresholds"].length) {
            // Max level
            progressColor = parseInt(config()["bombProgressColor"], 16);
        }
    }

    /** Listen for the player changing bomb count */
    bombCountListener(bombCount: number, scene: MainUIScene) {
        bombCountText.setText("Bombs: " + bombCount);
    }

    playerSpawnListener(scene: MainUIScene) {
        levelProgress.clear();
        scene.setLeaderboardVisible(false);
        isRetryStarted = false;
    }

    playerDeathListener(scene: MainUIScene) {
        scene.updateLeaderboard();
        scene.setLeaderboardVisible(true);
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

    /** Update leaderboard with player highscores */
    updateLeaderboard() {
        let gameResults = getGameResults();
        let highlightIndex = getLatestGameResultIndex();
        // Update the rows in the leaderboard with the current high scores
        maxRankWidth = leaderboardNumbers[0].width;
        maxSecondsWidth = leaderboardRows[0].seconds.width;
        maxGemsWidth = leaderboardRows[0].gems.width;
        maxKillsWidth = leaderboardRows[0].kills.width;
        maxShotsWidth = leaderboardRows[0].shots.width;
        for (let i = 0; (i + 1) < leaderboardRows.length && i < gameResults.length; i++) {
            let gameResult = gameResults[i];
            // Last row is reserved for result from most recent game
            if (i == leaderboardRows.length - 2) {
                // If the score from the most recent game is outside of the top few, show it as an additional row at the bottom
                if (highlightIndex == -1 || highlightIndex >= leaderboardRows.length - 2) {
                    gameResult = getLatestGameResult();
                    if (highlightIndex == -1) {
                        leaderboardNumbers[i].setText(config()["maxGamesStored"] + "+");
                    } else {
                        leaderboardNumbers[i].setText((highlightIndex + 1).toString());
                    }
                    highlightIndex = i;
                } else {
                    // Otherwise just set it as a 0 second result
                    gameResult = {
                        score: 0,
                        gemsCollected: 0,
                        enemiesKilled: 0,
                        shotsFired: 0,
                        deaths: 0
                    };
                }
            }
            leaderboardRows[i + 1].seconds.setText(gameResult.score.toFixed(3));
            leaderboardRows[i + 1].gems.setText(gameResult.gemsCollected.toString());
            leaderboardRows[i + 1].kills.setText(gameResult.enemiesKilled.toString());
            leaderboardRows[i + 1].shots.setText(gameResult.shotsFired.toString());
            maxRankWidth = Math.max(maxRankWidth, leaderboardNumbers[i].width);
            maxSecondsWidth = Math.max(maxSecondsWidth, leaderboardRows[i + 1].seconds.width);
            maxGemsWidth = Math.max(maxGemsWidth, leaderboardRows[i + 1].gems.width);
            maxKillsWidth = Math.max(maxKillsWidth, leaderboardRows[i + 1].kills.width);
            maxShotsWidth = Math.max(maxShotsWidth, leaderboardRows[i + 1].shots.width);
            if (i == highlightIndex) {
                leaderboardNumbers[i].setColor(highlightLeaderboardRowColor);
                leaderboardRows[i + 1].seconds.setColor(highlightLeaderboardRowColor);
                leaderboardRows[i + 1].gems.setColor(highlightLeaderboardRowColor);
                leaderboardRows[i + 1].kills.setColor(highlightLeaderboardRowColor);
                leaderboardRows[i + 1].shots.setColor(highlightLeaderboardRowColor);
            } else {
                leaderboardNumbers[i].setColor(defaultLeaderboardRowColor);
                leaderboardRows[i + 1].seconds.setColor(defaultLeaderboardRowColor);
                leaderboardRows[i + 1].gems.setColor(defaultLeaderboardRowColor);
                leaderboardRows[i + 1].kills.setColor(defaultLeaderboardRowColor);
                leaderboardRows[i + 1].shots.setColor(defaultLeaderboardRowColor);
            }
        }

        this.repositionLeaderboard();
    }

    /** Reposition the rows in the leaderboard (either due to change in canvas size or change in the contents of the rows) */
    repositionLeaderboard() {
        let leaderboardFullWidth = (leaderboardColumnMargin * 4) + maxRankWidth + maxSecondsWidth + maxGemsWidth + maxKillsWidth + maxShotsWidth + leaderboardNumbers[0].width;
        let maxX = (this.game.renderer.width / 2) + (leaderboardFullWidth / 2);
        for (let i = 0; i < leaderboardRows.length; i++) {
            if (i < leaderboardNumbers.length) {
                leaderboardNumbers[i].setX((this.game.renderer.width / 2) - (leaderboardFullWidth / 2));
            }
            leaderboardRows[i].seconds.setX(maxX - maxShotsWidth - maxKillsWidth - maxGemsWidth - (3 * leaderboardColumnMargin));
            leaderboardRows[i].gems.setX(maxX - maxShotsWidth - maxKillsWidth - (2 * leaderboardColumnMargin));
            leaderboardRows[i].kills.setX(maxX - maxShotsWidth - leaderboardColumnMargin);
            leaderboardRows[i].shots.setX(maxX);
        }
    }

    setLeaderboardVisible(isVisible: boolean) {
        if (! leaderboardTitle || ! leaderboardRows || ! leaderboardNumbers) {
            return;
        }
        leaderboardTitle.setVisible(isVisible);
        if (challengeLabel) {
            challengeLabel.setVisible(isVisible);
        }
        this.setRowVisible(leaderboardRows[0], isVisible);
        for (let i = 1; i < leaderboardRows.length; i++) {
            // Don't show 0 second scores
            if (leaderboardRows[i].seconds.text == "0.000") {
                this.setRowVisible(leaderboardRows[i], false);
                leaderboardNumbers[i - 1].setVisible(false);
            } else {
                this.setRowVisible(leaderboardRows[i], isVisible);
                leaderboardNumbers[i - 1].setVisible(isVisible);
            }
        }
        menuButton.setVisible(isVisible);
        retryButton.setVisible(isVisible);
    }

    setRowVisible(row: LeaderboardRow, isVisible: boolean) {
        row.seconds.setVisible(isVisible);
        row.gems.setVisible(isVisible);
        row.kills.setVisible(isVisible);
        row.shots.setVisible(isVisible);
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
            playSound(this, SoundEffect.ButtonClick);
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
            case "menu":
                // Back to the main menu
                clearListeners();
                // Stop the stealer sound if it's active
                getSound(SoundEffect.StealerActive).stop();
                this.scene.stop();
                this.scene.stop("MainScene");
                this.scene.start("MenuScene");
                break;
            case "retry":
                // Restart game scene
                this.retry();
                break;
        }
    }

    retry() {
        if (! isRetryStarted) {
            this.scene.get("MainScene").scene.restart();
            this.resetUIElements();
            isRetryStarted = true;
        }
    }

    resetUIElements() {
        progressColor = parseInt(config()["weaponUpgradeProgressColor"], 16);
        weaponLevelText.setText("Level 1");
    }

    /** Adjust any UI elements that need to change position based on the canvas size */
    resize(force?: boolean) {
        if (! this.scene.isActive() && ! force) {
            return;
        }
        
        timerText.setPosition(this.game.renderer.width / 2, 32);
        leaderboardTitle.setPosition(this.game.renderer.width / 2, 95);
        if (challengeLabel) {
            challengeLabel.setX(this.game.renderer.width / 2);
        }
        menuButton.setPosition(this.game.renderer.width / 2 - 120, buttonY);
        retryButton.setPosition(this.game.renderer.width / 2 + 120, buttonY);
        if (getCurrentChallenge() != Challenge.TwinStick) {
            quickTurnIcon.setPosition(this.game.renderer.width - 112, 40);
            quickTurnIconMask.clear();
            quickTurnIconMask.fillStyle(0xffffff).fillRect(this.game.renderer.width - 144, 8, 64, 64);
        }
        boostIcon.setPosition(this.game.renderer.width - 40, 40);
        boostIconMask.clear();
        boostIconMask.fillStyle(0xffffff).fillRect(this.game.renderer.width - 72, 8, 64, 64);
        this.repositionLeaderboard();
    }

    create() {
        timerText = this.add.bitmapText(0, 0, "timerFont", "0.0", 48).setTintFill(0xFFF7E4);
        timerText.setOrigin(0.5);
        timerText.alpha = 0.75;
        progressColor = parseInt(config()["weaponUpgradeProgressColor"], 16);

        weaponLevelText = this.add.text(8, 40, "Level 1", config()["weaponUpgradeStatusFontStyle"]).setOrigin(0, 0.5).setAlpha(0.75);
        bombCountText = this.add.text(8, 80, "Bombs: " + getStartingBombCount(), config()["weaponUpgradeStatusFontStyle"]).setOrigin(0, 0.5).setAlpha(0.75);
        // Level progress outline
        levelProgressOutline = this.add.image(240, 40, "progressOutline").setAlpha(0.75);
        levelProgress = this.add.graphics().setAlpha(0.75);

        leaderboardTitle = this.add.text(0, 0, "High Scores", config()["leaderboardTitleStyle"]).setOrigin(0.5);
        
        let leaderboardBaseY = 185;
        if (getCurrentChallenge() != Challenge.MainGame) {
            challengeLabel = this.add.text(0, 160, "Challenge: " + getChallengeDisplayName(getCurrentChallenge()),
                config()["weaponUpgradeStatusFontStyle"]).setOrigin(0.5);
            leaderboardBaseY += 40;
        }

        leaderboardNumbers = [];
        leaderboardRows = [];
        let labelRow = {
            seconds: this.add.text(0, leaderboardBaseY, "Seconds", config()["leaderboardRowStyle"]).setOrigin(1, 1),
            gems: this.add.text(0, leaderboardBaseY, "Gems", config()["leaderboardSmallRowStyle"]).setOrigin(1, 1),
            kills: this.add.text(0, leaderboardBaseY, "Kills", config()["leaderboardSmallRowStyle"]).setOrigin(1, 1),
            shots: this.add.text(0, leaderboardBaseY, "Shots", config()["leaderboardSmallRowStyle"]).setOrigin(1, 1),
        };
        leaderboardRows.push(labelRow);
        let y;
        // Add one row under leaderboard count to show result of most recent game
        for (let i = 0; i < config()["leaderboardCount"] + 1; i++) {
            y = leaderboardBaseY + 45 + (i * 55);
            leaderboardNumbers.push(this.add.text(0, y, (i + 1).toString(), config()["leaderboardRowStyle"]).setOrigin(0, 1));
            leaderboardRows.push({
                seconds: this.add.text(0, y, "0.000", config()["leaderboardRowStyle"]).setOrigin(1, 1),
                gems: this.add.text(0, y, "0", config()["leaderboardSmallRowStyle"]).setOrigin(1, 1),
                kills: this.add.text(0, y, "0", config()["leaderboardSmallRowStyle"]).setOrigin(1, 1),
                shots: this.add.text(0, y, "0", config()["leaderboardSmallRowStyle"]).setOrigin(1, 1),
            });
        }
        buttonY = y + 40;
        menuButton = this.add.image(0, buttonY, "menuButton");
        retryButton = this.add.image(0, buttonY, "retryButton");
        this.configureButton(menuButton, "menu", "menuButton", "menuButtonDown");
        this.configureButton(retryButton, "retry", "retryButton", "retryButtonDown");
        this.setLeaderboardVisible(false);

        addTimerListener(this.timerListener, this);
        addAbilityListener(this.abilityListener, this);
        addGemCountListener(this.gemCountListener, this);
        addWeaponLevelListener(this.weaponLevelListener, this);
        addBombCountListener(this.bombCountListener, this);
        addPlayerSpawnListener(this.playerSpawnListener, this);
        addPlayerDeathListener(this.playerDeathListener, this);

        boostIcon = this.add.image(0, 0, "boostIcon").setAlpha(0.8);
        boostIconMask = this.add.graphics().setVisible(false).setAlpha(0.8);
        boostIcon.setMask(boostIconMask.createGeometryMask());

        if (getCurrentChallenge() != Challenge.TwinStick) {
            quickTurnIcon = this.add.image(0, 0, "quickTurnIcon").setAlpha(0.8);
            quickTurnIconMask = this.add.graphics().setVisible(false).setAlpha(0.8);
            quickTurnIcon.setMask(quickTurnIconMask.createGeometryMask());
        }

        retryKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        
        this.resize(true);
        this.scale.on("resize", this.resize, this);
    }

    update() {
        if (retryButton.visible && retryKey.isDown) {
            this.retry();
        }
    }
}
