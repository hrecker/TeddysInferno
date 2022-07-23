import { Unit } from "../model/Units";
import { takeDamage } from "./Status";

/** Should be used as an overlap callback, to handle when a unit hits another unit */
export function handleUnitHit(obj1: Phaser.Types.Physics.Arcade.ImageWithDynamicBody, obj2: Phaser.Types.Physics.Arcade.ImageWithDynamicBody) {
    let enemyUnit: Unit;
    let playerObj;
    if (obj1.name == "player") {
        playerObj = obj1;
        enemyUnit = this.getUnit(obj2.getData("id"));
    } else if (obj2.name == "player") {
        playerObj = obj2;
        enemyUnit = this.getUnit(obj1.getData("id"));
    }
    if (playerObj && !enemyUnit.harmless) {
        this.destroyPlayer();
    }
}

/** Should be used as an overlap callback, to handle when a bullet hits a unit */
export function handleBulletHit(obj1: Phaser.Types.Physics.Arcade.ImageWithDynamicBody, obj2: Phaser.Types.Physics.Arcade.ImageWithDynamicBody) {
    let hitUnit = destroyBullet(obj1, obj2);
    // Bullets can only hit one enemy. If a bullet hits two enemies the second might be null here.
    if (hitUnit) {
        let unit: Unit = this.getUnit(hitUnit.getData("id"));
        takeDamage(this, unit, 1);
    }
}

/** Should be used as an overlap callback, to handle when a bullet hits the player */
export function handleEnemyBulletHit(obj1: Phaser.Types.Physics.Arcade.ImageWithDynamicBody, obj2: Phaser.Types.Physics.Arcade.ImageWithDynamicBody) {
    destroyBullet(obj1, obj2);
    if (obj1.name == "player" || obj2.name == "player") {
        this.destroyPlayer();
    }
}

/** Destroy which of the two objects has isBullet set to true. Return the unit that was hit. */
function destroyBullet(obj1: Phaser.Types.Physics.Arcade.ImageWithDynamicBody,
                       obj2: Phaser.Types.Physics.Arcade.ImageWithDynamicBody): Phaser.Types.Physics.Arcade.ImageWithDynamicBody {
    let bullet: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
    let hitUnit: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
    if (obj1.getData("isBullet")) {
        bullet = obj1;
        hitUnit = obj2;
    } else if (obj2.getData("isBullet")) {
        bullet = obj2;
        hitUnit = obj1;
    }
    if (bullet) {
        bullet.destroy();
    }
    // If bullet isn't defined or has no id, it has already hit something. In that case,
    // don't damage the unit, so that one bullet can't hit multiple units
    return hitUnit;
}
