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

/** Collect a powerup gem for the player */
export function collectGem(player: Unit, gem: Phaser.Types.Physics.Arcade.ImageWithDynamicBody, scene: MainScene) {
    if (!("gemCount" in player.aiData)) {
        player.aiData["gemCount"] = 0;
    }
    player.aiData["gemCount"]++;
    console.log("Gem count: " + player.aiData["gemCount"]);
    //TODO actual powerups
    scene.destroyGem(gem);
}
