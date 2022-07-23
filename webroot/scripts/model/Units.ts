import { getNewId } from "../state/IdState";
import { config } from "./Config";

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

/** Create a Phaser ImageWithDynamicBody for the unit defined with the given name in units.json */
export function createUnit(name: string, location: Phaser.Types.Math.Vector2Like, scene: Phaser.Scene) : Unit {
    let unitJson = unitCache[name];
    if (!unitJson) {
        return null;
    }
    let unit = JSON.parse(JSON.stringify(unitJson));
    if (unit.aiData === undefined) {
        unit.aiData = {};
    }

    // Create the actual Phaser ImageWithDynamicBody
    let unitId = getNewId();
    let unitImage = createUnitImage(unitJson, name, unitId, location, scene);
    
    unit.id = unitId;
    unit.gameObj = [unitImage];

    // For worm units, need to create the body pieces
    if (name == "worm") {
        for (let i = 1; i <= 9; i++) {
            // TODO allow for different spawning for the tail? Not just straight horizontal worm?
            let segmentLocation = { x: (location.x + (i * -unitImage.width)), y: location.y};
            let segment = createUnitImage(unitJson, "wormsegment", unitId, segmentLocation, scene);
            unit.gameObj.push(segment);
        }
    }

    return unit;
}

/** Create the Phaser ImageWithDynamicBody for the Unit */
function createUnitImage(unitJson, name: string, unitId: number, location: Phaser.Types.Math.Vector2Like, scene: Phaser.Scene) {
    let unitImage = scene.physics.add.image(location.x, location.y, name);
    unitImage.setData("id", unitId);
    unitImage.setName(name);
    if (unitJson["bodyType"] == "circle") {
        unitImage.body.setCircle(unitJson["bodySize"], unitJson["bodyOffset"], unitJson["bodyOffset"]);
    } else { // Default to square
        unitImage.setBodySize(unitJson["bodySize"], unitJson["bodySize"]);
    }
    unitImage.setDrag(config()["unitDrag"]);
    return unitImage;
}
