import { MainScene } from "../scenes/MainScene";
import { getNewId } from "../state/IdState";
import { config } from "./Config";

/** Create a powerup gem */
export function createGem(location: Phaser.Types.Math.Vector2Like, scene: MainScene): Phaser.Types.Physics.Arcade.ImageWithDynamicBody {
    let gemId = getNewId();
    let gemImage = scene.physics.add.image(location.x, location.y, "gem");
    gemImage.setData("id", gemId);
    gemImage.setName("gem");
    gemImage.setDrag(config()["gemDrag"]);

    // Start flashing after a time to indicate the gem will disappear soon
    scene.time.delayedCall(config()["gemFlashStartMs"], () => {
        scene.tweens.add({
            targets: gemImage,
            alpha: {
                from: 1,
                to: 0.1
            },
            duration: 400,
            yoyo: true,
            loop: 100,
        });
    });
    // Destroy the gem after a set time
    scene.time.delayedCall(config()["gemLifetimeMs"], () => {
        scene.destroyGem(gemImage);
    });

    return gemImage;
}
