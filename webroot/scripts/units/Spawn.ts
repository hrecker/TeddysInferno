import { config } from "../model/Config";
import { getNewId } from "../state/IdState";

let scheduledSpawns: { [spawnId: string]: Spawn } = {};

/** A Spawn of a unit with the given name */
type Spawn = {
    name: string;
    location: Phaser.Math.Vector2;
    image: Phaser.GameObjects.Image;
    spawnCooldownRemainingMs: number;
}

export function startSpawn(unitName: string, location: Phaser.Math.Vector2, image: Phaser.GameObjects.Image) {
    // Add a Spawn
    let newSpawn: Spawn = {
        name: unitName,
        location: location,
        image: image,
        spawnCooldownRemainingMs: config()["unitSpawnDurationMs"]
    };
    scheduledSpawns[getNewId()] = newSpawn;
}

/** Countdown spawn timers, and return any Spawns that are ready to spawn */
export function countdownSpawns(delta: number): Spawn[] {
    let completedIds = [];
    Object.keys(scheduledSpawns).forEach(id => {
        scheduledSpawns[id].spawnCooldownRemainingMs -= delta;
        if (scheduledSpawns[id].spawnCooldownRemainingMs <= 0) {
            completedIds.push(id);
            // Destroy the spawn image
            scheduledSpawns[id].image.destroy();
        }
    });

    let completed = [];
    completedIds.forEach(id => {
        completed.push(scheduledSpawns[id]);
        delete scheduledSpawns[id];
    });
    return completed;
}
