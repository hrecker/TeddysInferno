import { moveUnit, movePlayerUnit, moveGem } from "../units/Movement";
import { updateUnitAI, handleUnitDestroy } from "../units/AI";
import { activateBomb, fireEnemyWeapon, fireWeapon } from "../units/Weapon";
import { Unit, createUnit } from "../model/Units";
import { handleBulletHit, handleEnemyBulletHit, handleUnitHit, handleGemHit } from "../units/Collision";
import { config } from "../model/Config";
import { createGem } from "../model/Gem";
import { countdownSpawns, startSpawn } from "../units/Spawn";
import { getSpawns, resetSpawnset } from "../model/Spawnset";
import { saveGameResult } from "../state/GameResultState";
import { GameResult } from "../model/GameResult";
import { playerDeathEvent, playerSpawnEvent, timerEvent } from "../events/EventMessenger";

// Units
let enemyUnits: { [id: number]: Unit } = {};
let stealerUnits: { [id: number]: Unit } = {};
let gems: { [id: number]: Phaser.Types.Physics.Arcade.ImageWithDynamicBody } = {};
let player: Unit;

// Physics groups
let playerPhysicsGroup : Phaser.Physics.Arcade.Group;
let unitsPhysicsGroup : Phaser.Physics.Arcade.Group;
let bulletsPhysicsGroup : Phaser.Physics.Arcade.Group;
let enemyBulletsPhysicsGroup : Phaser.Physics.Arcade.Group;
let gemPhysicsGroup : Phaser.Physics.Arcade.Group;

// Input
let thrustKey : Phaser.Input.Keyboard.Key;
let leftTurnKey : Phaser.Input.Keyboard.Key;
let rightTurnKey : Phaser.Input.Keyboard.Key;
let streamWeaponKey : Phaser.Input.Keyboard.Key;
let shotgunWeaponKey : Phaser.Input.Keyboard.Key;
let quickTurnKey : Phaser.Input.Keyboard.Key;
let boostKey : Phaser.Input.Keyboard.Key;
let bombKey: Phaser.Input.Keyboard.Key;

// Map bounds
let killZoneTopLeft, killZoneBottomRight;
const spawnMargin = 32;

let bombRepelRemainingMs = 0;
let finalPlayerPos : Phaser.Math.Vector2;
//TODO remove in prod build
let graphics;

let gameResult: GameResult;
let timer = 0;

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

    resetTimer() {
        this.setTimer(0);
    }

    incrementTimer(delta) {
        this.setTimer(timer + delta);
    }

    setTimer(value: number) {
        timer = value;
        timerEvent(timer);
    }

    create() {
        enemyUnits = {};
        stealerUnits = {};
        gems = {};
        gameResult = {
            score: 0,
            gemsCollected: 0,
            enemiesKilled: 0,
            shotsFired: 0
        };
        this.resetTimer();
        resetSpawnset();
        playerSpawnEvent();
        this.cameras.main.setBackgroundColor(config()["backgroundColor"]);
        let background = this.add.image(0, 0, "background").setOrigin(0, 0);
        killZoneTopLeft = background.getTopLeft();
        killZoneBottomRight = background.getBottomRight();

        // Create graphics and enable debug mode to show some more movement graphics
        //graphics = this.add.graphics();
        this.createPlayerUnit();
        this.cameras.main.startFollow(player.gameObj[0]);

        thrustKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        leftTurnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        rightTurnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        streamWeaponKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O);
        shotgunWeaponKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
        quickTurnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
        boostKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        bombKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.input.mouse.disableContextMenu();

        playerPhysicsGroup = this.createPhysicsGroup();
        playerPhysicsGroup.add(player.gameObj[0]);
        unitsPhysicsGroup = this.createPhysicsGroup();
        bulletsPhysicsGroup = this.createPhysicsGroup();
        enemyBulletsPhysicsGroup = this.createPhysicsGroup();
        gemPhysicsGroup = this.createPhysicsGroup();

        // For debugging
        //this.addUnit("worm", new Phaser.Math.Vector2(100, 400));
        //this.addUnit("looper", new Phaser.Math.Vector2(200, 400));
        //this.addUnit("bomber", new Phaser.Math.Vector2(500, 400));
        //this.addUnit("bomber", new Phaser.Math.Vector2(700, 400));
        this.addUnit("bomber", new Phaser.Math.Vector2(900, 400));
        //this.addUnit("spawner1", new Phaser.Math.Vector2(300, 400));
        //this.addUnit("spawner2", new Phaser.Math.Vector2(500, 400));
        //this.addUnit("spawner3", new Phaser.Math.Vector2(700, 400));
        
        // Handle bullet hit on units
        this.physics.add.overlap(bulletsPhysicsGroup, unitsPhysicsGroup, handleBulletHit, null, this);
        // Handle units hitting player
        this.physics.add.overlap(playerPhysicsGroup, unitsPhysicsGroup, handleUnitHit, null, this);
        // Handle enemy bullets or explosions hitting player
        this.physics.add.overlap(playerPhysicsGroup, enemyBulletsPhysicsGroup, handleEnemyBulletHit, null, this);
        // Handle gems hitting player
        this.physics.add.overlap(playerPhysicsGroup, gemPhysicsGroup, handleGemHit, null, this);
        // Handle gems hitting units
        this.physics.add.overlap(unitsPhysicsGroup, gemPhysicsGroup, handleGemHit, null, this);
    }

    /** Start the spawn animation for a unit */
    startUnitSpawn(name: string, location?: Phaser.Math.Vector2) {
        if (! location) {
            let randomX = (Math.random() * (killZoneBottomRight.x - killZoneTopLeft.x - (2 * spawnMargin))) + spawnMargin + killZoneTopLeft.x;
            let randomY = (Math.random() * (killZoneBottomRight.y - killZoneTopLeft.y - (2 * spawnMargin))) + spawnMargin + killZoneTopLeft.y;
            location = new Phaser.Math.Vector2(randomX, randomY);
        }
        let portal = this.add.image(location.x, location.y, "spawnportal").setAlpha(0);
        this.tweens.add({
            targets: portal,
            alpha: {
                from: 0,
                to: 0.9
            },
            duration: config()["unitSpawnTweenLoopMs"],
            yoyo: true,
            loop: 100,
        });
        startSpawn(name, location, portal);
    }

    /** Wait for spawn animations to complete. If any complete, spawn the unit. */
    updateSpawns(delta: number) {
        let completed = countdownSpawns(delta);
        completed.forEach(spawn => {
            this.addUnit(spawn.name, spawn.location);
        });
    }

    addUnit(name: string, location: Phaser.Math.Vector2): Unit {
        let unit = createUnit(name, location, this);
        enemyUnits[unit.id] = unit;
        unit.gameObj.forEach(obj => {
            unitsPhysicsGroup.add(obj);
        });
        //TODO if future stealers added, modify this
        if (unit.name == "stealer1") {
            stealerUnits[unit.id] = unit;
        }
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

    getEnemyUnits(): Unit[] {
        let units = [];
        Object.keys(enemyUnits).forEach(id => {
            units.push(enemyUnits[id]);
        });
        return units;
    }

    getPlayer() {
        return player;
    }

    addGem(location: Phaser.Math.Vector2): Phaser.Types.Physics.Arcade.ImageWithDynamicBody {
        let gem = createGem(location, this);
        gems[gem.getData("id")] = gem;
        gemPhysicsGroup.add(gem);
        return gem;
    }

    destroyGem(gem: Phaser.Types.Physics.Arcade.ImageWithDynamicBody, collectedByPlayer: boolean) {
        let id = gem.getData("id");
        gem.destroy();
        delete gems[id];
        if (collectedByPlayer) {
            gameResult.gemsCollected++;
        }
    }

    destroyUnitById(id: number) {
        this.destroyUnit(enemyUnits[id]);
        delete enemyUnits[id];
        if (id in stealerUnits) {
            delete stealerUnits[id];
        }
    }

    destroyUnit(unit: Unit) {
        handleUnitDestroy(unit, this);
        unit.gameObj.forEach(obj => {
            obj.destroy();
        });
        if (unit.name != "bomb" && unit.name != "player") {
            gameResult.enemiesKilled++;
        }
    }

    destroyPlayer() {
        if (player.gameObj && player.gameObj[0]) {
            finalPlayerPos = player.gameObj[0].body.center.clone();
            this.destroyUnit(player);
            player.gameObj[0] = null;
            gameResult.score = Math.floor(timer) / 1000.0;
            saveGameResult(gameResult);
            playerDeathEvent();
        }
        if (config()["automaticRestart"]["enabled"]) {
            this.time.delayedCall(config()["automaticRestart"]["restartTime"],
                () => this.scene.restart());
        }
    }

    moveUnits(targetPos: Phaser.Math.Vector2, delta: number, isBombRepelActive: boolean) {
        if (graphics) {
            graphics.clear();
        }
        Object.keys(enemyUnits).forEach(id => {
            // Pass in graphics for some debugging (the arcade physics debug property must be set to true)
            moveUnit(enemyUnits[id], targetPos.clone(), graphics, this, delta, isBombRepelActive);
        });
    }

    /** Check if any player input is active that will stop gems from homing to player.
     * This includes firing the weapon and waiting for cooldown on the weapon.
     */
    anyGemRepelInputActive() {
        return (!player.gameObj[0]) || player.state.weaponCooldownRemainingMs > 0 || this.isStreamWeaponActive() || this.isShotgunWeaponActive();
    }

    moveGems() {
        Object.keys(gems).forEach(id => {
            moveGem(gems[id], stealerUnits, player, this.anyGemRepelInputActive());
        });
    }

    updateUnitsAI(delta) {
        Object.keys(enemyUnits).forEach(id => {
            updateUnitAI(enemyUnits[id], this, delta);
        });
    }

    fireUnitWeapons(delta) {
        Object.keys(enemyUnits).forEach(id => {
            fireEnemyWeapon(enemyUnits[id], player, this, delta);
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
        if (bombRepelRemainingMs > 0) {
            bombRepelRemainingMs -= delta;
        }

        if (player.gameObj[0]) {
            // Enemy movement, AI, and weapons
            this.moveUnits(player.gameObj[0].body.center, delta, bombRepelRemainingMs > 0);
            this.updateUnitsAI(delta);
            this.fireUnitWeapons(delta);
            // Gem movement
            this.moveGems();
            // Player movement
            movePlayerUnit(player, quickTurnKey.isDown, boostKey.isDown,
                thrustKey.isDown, leftTurnKey.isDown, rightTurnKey.isDown, delta);
            if (player.gameObj[0].x < killZoneTopLeft.x || player.gameObj[0].x > killZoneBottomRight.x || 
                    player.gameObj[0].y < killZoneTopLeft.y || player.gameObj[0].y > killZoneBottomRight.y) {
                this.destroyPlayer();
            } else {
                // Player weapons
                gameResult.shotsFired += fireWeapon(this, bulletsPhysicsGroup, delta, player, this.isStreamWeaponActive(), this.isShotgunWeaponActive());
                if (activateBomb(this, delta, player, bombKey.isDown)) {
                    bombRepelRemainingMs = config()["bombRepelDurationMs"];
                }
                // Update timer
                this.incrementTimer(delta);
                // Spawning enemies
                /*getSpawns(timer).forEach(toSpawn => {
                    this.startUnitSpawn(toSpawn);
                });*/
            }
        } else {
            // Enemy movement
            this.moveUnits(finalPlayerPos, delta, bombRepelRemainingMs > 0);
            // Gem movement
            this.moveGems();
        }
        this.updateSpawns(delta);
    }
}