import { config } from "../model/Config";
import { playSound, SoundEffect } from "../model/Sound";
import { Unit } from "../model/Units";
import { MainScene } from "../scenes/MainScene";
import { MovementState } from "./Movement";
import { createExplosion } from "./Weapon";

/** Update a unit's AI for one frame (call each frame in the update method of a scene) */
export function updateUnitAI(unit: Unit, scene: MainScene, delta: number) {
    switch (unit.ai) {
        case "spawner":
            spawnerUpdate(unit, unit.spawnUnit, scene, delta);
            break;
        case "bomber":
            spawnerUpdate(unit, "bomb", scene, delta);
            break;
        case "bomb":
            bombUpdate(unit, scene, delta);
            break;
    }
}

/** Update spawner unit AI for one frame */
function spawnerUpdate(spawner: Unit, spawnedUnitName: string, scene: MainScene, delta: number) {
    if (spawner.state.spawnCooldownRemainingMs > 0) {
        spawner.state.spawnCooldownRemainingMs -= delta;
        return;
    }

    // Don't spawn bombs while recovering back inbounds
    if (spawner.state.movementState == MovementState.Recovering && spawner.name == "bomber") {
        return;
    }

    let randomRotation = Math.random() * 2 * Math.PI;
    let unit = scene.addUnit(spawnedUnitName, spawner.gameObj[0].body.center);
    unit.gameObj[0].setRotation(randomRotation);
    let inaccuracyRange = config()["unitInaccuracyRange"];
    unit.inaccuracy = new Phaser.Math.Vector2((Math.random() * inaccuracyRange) - (inaccuracyRange / 2), 
            (Math.random() * inaccuracyRange) - (inaccuracyRange / 2));
    spawner.state.spawnCooldownRemainingMs = spawner.spawnDelayMs;

    if (spawner.name == "bomber") {
        playSound(scene, SoundEffect.EnemyBombDrop);
    } else {
        playSound(scene, SoundEffect.EnemySpawned);
    }
}

/** Update bomb unit AI for one frame */
function bombUpdate(bomb: Unit, scene: MainScene, delta: number) {
    if (bomb.state.flashRemainingMs > 0) {
        bomb.state.flashRemainingMs -= delta;
    } else {
        let currentTextureId = 0;
        for (let i = 1; i < bomb.textures.length; i++) {
            if (bomb.textures[i] == bomb.gameObj[0].texture.key) {
                currentTextureId = i;
                break;
            }
        }
        let newTextureId = (currentTextureId + 1) % bomb.textures.length;
        bomb.gameObj[0].setTexture(bomb.textures[newTextureId]);
        bomb.state.flashRemainingMs = bomb.flashDelayMs;
    }

    if (bomb.state.lifetimeRemainingMs > 0) {
        bomb.state.lifetimeRemainingMs -= delta;
        return;
    }
    explodeBomb(bomb, scene);
    scene.destroyUnitById(bomb.id);
}

/** Explode bomb unit */
// Note: this method does not destroy the bomb object
function explodeBomb(bomb: Unit, scene: MainScene) {
    if (! bomb.state.explosionSpawned) {
        bomb.state.explosionSpawned = true;
        createExplosion(scene, scene.getEnemyBulletsPhysicsGroup(), bomb.gameObj[0].body.center);
        playSound(scene, SoundEffect.EnemyBomb);
        // Use the gem particles for explosions
        scene.gemParticles(bomb.gameObj[0].body.center, 20);
    }
}

/** Any logic necessary for specific units when being destroyed. */
export function handleUnitDestroy(unit: Unit, scene: MainScene) {
    switch (unit.ai) {
        case "bomb":
            explodeBomb(unit, scene);
            break;
    }
    if (unit.name != "player") {
        for (let i = 0; i < unit.gemsDropped; i++) {
            let gem = scene.addGem(unit.gameObj[0].body.center);
            // Add some velocity in a random direction to the gem
            let gemVel = Phaser.Math.Vector2.RIGHT.clone().rotate(Math.random() * 2 * Math.PI).
                    scale(config()["gemSpawnSpeed"]);
            gem.setVelocity(gemVel.x, gemVel.y);
        }
    }
    scene.shake(250, 0.003);
}
