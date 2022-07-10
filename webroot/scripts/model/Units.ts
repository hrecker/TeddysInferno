import { getNewId } from "../state/IdState";
import { unitDrag } from "../units/Movement";
import { MainScene } from "../scenes/MainScene";
import { handleUnitDestroy } from "../units/AI";

let unitCache: { [name: string]: Unit };

/** A Unit in the main scene */
export type Unit = {
    name: string;
    id: number;
    gameObj: Phaser.Types.Physics.Arcade.ImageWithDynamicBody[];
    bodyType: string;
    bodySize: number;
    bodyOffset: number;
    // Movement props
    movement: string;
    maxSpeed: number;
    maxAcceleration: number;
    maxAngularSpeed: number;
    rotation: boolean;
    // Health props
    health: number;
    maxHealth: number;
    // Weapon props
    cooldownRemainingMs: number;
    harmless: boolean;
    // AI props
    ai: string;
    aiData;
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
            movement: unitProps["movement"],
            maxSpeed: unitProps["maxSpeed"],
            maxAcceleration: unitProps["maxAcceleration"],
            maxAngularSpeed: unitProps["maxAngularSpeed"],
            rotation: unitProps["rotation"],
            health: unitProps["health"],
            maxHealth: unitProps["health"],
            bodyType: unitProps["bodyType"],
            bodySize: unitProps["bodySize"],
            bodyOffset: unitProps["bodyOffset"],
            cooldownRemainingMs: 0,
            harmless: unitProps["harmless"],
            ai: unitProps["ai"],
            aiData: unitProps["aiData"]
        };
    };
}

export function getUnitsJsonProperties(filter): Unit[] {
    let units = [];
    for (let name in unitCache) {
        let unit = getUnitJsonProperties(name);
        if (filter(unit)) {
            units.push(unit);
        }
    }
    return units;
}

/** Get a unit with property values defined in json, but don't actually create it in the scene.
 *  This method deep-copies the Unit, so the returned Unit can be modified as needed.
 */
export function getUnitJsonProperties(name: string) : Unit {
    let unitProps = unitCache[name];
    if (!unitProps) {
        return null;
    }
    //TODO ensure this is sufficient - if not, try lodash.deepcopy module
    return JSON.parse(JSON.stringify(unitProps));
}

/** Create a Phaser ImageWithDynamicBody for the unit defined with the given name in units.json */
export function createUnit(name: string, location: Phaser.Types.Math.Vector2Like, scene: Phaser.Scene) : Unit {
    let unitJson = unitCache[name];
    if (!unitJson) {
        return null;
    }
    let unit = getUnitJsonProperties(name);

    // Create the actual Phaser ImageWithDynamicBody
    let unitId = getNewId();
    let unitImage = createUnitImage(unitJson, name, unitId, location, scene);
    
    unit.id = unitId;
    unit.gameObj = [unitImage];

    // For worm units, need to create the body pieces
    if (name == "worm") {
        for (let i = 1; i <= 9; i++) {
            let segmentLocation = { x: (location.x + (i * -unitImage.width)), y: location.y};
            let segment = createUnitImage(unitJson, "wormsegment", unitId, segmentLocation, scene);
            unit.gameObj.push(segment);
        }
    }

    return unit;
}

function createUnitImage(unitJson, name: string, unitId: number, location: Phaser.Types.Math.Vector2Like, scene: Phaser.Scene) {
    let unitImage = scene.physics.add.image(location.x, location.y, name);
    unitImage.setData("id", unitId);
    unitImage.setName(name);
    if (unitJson["bodyType"] == "circle") {
        unitImage.body.setCircle(unitJson["bodySize"], unitJson["bodyOffset"], unitJson["bodyOffset"]);
    } else { // Default to square
        unitImage.setBodySize(unitJson["bodySize"], unitJson["bodySize"]);
    }
    unitImage.setDrag(unitDrag);
    return unitImage;
}

export function destroyUnit(unit: Unit, scene: MainScene) {
    handleUnitDestroy(unit, scene);
    unit.gameObj.forEach(obj => {
        obj.destroy();
    });
}

/** Update the health/max health of a given unit */
export function updateHealth(scene: MainScene, unit: Unit, newHealth: number, newMaxHealth?: number) {
    unit.health = newHealth;
    if (newMaxHealth) {
        unit.maxHealth = newMaxHealth;
    }

    if (unit.health <= 0) {
        if (unit.name == "player") {
            scene.destroyPlayer();
        } else {
            scene.destroyUnit(unit.id);
        }
    }
}

/** Cause the unit to take a certain amount of damage, and destroy it if health reaches zero. */
export function takeDamage(scene: MainScene, unit: Unit, damage: number) {
    if (damage <= 0) {
        return;
    }
    updateHealth(scene, unit, unit.health - damage);
}
