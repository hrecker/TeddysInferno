import * as move from "../units/Movement";
import { fireWeapon } from "../units/Weapon";
import { Unit, createUnit } from "../model/Units";
import { handleBulletHit, handleUnitHit } from "../units/Collision";

const backgroundColor = "#821603";

let enemyUnits: { [id: number]: Unit } = {};
let player: Unit;

let playerPhysicsGroup : Phaser.Physics.Arcade.Group;
let unitsPhysicsGroup : Phaser.Physics.Arcade.Group;
let bulletsPhysicsGroup : Phaser.Physics.Arcade.Group;

let thrustKey : Phaser.Input.Keyboard.Key;
let leftTurnKey : Phaser.Input.Keyboard.Key;
let rightTurnKey : Phaser.Input.Keyboard.Key;
let streamWeaponKey : Phaser.Input.Keyboard.Key;
let shotgunWeaponKey : Phaser.Input.Keyboard.Key;

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
    
    // Create a physics group for units that does not reset drag when adding to the group
    createUnitPhysicsGroup() {
        let group = this.physics.add.group();
        delete group.defaults.setDragX;
        delete group.defaults.setDragY;
        return group;
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
        this.cameras.main.startFollow(player.gameObj);

        thrustKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        leftTurnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        rightTurnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        streamWeaponKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O);
        shotgunWeaponKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);

        playerPhysicsGroup = this.createUnitPhysicsGroup();
        playerPhysicsGroup.add(player.gameObj);
        unitsPhysicsGroup = this.createUnitPhysicsGroup();
        bulletsPhysicsGroup = this.createUnitPhysicsGroup();
        
        for (let i = 0; i < 20; i++) {
            this.addUnit("lazyChaser", new Phaser.Math.Vector2(500, 200 + (i * 5)));
        }
        for (let i = 0; i < 5; i++) {
            this.addUnit("accurateChaser", new Phaser.Math.Vector2(600, 200 + (i * 5)));
        }
        for (let i = 0; i < 5; i++) {
            this.addUnit("perfectChaser", new Phaser.Math.Vector2(700, 200 + (i * 5)));
        }
        
        // Handle bullet hit on units
        this.physics.add.overlap(bulletsPhysicsGroup, unitsPhysicsGroup, handleBulletHit, null, this);
        // Handle units hitting player
        this.physics.add.overlap(playerPhysicsGroup, unitsPhysicsGroup, handleUnitHit, null, this);
    }

    addUnit(name: string, location: Phaser.Math.Vector2) {
        let unit = createUnit(name, location, this);
        enemyUnits[unit.id] = unit;
        unitsPhysicsGroup.add(unit.gameObj);
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

    destroyUnit(id: number) {
        enemyUnits[id].gameObj.destroy();
        delete enemyUnits[id];
    }

    destroyPlayer() {
        if (player.gameObj) {
            finalPlayerPos = player.gameObj.body.center;
            player.gameObj.destroy();
            player.gameObj = null;
        }
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
                this.destroyPlayer();
            }
            // Player weapons
            fireWeapon(this, bulletsPhysicsGroup, delta, player, streamWeaponKey.isDown, shotgunWeaponKey.isDown);
        } else {
            // Enemy movement
            this.moveUnits(finalPlayerPos);
        }
    }
}