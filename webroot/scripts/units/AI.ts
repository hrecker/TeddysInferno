import { Unit } from "../model/Units";
import { MainScene } from "../scenes/MainScene";

/** Update a unit's AI for one frame (call each frame in the update method of a scene) */
export function updateUnitAI(unit: Unit, scene: MainScene, delta: number) {
    switch (unit.ai) {
        case "spawner":
            spawnerUpdate(unit, unit.aiData["spawnUnit"], scene, delta);
            break;
    }
}

function spawnerUpdate(spawner: Unit, spawnedUnitName: string, scene: MainScene, delta: number) {
    if ("spawnCooldownRemainingMs" in spawner.aiData && spawner.aiData["spawnCooldownRemainingMs"] > 0) {
        spawner.aiData["spawnCooldownRemainingMs"] -= delta;
        return;
    }

    scene.addUnit(spawnedUnitName, spawner.gameObj.body.center);
    spawner.aiData["spawnCooldownRemainingMs"] = spawner.aiData["spawnDelay"];
}