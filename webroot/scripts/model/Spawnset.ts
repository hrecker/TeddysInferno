let spawnTimes: number[] = [];
let spawnUnits: string[][] = [];
let currentSpawnIndex = 0;

/** Reset the spawnset to the beginning */
export function resetSpawnset() {
    currentSpawnIndex = 0;
}

/** Load spawnset defined in json */
export function loadSpawnset(spawnsetJson) {
    for (let spawnTime in spawnsetJson["spawnTimes"]) {
        // Only allow for spawning at integer times
        spawnTimes.push(parseInt(spawnTime));
        spawnUnits.push(spawnsetJson["spawnTimes"][spawnTime]);
    }
    currentSpawnIndex = 0;
}

/** Get spawns that should begin now based on the game time */
export function getSpawns(gameTime: number): string[] {
    let toSpawn = [];
    while (currentSpawnIndex < spawnTimes.length && (gameTime / 1000.0) >= spawnTimes[currentSpawnIndex]) {
        toSpawn.push(...spawnUnits[currentSpawnIndex]);
        currentSpawnIndex++;
    }
    return toSpawn;
}