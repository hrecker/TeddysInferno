import { Ability, addAbilityListener, addBombCountListener, addGemCountListener,
         addPlayerDeathListener, addPlayerSpawnListener, addTimerListener, addWeaponLevelListener, clearListeners } from "../events/EventMessenger";
import { config } from "../model/Config";
import { playSound, SoundEffect } from "../model/Sound";
import { getGameResults, getLatestGameResult, getLatestGameResultIndex } from "../state/GameResultState";

let timerText: Phaser.GameObjects.Text;

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

const weaponUpgradeProgressColor = 0xB0EB93;
const bombProgressColor = 0xACCCE4;
let progressColor = weaponUpgradeProgressColor;

// Leaderboard UI
type LeaderboardRow = {
    seconds: Phaser.GameObjects.Text;
    gems: Phaser.GameObjects.Text;
    kills: Phaser.GameObjects.Text;
    shots: Phaser.GameObjects.Text;
};

let leaderboardTitle: Phaser.GameObjects.Text;
let leaderboardNumbers: Phaser.GameObjects.Text[];
let leaderboardRows: LeaderboardRow[];
const leaderboardColumnMargin = 50;
const defaultLeaderboardRowColor = "#FFF7E4";
const highlightLeaderboardRowColor = "#B0EB93";

// Currently selected button
let selectedButton: string;
let menuButton: Phaser.GameObjects.Image;
let retryButton: Phaser.GameObjects.Image;

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
            progressColor = bombProgressColor;
        }
    }

    /** Listen for the player changing bomb count */
    bombCountListener(bombCount: number, scene: MainUIScene) {
        bombCountText.setText("Bombs: " + bombCount);
    }

    playerSpawnListener(scene: MainUIScene) {
        levelProgress.clear();
        scene.setLeaderboardVisible(false);
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
        let maxRankWidth = leaderboardNumbers[0].width;
        let maxSecondsWidth = leaderboardRows[0].seconds.width;
        let maxGemsWidth = leaderboardRows[0].gems.width;
        let maxKillsWidth = leaderboardRows[0].kills.width;
        let maxShotsWidth = leaderboardRows[0].shots.width;
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
                        shotsFired: 0
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

        // Reposition the rows in the leaderboard
        let fullWidth = (leaderboardColumnMargin * 4) + maxRankWidth + maxSecondsWidth + maxGemsWidth + maxKillsWidth + maxShotsWidth + leaderboardNumbers[0].width;
        let maxX = (this.game.renderer.width / 2) + (fullWidth / 2);
        for (let i = 0; i < leaderboardRows.length; i++) {
            if (i < leaderboardNumbers.length) {
                leaderboardNumbers[i].setX((this.game.renderer.width / 2) - (fullWidth / 2));
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
                this.scene.stop();
                this.scene.stop("MainScene");
                this.scene.start("MenuScene");
                break;
            case "retry":
                // Restart game scene
                this.scene.get("MainScene").scene.restart();
                break;
        }
    }

    create() {
        timerText = this.add.text(this.game.renderer.width / 2, 40, "0.0", config()["timerFontStyle"]);
        timerText.setOrigin(0.5);
        timerText.alpha = 0.75;

        weaponLevelText = this.add.text(8, 40, "Level 1", config()["weaponUpgradeStatusFontStyle"]).setOrigin(0, 0.5).setAlpha(0.75);
        bombCountText = this.add.text(8, 80, "", config()["weaponUpgradeStatusFontStyle"]).setOrigin(0, 0.5).setAlpha(0.75);
        // Level progress outline
        levelProgressOutline = this.add.image(240, 40, "progressOutline");
        levelProgress = this.add.graphics();

        leaderboardTitle = this.add.text(this.game.renderer.width / 2, 95, "High Scores", config()["leaderboardTitleStyle"]).setOrigin(0.5);
        leaderboardNumbers = [];
        leaderboardRows = [];
        let labelRow = {
            seconds: this.add.text(0, 185, "Seconds", config()["leaderboardRowStyle"]).setOrigin(1, 1),
            gems: this.add.text(0, 185, "Gems", config()["leaderboardSmallRowStyle"]).setOrigin(1, 1),
            kills: this.add.text(0, 185, "Kills", config()["leaderboardSmallRowStyle"]).setOrigin(1, 1),
            shots: this.add.text(0, 185, "Shots", config()["leaderboardSmallRowStyle"]).setOrigin(1, 1),
        };
        leaderboardRows.push(labelRow);
        let y;
        // Add one row under leaderboard count to show result of most recent game
        for (let i = 0; i < config()["leaderboardCount"] + 1; i++) {
            y = 230 + (i * 55);
            leaderboardNumbers.push(this.add.text(this.game.renderer.width / 2, y, (i + 1).toString(), config()["leaderboardRowStyle"]).setOrigin(0, 1));
            leaderboardRows.push({
                seconds: this.add.text(0, y, "0.000", config()["leaderboardRowStyle"]).setOrigin(1, 1),
                gems: this.add.text(0, y, "0", config()["leaderboardSmallRowStyle"]).setOrigin(1, 1),
                kills: this.add.text(0, y, "0", config()["leaderboardSmallRowStyle"]).setOrigin(1, 1),
                shots: this.add.text(0, y, "0", config()["leaderboardSmallRowStyle"]).setOrigin(1, 1),
            });
        }
        menuButton = this.add.image(this.game.renderer.width / 2 - 120, y + 50, "menuButton");
        retryButton = this.add.image(this.game.renderer.width / 2 + 120, y + 50, "retryButton");
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
