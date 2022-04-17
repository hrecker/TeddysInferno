import * as move from "../units/Movement";
import { Unit, createUnit } from "../model/Units";

const backgroundColor = "#821603";

let enemyUnits: { [id: number]: Unit } = {};
let player: Unit;

let thrustKey : Phaser.Input.Keyboard.Key;
let leftTurnKey : Phaser.Input.Keyboard.Key;
let rightTurnKey : Phaser.Input.Keyboard.Key;

let killZoneMinX, killZoneMinY, killZoneMaxX, killZoneMaxY;

let finalPlayerPos : Phaser.Math.Vector2;

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
        let background = this.add.image(480, 320, "background");
        let backgroundTopLeft = background.getTopLeft();
        let backgroundBottomRight = background.getBottomRight();
        killZoneMinX = backgroundTopLeft.x;
        killZoneMinY = backgroundTopLeft.y;
        killZoneMaxX = backgroundBottomRight.x;
        killZoneMaxY = backgroundBottomRight.y;

        graphics = this.add.graphics();
        this.createPlayerUnit();
        let unit = createUnit("chaser", new Phaser.Math.Vector2(500, 500), this);
        enemyUnits[unit.id] = unit;
        this.cameras.main.startFollow(player.gameObj);

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

    moveUnits(targetPos: Phaser.Math.Vector2) {
        Object.keys(enemyUnits).forEach(id => {
            // Pass in graphics for some debugging (the arcade physics debug property must be set to true)
            move.moveUnit(enemyUnits[id], targetPos, graphics);
        });
    }


    update(time, delta) {
        if (player.gameObj) {
            // Enemy movement
            this.moveUnits(player.gameObj.body.center);
            // Player movement
            move.movePlayerUnit(player, thrustKey.isDown, leftTurnKey.isDown, rightTurnKey.isDown);
            if (player.gameObj.x < killZoneMinX || player.gameObj.x > killZoneMaxX || 
                    player.gameObj.y < killZoneMinY || player.gameObj.y > killZoneMaxY) {
                finalPlayerPos = player.gameObj.body.center;
                player.gameObj.destroy();
                player.gameObj = null;
            }
        } else {
            // Enemy movement
            this.moveUnits(finalPlayerPos);
        }
        //TODO player weapons
    }
}