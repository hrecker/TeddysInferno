import { bombCountEvent, gemCountEvent, weaponLevelEvent } from "../events/EventMessenger";
import { config } from "../model/Config";
import { playSound, SoundEffect } from "../model/Sound";
import { Unit } from "../model/Units";
import { MainScene } from "../scenes/MainScene";
import { flashSprite } from "../util/Util";

let upgradeGemCountCache: { [upgradesComplete: number]: number } = {};

/** Update the health/max health of a given unit, and destroy it if health reaches zero. */
function updateHealth(scene: MainScene, unit: Unit, newHealth: number) {
    unit.state.health = newHealth;
    if (unit.state.health <= 0) {
        if (unit.name == "player") {
            scene.destroyPlayer();
        } else {
            scene.destroyUnitById(unit.id);
        }
    }
    return unit.state.health;
}

/** Cause the unit to take a certain amount of damage. Return unit health remaining. */
export function takeDamage(scene: MainScene, unit: Unit, damage: number): number {
    if (damage <= 0) {
        return unit.state.health;
    }
    // If enemy survives the hit, flash the enemy sprite to indicate a hit
    unit.gameObj.forEach(obj => {
        flashSprite(obj, 50, scene);
    });
    return updateHealth(scene, unit, unit.state.health - damage);
}

/** Calculate the next threshold for earning a bomb for the player */
function calculateNextBombThreshold(bombsEarned) {
    return Math.floor(config()["baseGemsForBomb"] * Math.pow(config()["gemsForBombGrowthRate"], bombsEarned));
}

/** Get the gem threshold for the next upgrade for a given upgrade count */
function getUpgradeThreshold(upgradeCount: number) {
    if (upgradeCount in upgradeGemCountCache) {
        return upgradeGemCountCache[upgradeCount];
    }
    let threshold = 0;
    if (upgradeCount >= 0) {
        let upgradeThresholds = config()["weaponUpgradeThresholds"];
        if (upgradeCount < upgradeThresholds.length) {
            threshold = upgradeThresholds[upgradeCount];
        } else {
            threshold = getUpgradeThreshold(upgradeCount - 1) + calculateNextBombThreshold(upgradeCount - upgradeThresholds.length);
        }
    }
    upgradeGemCountCache[upgradeCount] = threshold;
    return threshold;
}

/** Get the gem threshold for the previous upgrade */
function getPreviousUpgradeThreshold(player: Unit) {
    return getUpgradeThreshold(player.state.weaponLevel + player.state.bombsEarned - 1);
}

/** Get the gem threshold for the next upgrade */
function getNextUpgradeThreshold(player: Unit) {
    return getUpgradeThreshold(player.state.weaponLevel + player.state.bombsEarned);
}

/** Progress upgrades for player when collecting a gem */
function collectGemPlayer(player: Unit, scene: MainScene) {
    if (player.state.gemCount >= getNextUpgradeThreshold(player)) {
        if (player.state.weaponLevel < config()["weaponUpgradeThresholds"].length) {
            // Upgrade weapon
            player.state.weaponLevel++;
            weaponLevelEvent(player.state.weaponLevel);
            scene.explodeParticlesColor(parseInt(config()["weaponUpgradeProgressColor"], 16), player.gameObj[0].body.center, 100);
        } else {
            // Add bomb
            player.state.bombCount++;
            player.state.bombsEarned++;
            bombCountEvent(player.state.bombCount);
            scene.explodeParticlesColor(parseInt(config()["bombProgressColor"], 16), player.gameObj[0].body.center, 50);
        }
        // Common effects for bomb and level ups
        playSound(scene, SoundEffect.LevelUp);
        flashSprite(player.gameObj[0], 100, scene);
    }
    gemCountEvent(player.state.gemCount, getPreviousUpgradeThreshold(player), getNextUpgradeThreshold(player));
}

/** Collect a powerup gem for a unit */
export function collectGem(unit: Unit, gem: Phaser.Types.Physics.Arcade.ImageWithDynamicBody, scene: MainScene) {
    unit.state.gemCount++;
    let collectedByPlayer = false;
    if (unit.name == "player") {
        collectGemPlayer(unit, scene);
        collectedByPlayer = true;
    }
    //TODO different sound when enemy collects?
    playSound(scene, SoundEffect.GemCollect);
    scene.gemParticles(gem.body.center);
    scene.destroyGem(gem, collectedByPlayer);
}

/** Get bullet damage for the player based on weapon level */
export function getBulletDamage(player: Unit) {
    return config()["weaponLevelValues"][player.state.weaponLevel]["bulletDamage"];
}

/** Get stream cooldown for the player */
export function getStreamCooldownMs(player: Unit) {
    return config()["weaponLevelValues"][player.state.weaponLevel]["streamCooldownMs"];
}

/** Get shotgun cooldown for the player */
export function getShotgunCooldownMs(player: Unit) {
    return config()["weaponLevelValues"][player.state.weaponLevel]["shotgunCooldownMs"];
}
