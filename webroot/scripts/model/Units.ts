import { getNewId } from "../state/IdState";
import { unitDrag } from "../units/Movement";

let unitCache: { [name: string]: Unit };

/** A Unit in the main scene */
export type Unit = {
    name: string;
    id: number;
    gameObj: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
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
    let unitImage = scene.physics.add.image(location.x, location.y, name);
    let unitId = getNewId();
    unitImage.setData("id", unitId);
    unitImage.setName(name);
    if (unitJson["bodyType"] == "circle") {
        unitImage.body.setCircle(unitJson["bodySize"], unitJson["bodyOffset"], unitJson["bodyOffset"]);
    } else { // Default to square
        unitImage.setBodySize(unitJson["bodySize"], unitJson["bodySize"]);
    }
    unitImage.setDrag(unitDrag);
    
    unit.id = unitId;
    unit.gameObj = unitImage;

    return unit;
}

export function destroyUnit(unit: Unit) {
    unit.gameObj.destroy();
}

/** Update the health/max health of a given unit */
export function updateHealth(unit: Unit, newHealth: number, newMaxHealth?: number) {
    unit.health = newHealth;
    if (newMaxHealth) {
        unit.maxHealth = newMaxHealth;
    }

    if (unit.health <= 0) {
        destroyUnit(unit);
    }
}

/** Cause the unit to take a certain amount of damage, and destroy it if health reaches zero. */
export function takeDamage(unit: Unit, damage: number) {
    if (damage <= 0) {
        return;
    }
    updateHealth(unit, unit.health - damage);
}
