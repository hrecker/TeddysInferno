import { getNewId } from "../state/IdState";
import { config } from "./Config";

/** Create a powerup gem */
export function createGem(location: Phaser.Types.Math.Vector2Like, scene: Phaser.Scene): Phaser.Types.Physics.Arcade.ImageWithDynamicBody {
    let gemId = getNewId();
    let unitImage = scene.physics.add.image(location.x, location.y, "gem");
    unitImage.setData("id", gemId);
    unitImage.setName("gem");
    unitImage.setDrag(config()["gemDrag"]);
    return unitImage;
}
