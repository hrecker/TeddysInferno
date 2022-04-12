import { Unit, takeDamage } from "../model/Units";


/** Should be used as an overlap callback, to handle when a unit hits another unit */
export function handleUnitHit(obj1: Phaser.Types.Physics.Arcade.ImageWithDynamicBody, obj2: Phaser.Types.Physics.Arcade.ImageWithDynamicBody) {
    let unit1: Unit = this.getUnit(obj1.getData("id"));
    let unit2: Unit = this.getUnit(obj2.getData("id"));

    // When the player is overlapping multiple enemy units and is destroyed before the last one,
    // in the subsequent overlap calls it can be null.
    if (!unit1 || !unit2) {
        return;
    }

    let player = unit1;
    let other = unit2;
    if (unit2.name == "player") {
        player = unit2;
        other = unit1;
    }

    takeDamage(player, 1);
}
