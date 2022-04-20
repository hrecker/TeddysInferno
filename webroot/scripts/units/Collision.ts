import { Unit, takeDamage } from "../model/Units";

/** Should be used as an overlap callback, to handle when a unit hits another unit */
export function handleUnitHit(obj1: Phaser.Types.Physics.Arcade.ImageWithDynamicBody, obj2: Phaser.Types.Physics.Arcade.ImageWithDynamicBody) {
    if (obj1.name == "player" || obj2.name == "player") {
        this.destroyPlayer();
    }
}

/** Should be used as an overlap callback, to handle when a bullet hits a unit */
export function handleBulletHit(obj1: Phaser.Types.Physics.Arcade.ImageWithDynamicBody, obj2: Phaser.Types.Physics.Arcade.ImageWithDynamicBody) {
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
    } else {
        // If bullet isn't defined or has no id, it has already hit something. In that case,
        // don't damage the unit, so that one bullet can't hit multiple units
        //TODO this behavior may need to change for projectiles that pierce enemies
        return;
    }
    
    let unit: Unit = this.getUnit(hitUnit.getData("id"));
    takeDamage(this, unit, 1);
}
