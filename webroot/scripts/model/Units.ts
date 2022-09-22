import { getNewId } from "../state/IdState";
import { MovementState } from "../units/Movement";
import { config } from "./Config";

let unitCache: { [name: string]: Unit };

/** Current state of a Unit in the main scene */
export type UnitState = {
    // Player
    weaponLevel?: number;
    bombCount?: number;
    bombsEarned?: number;
    bombCooldownRemainingMs?: number;
    quickTurnCooldownRemainingMs?: number;
    boostCooldownRemainingMs?: number;
    boostDirection?: Phaser.Math.Vector2;
    activeBoostRemainingMs?: number;
    // Enemies
    spawnCooldownRemainingMs?: number;
    flashRemainingMs?: number;
    lifetimeRemainingMs?: number;
    explosionSpawned?: boolean;
    currentLoopDurationMs?: number;
    loopTarget?: Phaser.Math.Vector2;
    loopRadius?: number;
    loopCenter?: Phaser.Math.Vector2;
    moveAngle?: number;
    movementState?: MovementState;
    // Shared
    health?: number;
    weaponCooldownRemainingMs?: number;
    gemCount?: number;
    lastPositions?: Phaser.Math.Vector2[];
}

/** A Unit in the main scene */
export type Unit = {
    name: string;
    id: number;
    gameObj: Phaser.Types.Physics.Arcade.ImageWithDynamicBody[];
    bodyType: string;
    bodySize: number;
    bodyOffset?: number;
    // Movement props
    movement: string;
    maxSpeed: number;
    maxAcceleration: number;
    maxAngularSpeed?: number;
    rotation: boolean;
    disableDrag: boolean;
    inaccuracyRange: number;
    inaccuracy?: Phaser.Math.Vector2;
    loopDurationMs?: number;
    randomSpawnRotation: boolean;
    // Health props
    maxHealth: number;
    // Weapon props
    spawnUnit?: string;
    spawnDelayMs?: number;
    harmless: boolean;
    weaponDelayMs?: number;
    // AI props
    ai: string;
    // Other
    gemsDropped: number;
    textures?: string[];
    flashDelayMs?: number;
    lifetimeMs?: number;
    state: UnitState;
    color: number;
    skipDeathAnimation: boolean;
}

/** Store unit json data for creating units */
export function loadUnitJson(unitJson) {
    unitCache = {};
    for (let name in unitJson) {
        let unitProps = unitJson[name];
        unitCache[name] = {
            name: name,
            id: -1,
            gameObj: null,
            bodyType: unitProps["bodyType"],
            bodySize: unitProps["bodySize"],
            bodyOffset: unitProps["bodyOffset"],
            movement: unitProps["movement"],
            maxSpeed: unitProps["maxSpeed"],
            maxAcceleration: unitProps["maxAcceleration"],
            maxAngularSpeed: unitProps["maxAngularSpeed"],
            rotation: unitProps["rotation"],
            disableDrag: unitProps["disableDrag"],
            inaccuracyRange: unitProps["inaccuracyRange"],
            loopDurationMs: unitProps["loopDurationMs"],
            randomSpawnRotation: unitProps["randomSpawnRotation"],
            maxHealth: unitProps["health"],
            spawnUnit: unitProps["spawnUnit"],
            spawnDelayMs: unitProps["spawnDelayMs"],
            harmless: unitProps["harmless"],
            weaponDelayMs: unitProps["weaponDelayMs"],
            ai: unitProps["ai"],
            gemsDropped: unitProps["gemsDropped"],
            textures: unitProps["textures"],
            flashDelayMs: unitProps["flashDelayMs"],
            lifetimeMs: unitProps["lifetimeMs"],
            color: parseInt(unitProps["color"], 16),
            skipDeathAnimation: unitProps["skipDeathAnimation"],
            state: {}
        };
    };
}

/** Create a Phaser ImageWithDynamicBody for the unit defined with the given name in units.json */
export function createUnit(name: string, location: Phaser.Types.Math.Vector2Like, scene: Phaser.Scene, rotation?: number) : Unit {
    let unitJson = unitCache[name];
    if (!unitJson) {
        return null;
    }
    let unit: Unit = JSON.parse(JSON.stringify(unitJson));

    // Create the actual Phaser ImageWithDynamicBody
    let unitId = getNewId();
    let unitImage = createUnitImage(unitJson, name, unitId, location, scene, rotation);

    unit.id = unitId;
    unit.gameObj = [unitImage];

    // For worm units, need to create the body pieces
    if (name == "worm") {
        getWormSegmentLocations(location, rotation).forEach(segmentLocation => {
            let segment = createUnitImage(unitJson, "wormsegment", unitId, segmentLocation, scene);
            unit.gameObj.push(segment);
        });
    }

    // Initialize unit state
    unit.state.weaponLevel = 0;
    unit.state.bombCount = 0;
    unit.state.bombsEarned = 0;
    unit.state.bombCooldownRemainingMs = 0;
    unit.state.gemCount = 0;
    unit.state.quickTurnCooldownRemainingMs = 0;
    unit.state.boostCooldownRemainingMs = 0;
    unit.state.activeBoostRemainingMs = 0;
    unit.state.spawnCooldownRemainingMs = 0;
    unit.state.flashRemainingMs = 0;
    unit.state.lifetimeRemainingMs = unit.lifetimeMs;
    unit.state.explosionSpawned = false;
    unit.state.currentLoopDurationMs = -1;
    unit.state.health = unit.maxHealth;
    unit.state.weaponCooldownRemainingMs = unit.weaponDelayMs;
    unit.state.lastPositions = [];

    return unit;
}

/** Get the locations for all the segments of a worm unit */
export function getWormSegmentLocations(location: Phaser.Types.Math.Vector2Like, rotation: number): Phaser.Types.Math.Vector2Like[] {
    let locations = [];
    let marginVector = Phaser.Math.Vector2.LEFT.clone().rotate(rotation).scale(config()["wormSegmentMargin"]);
    for (let i = 1; i <= config()["wormSegmentCount"]; i++) {
        locations.push(marginVector.clone().scale(i).add(location));
    }
    return locations;
}

/** Create the Phaser ImageWithDynamicBody for the Unit */
function createUnitImage(unitJson, name: string, unitId: number, location: Phaser.Types.Math.Vector2Like, scene: Phaser.Scene, rotation?: number) {
    let unitImage = scene.physics.add.image(location.x, location.y, name);
    unitImage.setData("id", unitId);
    unitImage.setName(name);
    if (unitJson["bodyType"] == "circle") {
        unitImage.body.setCircle(unitJson["bodySize"], unitJson["bodyOffset"], unitJson["bodyOffset"]);
    } else { // Default to square
        unitImage.setBodySize(unitJson["bodySize"], unitJson["bodySize"]);
    }
    unitImage.setDrag(0);
    if (rotation && unitJson["randomSpawnRotation"]) {
        unitImage.setRotation(rotation);
    }
    return unitImage;
}
