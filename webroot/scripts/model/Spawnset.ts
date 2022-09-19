import { Challenge, getCurrentChallenge } from "../state/ChallengeState";
import { config } from "./Config";

let spawnTimes: number[] = [];
let spawnUnits: string[][] = [];
let loopSpawnTimes: number[] = [];
let loopSpawnUnits: string[][] = [];
let loopInterval: number;
let loopSpeedMultiplier: number;
let currentLoopSpeedMultiplier: number;
let currentSpawnIndex: number;
let loopActive: boolean;
let loopStartTime: number;

/** Reset the spawnset to the beginning */
export function resetSpawnset() {
    currentSpawnIndex = 0;
    currentLoopSpeedMultiplier = 1;
    loopActive = false;
}

/** Load spawnset defined in json */
export function loadSpawnset(spawnsetJson) {
    for (let spawnTime in spawnsetJson["spawnTimes"]) {
        // Only allow for spawning at integer times
        spawnTimes.push(parseInt(spawnTime));
        spawnUnits.push(spawnsetJson["spawnTimes"][spawnTime]);
    }
    for (let loopSpawnTime in spawnsetJson["loopSpawnTimes"]) {
        // Only allow for spawning at integer times (though this will change during the loop)
        loopSpawnTimes.push(parseInt(loopSpawnTime));
        loopSpawnUnits.push(spawnsetJson["loopSpawnTimes"][loopSpawnTime]);
    }
    loopInterval = spawnsetJson["loopInterval"];
    loopSpeedMultiplier = spawnsetJson["loopSpeedMultiplier"];
    resetSpawnset();
}

/** Get spawns that should begin now based on the game time */
export function getSpawns(gameTime: number): string[] {
    let toSpawn = [];
    while (!loopActive && currentSpawnIndex < spawnTimes.length && (gameTime / 1000.0) >= getSpawnTime(spawnTimes[currentSpawnIndex])) {
        let toSpawnNow = spawnUnits[currentSpawnIndex];
        let loopIndex = toSpawnNow.indexOf("loop");
        if (loopIndex > -1) {
            // Start the first loop
            loopActive = true;
            toSpawnNow.splice(loopIndex, 1);
            loopStartTime = (gameTime / 1000.0);
            currentSpawnIndex = 0;
        }
        toSpawn.push(...toSpawnNow);
        if (! loopActive) {
            currentSpawnIndex++;
        }
    }
    // Loop spawns
    while (loopActive && currentSpawnIndex < loopSpawnTimes.length && (gameTime / 1000.0) >= getLoopSpawnTime(currentSpawnIndex)) {
        toSpawn.push(...loopSpawnUnits[currentSpawnIndex]);
        currentSpawnIndex++;
        if (currentSpawnIndex >= loopSpawnTimes.length) {
            // Start next loop
            loopStartTime = getLoopSpawnTime(currentSpawnIndex - 1) + (loopInterval * currentLoopSpeedMultiplier);
            currentLoopSpeedMultiplier *= loopSpeedMultiplier;
            currentSpawnIndex = 0;
        }
    }
    return toSpawn;
}

/** Get the actual spawn time of the given index in the loop */
function getLoopSpawnTime(spawnIndex: number): number {
    return getSpawnTime(loopStartTime + (loopSpawnTimes[spawnIndex] * currentLoopSpeedMultiplier));
}

/** Apply challenge modifier to spawn time if necessary. */
function getSpawnTime(defaultSpawnTime: number): number {
    if (getCurrentChallenge() == Challenge.Chaos) {
        return defaultSpawnTime * config()["chaosChallengeSpawnDelayFactor"];
    }
    return defaultSpawnTime;
}

