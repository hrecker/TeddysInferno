import { backgroundColor } from "../util/Util";
import * as move from "../units/Movement";
import { Unit, createUnit } from "../model/Units";

let enemyUnits: { [id: number]: Unit } = {};
let player: Unit;

let thrustKey : Phaser.Input.Keyboard.Key;
let leftTurnKey : Phaser.Input.Keyboard.Key;
let rightTurnKey : Phaser.Input.Keyboard.Key;

//TODO remove in prod build
let graphics;

export class MainScene extends Phaser.Scene {
    constructor() {
        super({
            key: "MainScene"
        });
    }

    create() {
        this.cameras.main.setBackgroundColor(backgroundColor);
        graphics = this.add.graphics();
        this.createPlayerUnit();
        let unit = createUnit("chaser", new Phaser.Math.Vector2(500, 500), this);
        enemyUnits[unit.id] = unit;

        thrustKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        leftTurnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        rightTurnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    }

    createPlayerUnit() {
        player = createUnit("player", new Phaser.Math.Vector2(300, 300), this);
        //TODO make player collision a circle probably
    }

    getUnit(id: number) {
        if (!id || !(id in enemyUnits)) {
            return null;
        }
        return enemyUnits[id];
    }

    moveUnits() {
        Object.keys(enemyUnits).forEach(id => {
            // Pass in graphics for some debugging (the arcade physics debug property must be set to true)
            move.moveUnit(enemyUnits[id], player, graphics);
        });
    }


    update(time, delta) {
        // Enemy movement
        this.moveUnits();
        //TODO player movement
        move.movePlayerUnit(player, thrustKey.isDown, leftTurnKey.isDown, rightTurnKey.isDown);
        //TODO player weapons
    }
}