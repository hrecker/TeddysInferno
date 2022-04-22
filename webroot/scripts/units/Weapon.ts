import { Unit } from "../model/Units";

const bulletSpeed = 1000;
const bulletLifetimeMs = 3000;

const streamAngleRange = [-0.05, 0.05];
const shotgunAngleRange = [-0.15, 0.15];

const streamCooldownMs = 100;
const shotgunCooldownMs = 500;

export function fireWeapon(scene: Phaser.Scene, physicsGroup: Phaser.Physics.Arcade.Group, delta: number, player: Unit, streamWeaponKeyDown: boolean, shotgunWeaponKeyDown: boolean) {
    if (player.cooldownRemainingMs > 0) {
        player.cooldownRemainingMs -= delta;
        return;
    }

    if (streamWeaponKeyDown) {
        createBullet(scene, physicsGroup, player.gameObj[0].body.center, randomBulletAngle(player.gameObj[0].rotation, streamAngleRange));
        player.cooldownRemainingMs = streamCooldownMs;
    } else if (shotgunWeaponKeyDown) {
        for (let i = 0; i < 5; i++) {
            createBullet(scene, physicsGroup, player.gameObj[0].body.center, randomBulletAngle(player.gameObj[0].rotation, shotgunAngleRange));
        }
        player.cooldownRemainingMs = shotgunCooldownMs;
    }
}

function randomBulletAngle(base, range) {
    return (Math.random() * (range[1] - range[0]) + range[0]) + base;
}

function createBullet(scene: Phaser.Scene, group: Phaser.Physics.Arcade.Group, position: Phaser.Math.Vector2, angle: number) {
    //TODO object pool for bullets rather than destroying them and creating new ones?
    let bullet = scene.physics.add.image(position.x, position.y, "bullet");
    group.add(bullet);
    bullet.setData("isBullet", true);
    bullet.body.setCircle(6);
    let velocity = new Phaser.Math.Vector2(1, 0).rotate(angle).scale(bulletSpeed);
    bullet.setVelocity(velocity.x, velocity.y);
    // Ensure bullets are eventually destroyed
    scene.time.delayedCall(bulletLifetimeMs, () => bullet.destroy());
    return bullet;
}