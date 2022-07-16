import { moveUnit, movePlayerUnit } from "../units/Movement";
import { updateUnitAI } from "../units/AI";
import { fireWeapon } from "../units/Weapon";
import { Unit, createUnit, destroyUnit } from "../model/Units";
import { handleBulletHit, handleEnemyBulletHit, handleUnitHit } from "../units/Collision";
import { setTimerText } from "./MainUIScene";

const backgroundColor = "#821603";

let enemyUnits: { [id: number]: Unit } = {};
let player: Unit;

let playerPhysicsGroup : Phaser.Physics.Arcade.Group;
let unitsPhysicsGroup : Phaser.Physics.Arcade.Group;
let bulletsPhysicsGroup : Phaser.Physics.Arcade.Group;
let enemyBulletsPhysicsGroup : Phaser.Physics.Arcade.Group;

let thrustKey : Phaser.Input.Keyboard.Key;
let leftTurnKey : Phaser.Input.Keyboard.Key;
let rightTurnKey : Phaser.Input.Keyboard.Key;
let streamWeaponKey : Phaser.Input.Keyboard.Key;
let shotgunWeaponKey : Phaser.Input.Keyboard.Key;
let quickTurnKey : Phaser.Input.Keyboard.Key;
let boostKey : Phaser.Input.Keyboard.Key;

let killZoneMinX, killZoneMinY, killZoneMaxX, killZoneMaxY;

let finalPlayerPos : Phaser.Math.Vector2;

let timer = 0;

//TODO remove in prod build
let graphics;

export class MainScene extends Phaser.Scene {
    constructor() {
        super({
            key: "MainScene"
        });
    }
    
    // Create a physics group for units that does not reset drag when adding to the group
    createPhysicsGroup() {
        let group = this.physics.add.group();
        delete group.defaults.setDragX;
        delete group.defaults.setDragY;
        return group;
    }

    getEnemyBulletsPhysicsGroup() {
        return enemyBulletsPhysicsGroup;
    }

    getKillZoneMinX() {
        return killZoneMinX;
    }

    getKillZoneMaxX() {
        return killZoneMaxX;
    }
    
    getKillZoneMinY() {
        return killZoneMinY;
    }

    getKillZoneMaxY() {
        return killZoneMaxY;
    }

    create() {
        enemyUnits = {};
        timer = 0;
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
        this.cameras.main.startFollow(player.gameObj[0]);

        thrustKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        leftTurnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        rightTurnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        streamWeaponKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O);
        shotgunWeaponKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
        quickTurnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
        boostKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.input.mouse.disableContextMenu();

        playerPhysicsGroup = this.createPhysicsGroup();
        playerPhysicsGroup.add(player.gameObj[0]);
        unitsPhysicsGroup = this.createPhysicsGroup();
        bulletsPhysicsGroup = this.createPhysicsGroup();
        enemyBulletsPhysicsGroup = this.createPhysicsGroup();
        
        //this.addUnit("worm", new Phaser.Math.Vector2(100, 200));
        this.addUnit("spawner1", new Phaser.Math.Vector2(100, 100));
        this.addUnit("spawner2", new Phaser.Math.Vector2(25, 25));
        this.addUnit("spawner1", new Phaser.Math.Vector2(850, 100));
        this.addUnit("spawner2", new Phaser.Math.Vector2(925, 25));
        this.addUnit("spawner1", new Phaser.Math.Vector2(100, 575));
        this.addUnit("spawner2", new Phaser.Math.Vector2(25, 650));
        this.addUnit("spawner1", new Phaser.Math.Vector2(850, 575));
        this.addUnit("spawner2", new Phaser.Math.Vector2(925, 650));
        //this.addUnit("worm", new Phaser.Math.Vector2(700, 400));
        //this.addUnit("spawner3", new Phaser.Math.Vector2(200, 500));

        //this.addUnit("bomber", new Phaser.Math.Vector2(400, 200));
        //this.addUnit("bomber", new Phaser.Math.Vector2(500, 200));
        
        // Handle bullet hit on units
        this.physics.add.overlap(bulletsPhysicsGroup, unitsPhysicsGroup, handleBulletHit, null, this);
        // Handle units hitting player
        this.physics.add.overlap(playerPhysicsGroup, unitsPhysicsGroup, handleUnitHit, null, this);
        // Handle enemy bullets or explosions hitting player
        this.physics.add.overlap(playerPhysicsGroup, enemyBulletsPhysicsGroup, handleEnemyBulletHit, null, this);
    }

    addUnit(name: string, location: Phaser.Math.Vector2): Unit {
        let unit = createUnit(name, location, this);
        enemyUnits[unit.id] = unit;
        unit.gameObj.forEach(obj => {
            unitsPhysicsGroup.add(obj);
        });
        return unit;
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
        destroyUnit(enemyUnits[id], this);
        delete enemyUnits[id];
    }

    destroyPlayer() {
        if (player.gameObj && player.gameObj[0]) {
            finalPlayerPos = player.gameObj[0].body.center.clone();
            destroyUnit(player, this);
            player.gameObj[0] = null;
        }
        this.time.delayedCall(2000, () => this.scene.restart());
    }

    moveUnits(targetPos: Phaser.Math.Vector2, delta: number) {
        Object.keys(enemyUnits).forEach(id => {
            // Pass in graphics for some debugging (the arcade physics debug property must be set to true)
            moveUnit(enemyUnits[id], targetPos.clone(), null, this, delta);
        });
    }

    updateUnitsAI(delta) {
        Object.keys(enemyUnits).forEach(id => {
            updateUnitAI(enemyUnits[id], this, delta);
        });
    }

    isStreamWeaponActive() {
        return streamWeaponKey.isDown || this.input.activePointer.leftButtonDown();
    }

    isShotgunWeaponActive() {
        return shotgunWeaponKey.isDown || this.input.activePointer.rightButtonDown();
    }

    update(time, delta) {
        if (player.gameObj[0]) {
            // Enemy movement and AI
            this.moveUnits(player.gameObj[0].body.center, delta);
            this.updateUnitsAI(delta);
            // Player movement
            movePlayerUnit(player, quickTurnKey.isDown, boostKey.isDown,
                thrustKey.isDown, leftTurnKey.isDown, rightTurnKey.isDown, delta);
            if (player.gameObj[0].x < killZoneMinX || player.gameObj[0].x > killZoneMaxX || 
                    player.gameObj[0].y < killZoneMinY || player.gameObj[0].y > killZoneMaxY) {
                this.destroyPlayer();
            }
            // Player weapons
            fireWeapon(this, bulletsPhysicsGroup, delta, player, this.isStreamWeaponActive(), this.isShotgunWeaponActive());
            // Update timer
            timer += delta;
            setTimerText(Math.round(timer / 100.0) / 10);
        } else {
            // Enemy movement
            this.moveUnits(finalPlayerPos, delta);
        }
    }
}