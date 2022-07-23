import { moveUnit, movePlayerUnit } from "../units/Movement";
import { updateUnitAI, handleUnitDestroy } from "../units/AI";
import { fireWeapon } from "../units/Weapon";
import { Unit, createUnit } from "../model/Units";
import { handleBulletHit, handleEnemyBulletHit, handleUnitHit } from "../units/Collision";
import { config } from "../model/Config";
import { incrementTimer, resetTimer } from "../state/TimerState";

// Units
let enemyUnits: { [id: number]: Unit } = {};
let player: Unit;

// Physics groups
let playerPhysicsGroup : Phaser.Physics.Arcade.Group;
let unitsPhysicsGroup : Phaser.Physics.Arcade.Group;
let bulletsPhysicsGroup : Phaser.Physics.Arcade.Group;
let enemyBulletsPhysicsGroup : Phaser.Physics.Arcade.Group;

// Input
let thrustKey : Phaser.Input.Keyboard.Key;
let leftTurnKey : Phaser.Input.Keyboard.Key;
let rightTurnKey : Phaser.Input.Keyboard.Key;
let streamWeaponKey : Phaser.Input.Keyboard.Key;
let shotgunWeaponKey : Phaser.Input.Keyboard.Key;
let quickTurnKey : Phaser.Input.Keyboard.Key;
let boostKey : Phaser.Input.Keyboard.Key;

// Map bounds
let killZoneTopLeft, killZoneBottomRight;

let finalPlayerPos : Phaser.Math.Vector2;
//TODO remove in prod build
let graphics;

/** Main game scene */
export class MainScene extends Phaser.Scene {
    constructor() {
        super({
            key: "MainScene"
        });
    }
    
    /** Create a physics group for units that does not reset drag when adding to the group */
    createPhysicsGroup() {
        let group = this.physics.add.group();
        delete group.defaults.setDragX;
        delete group.defaults.setDragY;
        return group;
    }

    getEnemyBulletsPhysicsGroup() {
        return enemyBulletsPhysicsGroup;
    }

    getKillZoneTopLeft() {
        return killZoneTopLeft;
    }

    getKillZoneBottomRight() {
        return killZoneBottomRight;
    }

    create() {
        enemyUnits = {};
        resetTimer();
        this.cameras.main.setBackgroundColor(config()["backgroundColor"]);
        let background = this.add.image(0, 0, "background").setOrigin(0, 0);
        killZoneTopLeft = background.getTopLeft();
        killZoneBottomRight = background.getBottomRight();

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
        
        // Create units immediately for development
        //this.addUnit("worm", new Phaser.Math.Vector2(100, 200));
        this.addUnit("spawner1", new Phaser.Math.Vector2(175, 175));
        this.addUnit("spawner2", new Phaser.Math.Vector2(100, 100));
        this.addUnit("spawner1", new Phaser.Math.Vector2(killZoneBottomRight.x - 175, 175));
        this.addUnit("spawner2", new Phaser.Math.Vector2(killZoneBottomRight.x - 100, 100));
        this.addUnit("spawner1", new Phaser.Math.Vector2(175, killZoneBottomRight.y - 175));
        this.addUnit("spawner2", new Phaser.Math.Vector2(100, killZoneBottomRight.y - 100));
        this.addUnit("spawner1", new Phaser.Math.Vector2(killZoneBottomRight.x - 175, killZoneBottomRight.y - 175));
        this.addUnit("spawner2", new Phaser.Math.Vector2(killZoneBottomRight.x - 100, killZoneBottomRight.y - 100));
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
        player = createUnit("player", new Phaser.Math.Vector2(killZoneBottomRight.x / 2, killZoneBottomRight.y / 2), this);
    }

    getUnit(id: number) {
        if (id == player.id) {
            return player;
        }
        if (!id || !(id in enemyUnits)) {
            return null;
        }
        return enemyUnits[id];
    }

    destroyUnitById(id: number) {
        this.destroyUnit(enemyUnits[id]);
        delete enemyUnits[id];
    }

    destroyUnit(unit: Unit) {
        handleUnitDestroy(unit, this);
        unit.gameObj.forEach(obj => {
            obj.destroy();
        });
    }

    destroyPlayer() {
        if (player.gameObj && player.gameObj[0]) {
            finalPlayerPos = player.gameObj[0].body.center.clone();
            this.destroyUnit(player);
            player.gameObj[0] = null;
        }
        if (config()["automaticRestart"]["enabled"]) {
            this.time.delayedCall(config()["automaticRestart"]["restartTime"],
                () => this.scene.restart());
        }
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

    /** Main game update loop */
    update(time, delta) {
        if (player.gameObj[0]) {
            // Enemy movement and AI
            this.moveUnits(player.gameObj[0].body.center, delta);
            this.updateUnitsAI(delta);
            // Player movement
            movePlayerUnit(player, quickTurnKey.isDown, boostKey.isDown,
                thrustKey.isDown, leftTurnKey.isDown, rightTurnKey.isDown, delta);
            if (player.gameObj[0].x < killZoneTopLeft.x || player.gameObj[0].x > killZoneBottomRight.x || 
                    player.gameObj[0].y < killZoneTopLeft.y || player.gameObj[0].y > killZoneBottomRight.y) {
                this.destroyPlayer();
            }
            // Player weapons
            fireWeapon(this, bulletsPhysicsGroup, delta, player, this.isStreamWeaponActive(), this.isShotgunWeaponActive());
            // Update timer
            incrementTimer(delta);
        } else {
            // Enemy movement
            this.moveUnits(finalPlayerPos, delta);
        }
    }
}