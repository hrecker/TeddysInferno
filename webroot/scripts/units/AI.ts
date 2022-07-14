import { Unit } from "../model/Units";
import { MainScene } from "../scenes/MainScene";
import { createExplosion } from "./Weapon";

const unitInaccuracyRange = 100;

/** Update a unit's AI for one frame (call each frame in the update method of a scene) */
export function updateUnitAI(unit: Unit, scene: MainScene, delta: number) {
    switch (unit.ai) {
        case "spawner":
            spawnerUpdate(unit, unit.aiData["spawnUnit"], scene, delta);
            break;
        case "bomber":
            spawnerUpdate(unit, "bomb", scene, delta);
            break;
        case "bomb":
            bombUpdate(unit, scene, delta);
            break;
    }
}

function spawnerUpdate(spawner: Unit, spawnedUnitName: string, scene: MainScene, delta: number) {
    if ("spawnCooldownRemainingMs" in spawner.aiData && spawner.aiData["spawnCooldownRemainingMs"] > 0) {
        spawner.aiData["spawnCooldownRemainingMs"] -= delta;
        return;
    }

    let randomRotation = Math.random() * 2 * Math.PI;
    let unit = scene.addUnit(spawnedUnitName, spawner.gameObj[0].body.center);
    unit.gameObj[0].setRotation(randomRotation);
    unit.aiData["inaccuracy"] = new Phaser.Math.Vector2((Math.random() * unitInaccuracyRange) - (unitInaccuracyRange / 2), 
            (Math.random() * unitInaccuracyRange) - (unitInaccuracyRange / 2));
    spawner.aiData["spawnCooldownRemainingMs"] = spawner.aiData["spawnDelay"];
}

function bombUpdate(bomb: Unit, scene: MainScene, delta: number) {
    if ("flashRemainingMs" in bomb.aiData && bomb.aiData["flashRemainingMs"] > 0) {
        bomb.aiData["flashRemainingMs"] -= delta;
    } else {
        let currentTextureId = 0;
        for (let i = 1; i < bomb.aiData["textures"].length; i++) {
            if (bomb.aiData["textures"][i] == bomb.gameObj[0].texture.key) {
                currentTextureId = i;
                break;
            }
        }
        let newTextureId = (currentTextureId + 1) % bomb.aiData["textures"].length;
        bomb.gameObj[0].setTexture(bomb.aiData["textures"][newTextureId]);
        bomb.aiData["flashRemainingMs"] = bomb.aiData["flashDelay"];
    }

    if ("lifetimeRemainingMs" in bomb.aiData && bomb.aiData["lifetimeRemainingMs"] > 0) {
        bomb.aiData["lifetimeRemainingMs"] -= delta;
        return;
    }
    explodeBomb(bomb, scene);
    scene.destroyUnit(bomb.id);
}

// Note: this method does not destroy the bomb object
function explodeBomb(bomb: Unit, scene: MainScene) {
    if (!("explosionSpawned" in bomb.aiData) || ! bomb.aiData["explosionSpawned"]) {
        bomb.aiData["explosionSpawned"] = true;
        createExplosion(scene, scene.getEnemyBulletsPhysicsGroup(), bomb.gameObj[0].body.center);
    }
}

export function handleUnitDestroy(unit: Unit, scene: MainScene) {
    switch (unit.ai) {
        case "bomb":
            explodeBomb(unit, scene);
            break;
    }
}