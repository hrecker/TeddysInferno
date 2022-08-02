import { config } from "../model/Config";
import { Unit } from "../model/Units";
import { MainScene } from "../scenes/MainScene";
import { updateBombCount, updateGemCount, updateWeaponLevel } from "../state/UpgradeState";

let upgradeGemCountCache: { [upgradesComplete: number]: number } = {};

/** Update the health/max health of a given unit, and destroy it if health reaches zero. */
function updateHealth(scene: MainScene, unit: Unit, newHealth: number) {
    unit.health = newHealth;
    if (unit.health <= 0) {
        if (unit.name == "player") {
            scene.destroyPlayer();
        } else {
            scene.destroyUnitById(unit.id);
        }
    }
    return unit.health;
}

/** Cause the unit to take a certain amount of damage. Return unit health remaining. */
export function takeDamage(scene: MainScene, unit: Unit, damage: number): number {
    if (damage <= 0) {
        return unit.health;
    }
    return updateHealth(scene, unit, unit.health - damage);
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
    return getUpgradeThreshold(player.aiData["weaponLevel"] + player.aiData["bombsEarned"] - 1);
}

/** Get the gem threshold for the next upgrade */
function getNextUpgradeThreshold(player: Unit) {
    return getUpgradeThreshold(player.aiData["weaponLevel"] + player.aiData["bombsEarned"]);
}

/** Progress upgrades for player when collecting a gem */
function collectGemPlayer(player: Unit) {
    if (player.aiData["gemCount"] >= getNextUpgradeThreshold(player)) {
        if (player.aiData["weaponLevel"] < config()["weaponUpgradeThresholds"].length) {
            // Upgrade weapon
            player.aiData["weaponLevel"]++;
            updateWeaponLevel(player.aiData["weaponLevel"]);
        } else {
            // Add bomb
            player.aiData["bombCount"]++;
            player.aiData["bombsEarned"]++;
            updateBombCount(player.aiData["bombCount"]);
        }
    }
    updateGemCount(player.aiData["gemCount"], getPreviousUpgradeThreshold(player), getNextUpgradeThreshold(player));
}

/** Collect a powerup gem for a unit */
export function collectGem(unit: Unit, gem: Phaser.Types.Physics.Arcade.ImageWithDynamicBody, scene: MainScene) {
    if (!("gemCount" in unit.aiData)) {
        unit.aiData["gemCount"] = 0;
    }
    unit.aiData["gemCount"]++;
    if (unit.name == "player") {
        collectGemPlayer(unit);
    }
    scene.destroyGem(gem);
}

/** Get bullet damage for the player based on weapon level */
export function getBulletDamage(player: Unit) {
    return config()["weaponLevelValues"][player.aiData["weaponLevel"]]["bulletDamage"];
}

/** Get stream cooldown for the player */
export function getStreamCooldownMs(player: Unit) {
    return config()["weaponLevelValues"][player.aiData["weaponLevel"]]["streamCooldownMs"];
}

/** Get shotgun cooldown for the player */
export function getShotgunCooldownMs(player: Unit) {
    return config()["weaponLevelValues"][player.aiData["weaponLevel"]]["shotgunCooldownMs"];
}
