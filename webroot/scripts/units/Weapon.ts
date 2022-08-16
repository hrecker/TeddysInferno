import { bombCountEvent } from "../events/EventMessenger";
import { config } from "../model/Config";
import { Unit } from "../model/Units";
import { MainScene } from "../scenes/MainScene";
import { getStreamCooldownMs, getShotgunCooldownMs, takeDamage } from "./UnitStatus";

/** Fire player weapon for one frame. Return the number of bullets fired this frame. */
export function fireWeapon(scene: Phaser.Scene, physicsGroup: Phaser.Physics.Arcade.Group, delta: number, player: Unit, streamWeaponKeyDown: boolean, shotgunWeaponKeyDown: boolean): number {
    if (player.state.weaponCooldownRemainingMs > 0) {
        player.state.weaponCooldownRemainingMs -= delta;
        return 0;
    }

    if (streamWeaponKeyDown) {
        let spawnPos = getBulletSpawnPos(player);
        createBullet(scene, physicsGroup, spawnPos, randomBulletAngle(player.gameObj[0].rotation, config()["streamAngleSpread"]));
        player.state.weaponCooldownRemainingMs = getStreamCooldownMs(player);
        return 1;
    } else if (shotgunWeaponKeyDown) {
        let spawnPos = getBulletSpawnPos(player);
        for (let i = 0; i < config()["shotgunBulletCount"]; i++) {
            createBullet(scene, physicsGroup, spawnPos, randomBulletAngle(player.gameObj[0].rotation, config()["shotgunAngleSpread"]));
        }
        player.state.weaponCooldownRemainingMs = getShotgunCooldownMs(player);
        return config()["shotgunBulletCount"];
    }
    return 0;
}

/** Activate player bomb for one frame. Return true if bomb was activated this frame. */
export function activateBomb(scene: MainScene, delta: number, player: Unit, bombKeyDown: boolean): boolean {
    if (player.state.bombCooldownRemainingMs > 0) {
        player.state.bombCooldownRemainingMs -= delta;
        return false;
    }
    if (bombKeyDown && player.state.bombCount > 0) {
        // Activate bomb, repelling and damaging all units in the scene
        scene.getEnemyUnits().forEach(unit => {
            let health = takeDamage(scene, unit, config()["bombDamage"]);
            if (health > 0 && unit.maxSpeed > 0) {
                // Repel unit
                let repelVelocity = unit.gameObj[0].body.center.clone().subtract(player.gameObj[0].body.center).normalize().scale(config()["bombRepelSpeed"]);
                unit.gameObj[0].setVelocity(repelVelocity.x, repelVelocity.y);
                unit.gameObj[0].setAcceleration(0);
            }
        });
        player.state.bombCooldownRemainingMs = config()["bombCooldownMs"];
        player.state.bombCount--;
        bombCountEvent(player.state.bombCount);
        return true;
    }
    return false;
}

/** Get the spawn position for a bullet fired by a unit */
function getBulletSpawnPos(unit: Unit) {
    return unit.gameObj[0].body.center.clone().add(Phaser.Math.Vector2.RIGHT.clone().rotate(unit.gameObj[0].rotation).scale(unit.gameObj[0].width / 2));
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
    explosion.setData("isBullet", true);
    explosion.setData("noDestroyOnHit", true);
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
    if (stealerUnit.state.gemCount <= 0) {
        return;
    }

    if (stealerUnit.state.weaponCooldownRemainingMs > 0) {
        stealerUnit.state.weaponCooldownRemainingMs -= delta;
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

    stealerUnit.state.weaponCooldownRemainingMs = stealerUnit.weaponDelayMs;
    stealerUnit.state.gemCount--;
    scene.getEnemyBulletsPhysicsGroup();
}