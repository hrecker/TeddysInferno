import { config } from "../model/Config";
import { Unit } from "../model/Units";
import { MainScene } from "../scenes/MainScene";

/** Fire player weapon for one frame */
export function fireWeapon(scene: Phaser.Scene, physicsGroup: Phaser.Physics.Arcade.Group, delta: number, player: Unit, streamWeaponKeyDown: boolean, shotgunWeaponKeyDown: boolean) {
    if (player.cooldownRemainingMs > 0) {
        player.cooldownRemainingMs -= delta;
        return;
    }

    if (streamWeaponKeyDown) {
        createBullet(scene, physicsGroup, player.gameObj[0].body.center, randomBulletAngle(player.gameObj[0].rotation, config()["streamAngleSpread"]));
        player.cooldownRemainingMs = config()["streamCooldownMs"];
    } else if (shotgunWeaponKeyDown) {
        for (let i = 0; i < config()["shotgunBulletCount"]; i++) {
            createBullet(scene, physicsGroup, player.gameObj[0].body.center, randomBulletAngle(player.gameObj[0].rotation, config()["shotgunAngleSpread"]));
        }
        player.cooldownRemainingMs = config()["shotgunCooldownMs"];
    }
}

/** Get a random bullet angle for the shotgun */
function randomBulletAngle(base, spread) {
    return (Math.random() * spread - (spread / 2)) + base;
}

/** Create a bullet in the scene */
function createBullet(scene: Phaser.Scene, group: Phaser.Physics.Arcade.Group, position: Phaser.Math.Vector2, angle: number) {
    //TODO object pool for bullets rather than destroying them and creating new ones?
    let bullet = scene.physics.add.image(position.x, position.y, "bullet");
    group.add(bullet);
    bullet.setData("isBullet", true);
    bullet.body.setCircle(config()["bulletBodyRadius"]);
    let velocity = new Phaser.Math.Vector2(1, 0).rotate(angle).scale(config()["bulletSpeed"]);
    bullet.setVelocity(velocity.x, velocity.y);
    // Ensure bullets are eventually destroyed
    scene.time.delayedCall(config()["bulletLifetimeMs"], () => bullet.destroy());
    return bullet;
}

/** Create an explosion in the scene */
export function createExplosion(scene: Phaser.Scene, group: Phaser.Physics.Arcade.Group, position: Phaser.Math.Vector2) {
    //TODO object pool for explosions rather than destroying them and creating new ones?
    let explosion = scene.physics.add.image(position.x, position.y, "explosion");
    group.add(explosion);
    explosion.body.setCircle(config()["explosionBodyRadius"]);
    // Destroy explosion after delay
    scene.time.delayedCall(config()["explosionLifetimeMs"], () => explosion.destroy());
    return explosion;
}

/** Fire weapon for enemy unit for one frame */
export function fireEnemyWeapon(unit: Unit, player: Unit, scene: MainScene, delta: number) {
    switch (unit.name) {
        case "stealer1":
            fireGemStealerWeapon(unit, player, scene, delta);
            break;
    }
}

/** Fire gem stealer weapon when appropriate for one frame*/
export function fireGemStealerWeapon(stealerUnit: Unit, player: Unit, scene: MainScene, delta: number) {
    if (! ("gemCount" in stealerUnit.aiData) || stealerUnit.aiData["gemCount"] <= 0) {
        return;
    }

    if (! ("weaponCooldownRemainingMS" in stealerUnit.aiData)) {
        stealerUnit.aiData["weaponCooldownRemainingMS"] = stealerUnit.aiData["weaponDelayMs"];
        return;
    }

    if (stealerUnit.aiData["weaponCooldownRemainingMS"] > 0) {
        stealerUnit.aiData["weaponCooldownRemainingMS"] -= delta;
        return;
    }

    // Create flame projectile
    let flame = scene.physics.add.image(stealerUnit.gameObj[0].body.center.x, stealerUnit.gameObj[0].body.center.y, "flame");
    scene.getEnemyBulletsPhysicsGroup().add(flame);
    flame.setData("isBullet", true);
    flame.body.setOffset(config()["flameBodyOffset"]);
    flame.body.setCircle(config()["flameBodyRadius"]);
    // Fire flame towards player
    let velocity = player.gameObj[0].body.center.clone().subtract(stealerUnit.gameObj[0].body.center).normalize().scale(config()["flameSpeed"]);
    flame.setVelocity(velocity.x, velocity.y);
    // Ensure flames are eventually destroyed
    scene.time.delayedCall(config()["flameLifetimeMs"], () => flame.destroy());

    stealerUnit.aiData["weaponCooldownRemainingMS"] = stealerUnit.aiData["weaponDelayMs"];
    stealerUnit.aiData["gemCount"] -= 1;
    scene.getEnemyBulletsPhysicsGroup();
}