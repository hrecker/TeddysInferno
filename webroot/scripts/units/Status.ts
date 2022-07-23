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
