import { backgroundColor } from "../util/Util";
import * as move from "../units/Movement";
import { Unit, createUnit } from "../model/Units";

let enemyUnits: { [id: number]: Unit } = {};
let player;

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
    }

    createPlayerUnit() {
        player = createUnit("player", new Phaser.Math.Vector2(300, 300), this);
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
        //TODO player weapons
    }
}