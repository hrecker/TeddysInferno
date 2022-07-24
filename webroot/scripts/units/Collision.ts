import { config } from "../model/Config";
import { Unit } from "../model/Units";
import { collectGem, takeDamage } from "./Status";

/** Should be used as an overlap callback, to handle when a unit hits another unit */
export function handleUnitHit(obj1: Phaser.Types.Physics.Arcade.ImageWithDynamicBody, obj2: Phaser.Types.Physics.Arcade.ImageWithDynamicBody) {
    let enemyUnit: Unit;
    let playerUnit: Unit;
    if (obj1.name == "player") {
        playerUnit = this.getUnit(obj1.getData("id"));
        enemyUnit = this.getUnit(obj2.getData("id"));
    } else if (obj2.name == "player") {
        enemyUnit = this.getUnit(obj1.getData("id"));
        playerUnit = this.getUnit(obj2.getData("id"));
    }
    if (playerUnit && !enemyUnit.harmless && ! config()["invinciblePlayer"]) {
        // Enemies just do 1 damage - the player always has 1 health
        takeDamage(this, playerUnit, 1);
    }
}

/** Should be used as an overlap callback, to handle when a bullet hits a unit */
export function handleBulletHit(obj1: Phaser.Types.Physics.Arcade.ImageWithDynamicBody, obj2: Phaser.Types.Physics.Arcade.ImageWithDynamicBody) {
    let hitUnit = destroyBullet(obj1, obj2);
    // Bullets can only hit one enemy. If a bullet hits two enemies the second might be null here.
    if (hitUnit) {
        let unit: Unit = this.getUnit(hitUnit.getData("id"));
        takeDamage(this, unit, config()["bulletDamage"]);
    }
}

/** Should be used as an overlap callback, to handle when a bullet hits the player */
export function handleEnemyBulletHit(obj1: Phaser.Types.Physics.Arcade.ImageWithDynamicBody, obj2: Phaser.Types.Physics.Arcade.ImageWithDynamicBody) {
    let hitUnit = destroyBullet(obj1, obj2);
    if (hitUnit && hitUnit.name == "player" && ! config()["invinciblePlayer"]) {
        let unit: Unit = this.getUnit(hitUnit.getData("id"));
        // Enemy bullets just do 1 damage - the player always has 1 health
        takeDamage(this, unit, 1);
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

/** Handle powerup gem hitting player */
export function handleGemHit(obj1: Phaser.Types.Physics.Arcade.ImageWithDynamicBody, obj2: Phaser.Types.Physics.Arcade.ImageWithDynamicBody) {
    let gem: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
    let playerUnit: Unit;
    if (obj1.name == "player") {
        playerUnit = this.getUnit(obj1.getData("id"));
        gem = obj2;
    } else if (obj2.name == "player") {
        gem = obj1;
        playerUnit = this.getUnit(obj2.getData("id"));
    }
    if (playerUnit) {
        collectGem(playerUnit, gem, this);
    }
}
