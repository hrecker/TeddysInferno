import { config } from "../model/Config";
import { Unit } from "../model/Units";
import { MainScene } from "../scenes/MainScene";

/** Update the health/max health of a given unit, and destroy it if health reaches zero. */
function updateHealth(scene: MainScene, unit: Unit, newHealth: number, newMaxHealth?: number) {
    unit.health = newHealth;
    if (newMaxHealth) {
        unit.maxHealth = newMaxHealth;
    }

    if (unit.health <= 0) {
        if (unit.name == "player") {
            scene.destroyPlayer();
        } else {
            scene.destroyUnitById(unit.id);
        }
    }
}

/** Cause the unit to take a certain amount of damage. */
export function takeDamage(scene: MainScene, unit: Unit, damage: number) {
    if (damage <= 0) {
        return;
    }
    updateHealth(scene, unit, unit.health - damage);
}

/** Collect a powerup gem for a unit */
export function collectGem(unit: Unit, gem: Phaser.Types.Physics.Arcade.ImageWithDynamicBody, scene: MainScene) {
    if (!("gemCount" in unit.aiData)) {
        unit.aiData["gemCount"] = 0;
    }
    unit.aiData["gemCount"]++;
    console.log("Gem count " + unit.name + ": " + unit.aiData["gemCount"]);
    
    if (unit.name == "player") {
        let weaponLevel = unit.aiData["weaponLevel"];
        let upgradeThresholds = config()["weaponUpgradeThresholds"];
        if (weaponLevel < upgradeThresholds.length && unit.aiData["gemCount"] >= config()["upgradeThresholds"][weaponLevel]) {
            unit.aiData["weaponLevel"]++;
            console.log("level up :" + unit.aiData["weaponLevel"]);
        }
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
