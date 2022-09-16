import { bombCountEvent } from "../events/EventMessenger";
import { config } from "../model/Config";
import { playSound, SoundEffect } from "../model/Sound";
import { Unit } from "../model/Units";
import { MainScene } from "../scenes/MainScene";
import { getStreamCooldownMs, getShotgunCooldownMs, takeDamage } from "./UnitStatus";

/** Fire player weapon for one frame. Return the number of bullets fired this frame. */
export function fireWeapon(scene: MainScene, physicsGroup: Phaser.Physics.Arcade.Group, delta: number, player: Unit, streamWeaponKeyDown: boolean, shotgunWeaponKeyDown: boolean): number {
    if (player.state.weaponCooldownRemainingMs > 0) {
        player.state.weaponCooldownRemainingMs -= delta;
        return 0;
    }

    if (streamWeaponKeyDown) {
        let spawnPos = getBulletSpawnPos(player);
        createBullet(scene, physicsGroup, spawnPos, randomBulletAngle(player.gameObj[0].rotation, config()["streamAngleSpread"]));
        player.state.weaponCooldownRemainingMs = getStreamCooldownMs(player);
        playSound(scene, SoundEffect.BasicShot);
        let emitter = scene.getBulletParticleEmitter();
        // Emit particles in a cone where the player is facing
        emitter.setAngle({ min: player.gameObj[0].angle - 90, max: player.gameObj[0].angle + 90 });
        emitter.explode(config()["bulletParticleCount"], spawnPos.x, spawnPos.y);
        return 1;
    } else if (shotgunWeaponKeyDown) {
        let spawnPos = getBulletSpawnPos(player);
        for (let i = 0; i < config()["shotgunBulletCount"]; i++) {
            createBullet(scene, physicsGroup, spawnPos, randomBulletAngle(player.gameObj[0].rotation, config()["shotgunAngleSpread"]));
        }
        player.state.weaponCooldownRemainingMs = getShotgunCooldownMs(player);
        playSound(scene, SoundEffect.ShotgunShot);
        let emitter = scene.getBulletParticleEmitter();
        // Emit particles in a cone where the player is facing
        emitter.setAngle({ min: player.gameObj[0].angle - 90, max: player.gameObj[0].angle + 90 });
        emitter.explode(config()["shotgunParticleCount"], spawnPos.x, spawnPos.y);
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
        // Activate bomb, repelling and damaging all units in the scene, along with destroying any enemy bullets (explosions and flames)
        // Create a copy of the objects in the group so that they can be destroyed while iterating.
        let toDestroy: Phaser.GameObjects.GameObject[] = [];
        scene.getEnemyBulletsPhysicsGroup().getChildren().forEach(enemyBullet => {
            toDestroy.push(enemyBullet);
        });
        toDestroy.forEach(enemyBullet => {
            enemyBullet.destroy();
        });
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
        scene.shake(config()["bombRepelDurationMs"], 0.008);
        scene.cameras.main.flash(config()["bombRepelDurationMs"], 100, 100, 100);
        playSound(scene, SoundEffect.PlayerBomb);
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
    // Turn off explosion after delay so it doesn't do damage while mostly faded out
    scene.time.delayedCall(config()["explosionLifetimeMs"], () => {
        explosion.setData("isBullet", false);
    });
    // Fade out and destroy once faded out
    scene.tweens.add({
        targets: explosion,
        alpha: {
            from: 1,
            to: 0
        },
        duration: config()["explosionLifetimeMs"] * 1.1,
        ease: "Expo.easeIn",
        onComplete: () => {
            explosion.destroy();
        }
    });
    return explosion;
}

/** Fire weapon for enemy unit for one frame */
export function fireEnemyWeapon(unit: Unit, player: Unit, scene: MainScene, delta: number) {
    switch (unit.name) {
        case "stealer1":
            fireGemStealer1Weapon(unit, player, scene, delta);
            break;
        case "stealer2":
            fireGemStealer2Weapon(unit, player, scene, delta);
            break;
    }
}

/** Fire gem stealer1 weapon when appropriate for one frame*/
export function fireGemStealer1Weapon(stealerUnit: Unit, player: Unit, scene: MainScene, delta: number) {
    if (stealerUnit.state.gemCount <= 0) {
        return;
    }

    if (stealerUnit.state.weaponCooldownRemainingMs > 0) {
        stealerUnit.state.weaponCooldownRemainingMs -= delta;
        return;
    }

    // Create flame projectile
    let direction = player.gameObj[0].body.center.clone().subtract(stealerUnit.gameObj[0].body.center);
    createFlame(scene, stealerUnit.gameObj[0].body.center, direction);

    stealerUnit.state.weaponCooldownRemainingMs = stealerUnit.weaponDelayMs;
    stealerUnit.state.gemCount--;

    playSound(scene, SoundEffect.StealerShot);
}

const numFlames = 6;
const rotationPerFlame = 2 * Math.PI / numFlames;
/** Fire gem stealer2 weapon when appropriate for one frame*/
export function fireGemStealer2Weapon(stealerUnit: Unit, player: Unit, scene: MainScene, delta: number) {
    if (stealerUnit.state.gemCount <= 0) {
        return;
    }

    if (stealerUnit.state.weaponCooldownRemainingMs > 0) {
        stealerUnit.state.weaponCooldownRemainingMs -= delta;
        return;
    }

    // Create six flame projectiles
    // Pick a random direction to start with, then make 5 more to form the six directions
    let initial = Phaser.Math.Vector2.RIGHT.clone().rotate(Math.random() * 2 * Math.PI);
    for (let i = 0; i < numFlames; i++) {
        let direction = initial.clone().rotate(rotationPerFlame * i);
        createFlame(scene, stealerUnit.gameObj[0].body.center, direction);
    }

    stealerUnit.state.weaponCooldownRemainingMs = stealerUnit.weaponDelayMs;
    stealerUnit.state.gemCount--;

    playSound(scene, SoundEffect.StealerShot);
}

/** Create flame projectile fired by stealer1 and stealer2 */
function createFlame(scene: MainScene, origin: Phaser.Types.Math.Vector2Like, direction: Phaser.Math.Vector2): Phaser.Types.Physics.Arcade.ImageWithDynamicBody {
    let flame = scene.physics.add.image(origin.x, origin.y, "flame");
    scene.getEnemyBulletsPhysicsGroup().add(flame);
    flame.setData("isBullet", true);
    flame.body.setOffset(config()["flameBodyOffset"]);
    flame.body.setCircle(config()["flameBodyRadius"]);
    // Set flame direction
    let velocity = direction.normalize().scale(config()["flameSpeed"]);
    flame.setVelocity(velocity.x, velocity.y);
    // Ensure flames are eventually destroyed
    scene.time.delayedCall(config()["flameLifetimeMs"], () => flame.destroy());
    return flame;
}