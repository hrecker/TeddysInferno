import { moveUnit, movePlayerUnit, moveGem, recordPlayerPosition } from "../units/Movement";
import { updateUnitAI, handleUnitDestroy } from "../units/AI";
import { activateBomb, fireEnemyWeapon, fireWeapon } from "../units/Weapon";
import { Unit, createUnit, getWormSegmentLocations } from "../model/Units";
import { handleBulletHit, handleEnemyBulletHit, handleUnitHit, handleGemHit } from "../units/Collision";
import { config } from "../model/Config";
import { createGem } from "../model/Gem";
import { countdownSpawns, resetSpawns, startSpawn } from "../units/Spawn";
import { getSpawns, resetSpawnset } from "../model/Spawnset";
import { saveGameResult } from "../state/GameResultState";
import { GameResult } from "../model/GameResult";
import { playerDeathEvent, playerSpawnEvent, timerEvent } from "../events/EventMessenger";
import { flashSprite, getRandomArrayElements, isOutsideBounds } from "../util/Util";
import { getSound, loadSounds, playSound, SoundEffect } from "../model/Sound";
import { getStartingBombCount, setBombs } from "../units/UnitStatus";
import { Challenge, getCurrentChallenge } from "../state/ChallengeState";

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
let reverseThrustKey : Phaser.Input.Keyboard.Key;
let leftTurnKey : Phaser.Input.Keyboard.Key;
let rightTurnKey : Phaser.Input.Keyboard.Key;
let upKey : Phaser.Input.Keyboard.Key;
let downKey : Phaser.Input.Keyboard.Key;
let slowTurnKey : Phaser.Input.Keyboard.Key;
let streamWeaponKey : Phaser.Input.Keyboard.Key;
let shotgunWeaponKey : Phaser.Input.Keyboard.Key;
let quickTurnKey : Phaser.Input.Keyboard.Key;
let boostKey : Phaser.Input.Keyboard.Key;
let bombKey : Phaser.Input.Keyboard.Key;

// Reticule for twin-stick mode
let reticule: Phaser.GameObjects.Image;

// Map bounds
let killZoneTopLeft, killZoneBottomRight;
let enemyKillZoneTopLeft, enemyKillZoneBottomRight;
const spawnMargin = 32;
let spawnRegions: Phaser.Math.Vector2[][] = [];

let bombRepelRemainingMs = 0;
let finalPlayerPos : Phaser.Math.Vector2;
let graphics;

let gameResult: GameResult;
let timer = 0;

// FX
let particles: Phaser.GameObjects.Particles.ParticleEmitterManager;
let bulletParticleEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
let gemParticleEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
let spawnerParticleEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
let unitParticleEmitters: { [color: number]: Phaser.GameObjects.Particles.ParticleEmitter };
let shakeIntensity: number;
let shakeDuration: number;

let enemyDeathSoundsActive = 0;

// FPS timing for debugging
//let fpsCount = 0;
//let fpsTimer = -1;

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

    getEnemyKillZoneTopLeft() {
        return enemyKillZoneTopLeft;
    }

    getEnemyKillZoneBottomRight() {
        return enemyKillZoneBottomRight;
    }

    getBulletParticleEmitter(): Phaser.GameObjects.Particles.ParticleEmitter {
        return bulletParticleEmitter;
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

    shake(durationMs: number, intensity: number) {
        // Ensure lower intensity/duration shakes don't override a higher intensity/duration shake
        if (intensity > shakeIntensity) {
            shakeIntensity = intensity;
        }
        if (durationMs > shakeDuration) {
            shakeDuration = durationMs;
        }
    }

    // Set the scene timescale - 0.5 is half speed, 1 is normal speed, 2 is double speed, etc.
    setTimescale(timescale: number) {
        // Physics world uses the inverse value
        this.physics.world.timeScale = timescale == 0 ? 1 / Number.MAX_SAFE_INTEGER : 1 / timescale;
        this.time.timeScale = timescale;
        this.tweens.timeScale = timescale;
    }

    create() {
        this.setTimescale(1);
        enemyUnits = {};
        stealerUnits = {};
        gems = {};
        gameResult = {
            score: 0,
            gemsCollected: 0,
            enemiesKilled: 0,
            shotsFired: 0,
            deaths: 0
        };
        this.input.setDefaultCursor("none");
        this.resetTimer();
        resetSpawnset();
        resetSpawns();
        playerSpawnEvent();
        this.cameras.main.setBackgroundColor(config()["backgroundColor"]);
        this.add.shader("Tunnel", config()["gameAreaWidth"] / 2, config()["gameAreaHeight"] / 2,
                1, 1, ["shaderTexture"]).setScale(config()["shaderWidth"], config()["shaderWidth"]);
        let background = this.add.image(0, 0, "background").setOrigin(0, 0).setAlpha(0.7);
        background.setScale(config()["gameAreaWidth"] / background.width, config()["gameAreaHeight"] / background.height);
        killZoneTopLeft = background.getTopLeft();
        killZoneBottomRight = background.getBottomRight();
        let enemyKillBarrier = this.add.image(killZoneBottomRight.x / 2, killZoneBottomRight.y / 2, "enemyKillBarrier").setAlpha(0.7);
        enemyKillBarrier.setScale(config()["gameAreaWidth"] / background.width, config()["gameAreaHeight"] / background.height);
        enemyKillZoneTopLeft = enemyKillBarrier.getTopLeft();
        enemyKillZoneBottomRight = enemyKillBarrier.getBottomRight();


        // Create nine spawn regions. Used when units spawn at the same time to prevent spawning
        // on top of each other.
        spawnRegions = [];
        for (let i = 0; i < 3; i++) {
            let minX = i * background.width / 3;
            let maxX = (i + 1) * background.width / 3;
            for (let j = 0; j < 3; j++) {
                let minY = j * background.height / 3;
                let maxY = (j + 1) * background.height / 3;
                spawnRegions.push([new Phaser.Math.Vector2(minX, minY), new Phaser.Math.Vector2(maxX, maxY)]);
            }
        }

        // Create graphics and enable debug mode to show some more movement graphics
        //graphics = this.add.graphics();

        thrustKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        upKey = thrustKey;
        reverseThrustKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        downKey = reverseThrustKey;
        leftTurnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        rightTurnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        slowTurnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
        streamWeaponKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O);
        shotgunWeaponKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
        quickTurnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
        boostKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        bombKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.input.mouse.disableContextMenu();

        playerPhysicsGroup = this.createPhysicsGroup();
        unitsPhysicsGroup = this.createPhysicsGroup();
        bulletsPhysicsGroup = this.createPhysicsGroup();
        enemyBulletsPhysicsGroup = this.createPhysicsGroup();
        gemPhysicsGroup = this.createPhysicsGroup();

        // SFX
        let stealerSound = getSound(SoundEffect.StealerActive);
        if (stealerSound) {
            stealerSound.stop();
        }
        loadSounds(this);

        // Particle emitters
        particles = this.add.particles('particle');
        bulletParticleEmitter = particles.createEmitter({
            speed: 150,
            gravityY: 0,
            scale: 1.5,
            tint: 0xF98284,
            angle: { min: -90, max: 90 },
            frequency: -1,
            rotate: { min: 0, max: 360 }
        }).setAlpha(function (p, k, t) {
            return 1 - t;
        });
        spawnerParticleEmitter = particles.createEmitter({
            speed: 150,
            gravityY: 0,
            scale: 2,
            tint: 0xD9C8BF,
            frequency: -1,
            rotate: { min: 0, max: 360 }
        }).setAlpha(function (p, k, t) {
            return 1 - t;
        });
        unitParticleEmitters = {};
        gemParticleEmitter = particles.createEmitter({
            speed: 250,
            gravityY: 0,
            tint: 0xFFF7A0,
            rotate: { min: 0, max: 360 },
            frequency: -1
        }).setAlpha(function (p, k, t) {
            return 1 - t;
        });

        // Apply a glow effect to the scene
        // https://rexrainbow.github.io/phaser3-rex-notes/docs/site/shader-glowfilter/
        this.plugins.get('rexGlowFilterPipeline').add(this.cameras.main, {
            intensity: config()["glowStrength"]
        });
        
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

        // Create the player
        this.createPlayerUnit();
        playerPhysicsGroup.add(player.gameObj[0]);
        this.cameras.main.startFollow(player.gameObj[0]);

        if (getCurrentChallenge() == Challenge.TwinStick) {
            reticule = this.add.image(-100, -100, "reticule");
        }

        // For debugging
        //this.addUnit("worm", new Phaser.Math.Vector2(100, 400));
        //this.addUnit("looper", new Phaser.Math.Vector2(200, 400));
        //this.addUnit("bomber", new Phaser.Math.Vector2(500, 400));
        //this.addUnit("spawner3", new Phaser.Math.Vector2(700, 400));
        //this.addUnit("bomber", new Phaser.Math.Vector2(700, 400));
        //this.addUnit("bomber", new Phaser.Math.Vector2(900, 400));
        //this.addUnit("spawner1", new Phaser.Math.Vector2(600, 400));
        //this.addUnit("spawner2", new Phaser.Math.Vector2(500, 400));
        //this.addUnit("obstacle", new Phaser.Math.Vector2(500, 600));
        //this.addUnit("stealer1", new Phaser.Math.Vector2(700, 400));
        //this.addUnit("stealer2", new Phaser.Math.Vector2(500, 600));
    }
    
    /** Start the spawn animation for a set of units, preventing them from spawning on top of each other when possible */
    startUnitSpawns(names: string[]) {
        if (names.length == 0) {
            return;
        }

        if (names.length == 1) {
            this.startUnitSpawn(names[0]);
            return;
        }

        let chosenSpawnRegions = getRandomArrayElements(spawnRegions, Math.min(spawnRegions.length, names.length));
        for (let i = 0; i < names.length; i++) {
            let spawnRegion = chosenSpawnRegions[i % spawnRegions.length];
            let randomX = (Math.random() * (spawnRegion[1].x - spawnRegion[0].x - (2 * spawnMargin))) + spawnMargin + spawnRegion[0].x;
            let randomY = (Math.random() * (spawnRegion[1].y - spawnRegion[0].y - (2 * spawnMargin))) + spawnMargin + spawnRegion[0].y;
            this.startUnitSpawn(names[i], new Phaser.Math.Vector2(randomX, randomY));
        }
    }

    /** Start the spawn animation for a unit */
    startUnitSpawn(name: string, location?: Phaser.Math.Vector2) {
        // Spawn stealer2 in the very center
        if (name == "stealer2") {
            location = new Phaser.Math.Vector2(killZoneBottomRight.x / 2, killZoneBottomRight.y / 2);
        } else if (! location) {
            let randomX = (Math.random() * (killZoneBottomRight.x - killZoneTopLeft.x - (2 * spawnMargin))) + spawnMargin + killZoneTopLeft.x;
            let randomY = (Math.random() * (killZoneBottomRight.y - killZoneTopLeft.y - (2 * spawnMargin))) + spawnMargin + killZoneTopLeft.y;
            location = new Phaser.Math.Vector2(randomX, randomY);
        }
        let portals = [this.createSpawnPortal(location)];
        spawnerParticleEmitter.explode(config()["spawnStartParticleCount"], location.x, location.y);
        let randomRotation = -Math.PI + (Math.random() * 2 * Math.PI);
        if (name == "worm") {
            getWormSegmentLocations(location, randomRotation).forEach(segmentLocation => {
                portals.push(this.createSpawnPortal(segmentLocation));
                spawnerParticleEmitter.explode(config()["spawnStartParticleCount"], segmentLocation.x, segmentLocation.y);
            });
        }
        if (name in config()["spawnPortalScale"]) {
            portals.forEach(portal => {
                portal.setTexture("spawnportalx" + config()["spawnPortalScale"][name]);
            });
        }
        startSpawn(name, location, portals, randomRotation);
        playSound(this, SoundEffect.Spawning);
    }

    createSpawnPortal(location: Phaser.Types.Math.Vector2Like): Phaser.GameObjects.Image {
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
        return portal;
    }

    /** Wait for spawn animations to complete. If any complete, spawn the unit. */
    updateSpawns(delta: number) {
        let completed = countdownSpawns(delta);
        completed.forEach(spawn => {
            this.addUnit(spawn.name, spawn.location, spawn.rotation);
            playSound(this, SoundEffect.EnemySpawned);
        });
    }

    addUnit(name: string, location: Phaser.Math.Vector2, rotation?: number): Unit {
        if (! rotation) {
            rotation = 0;
        }
        let unit = createUnit(name, location, this, rotation);
        enemyUnits[unit.id] = unit;
        unit.gameObj.forEach(obj => {
            unitsPhysicsGroup.add(obj);
        });
        this.explodeParticlesColor(unit.color, location);
        if (name == "worm") {
            getWormSegmentLocations(location, rotation).forEach(segmentLocation => {
               this.explodeParticlesColor(unit.color, segmentLocation);
            });
        }
        if (unit.name.startsWith("stealer")) {
            stealerUnits[unit.id] = unit;
            playSound(this, SoundEffect.StealerActive, true);
        }
        return unit;
    }

    createPlayerUnit() {
        let spawn = new Phaser.Math.Vector2(killZoneBottomRight.x / 2, killZoneBottomRight.y / 2);
        player = createUnit("player", spawn, this);
        setBombs(player, getStartingBombCount());
        this.explodeParticlesColor(player.color, spawn);
    }

    explodeParticlesColor(color: number, location: Phaser.Types.Math.Vector2Like, quantity?: number) {
        if (! (color in unitParticleEmitters)) {
            // Create separate particle emitters for each color
            let newParticleEmitter = particles.createEmitter({
                speed: 150,
                gravityY: 0,
                scale: 1.5,
                frequency: -1,
                tint: color,
                rotate: { min: 0, max: 360 }
            }).setAlpha(function (p, k, t) {
                return 1 - t;
            });
            unitParticleEmitters[color] = newParticleEmitter;
        }
        if (! quantity) {
            quantity = config()["spawnCompleteParticleCount"];
        }
        unitParticleEmitters[color].explode(quantity, location.x, location.y);
    }

    gemParticles(location: Phaser.Math.Vector2, count?: number) {
        if (! count) {
            count = config()["gemParticleCount"];
        }
        gemParticleEmitter.explode(count, location.x, location.y);
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
            // If there are no more stealers, stop the sound
            if (Object.keys(stealerUnits).length == 0) {
                getSound(SoundEffect.StealerActive).stop();
            }
        }
    }

    startUnitDeathAnimation(unitName: string, gameObj: Phaser.Types.Physics.Arcade.ImageWithDynamicBody) {
        let pos = gameObj.body.center;
        let deathImages: Phaser.Types.Physics.Arcade.ImageWithDynamicBody[] = [];
        deathImages.push(this.physics.add.image(pos.x, pos.y, unitName + "death1").setOrigin(1, 1).setAngle(gameObj.angle));
        deathImages.push(this.physics.add.image(pos.x, pos.y, unitName + "death2").setOrigin(0, 1).setAngle(gameObj.angle));
        deathImages.push(this.physics.add.image(pos.x, pos.y, unitName + "death3").setOrigin(0, 0).setAngle(gameObj.angle));
        deathImages.push(this.physics.add.image(pos.x, pos.y, unitName + "death4").setOrigin(1, 0).setAngle(gameObj.angle));
        // Spawn each death image on top of its starting position and then move in a random direction while fading out
        deathImages.forEach(image => {
            let randomVel = Phaser.Math.Vector2.RIGHT.clone().rotate(Math.random() * 2 * Math.PI).scale(40);
            image.setVelocity(randomVel.x, randomVel.y);
            image.setDrag(30);
            this.tweens.add({
                targets: image,
                alpha: {
                    from: 1,
                    to: 0
                },
                duration: 1000,
                onComplete: () => {
                    image.destroy();
                }
            });
            // Flash death images white for a moment
            flashSprite(image, 200, this);
        });
    }

    destroyUnit(unit: Unit) {
        if (! unit.skipDeathAnimation) {
            this.startUnitDeathAnimation(unit.name, unit.gameObj[0]);
            if (unit.name == "worm") {
                for (let i = 1; i < unit.gameObj.length; i++) {
                    this.startUnitDeathAnimation("wormsegment", unit.gameObj[i]);
                }
            }
        }

        handleUnitDestroy(unit, this);
        unit.gameObj.forEach(obj => {
            obj.destroy();
        });
        if (unit.name != "bomb" && unit.name != "player") {
            gameResult.enemiesKilled++;
            // Don't let enemy death sounds stack too much or they can get very loud
            if (enemyDeathSoundsActive < 3) {
                enemyDeathSoundsActive++;
                playSound(this, SoundEffect.EnemyDeath);
            }
        }
        this.shake(250, 0.003);
    }

    destroyPlayer() {
        if (player.gameObj && player.gameObj[0]) {
            finalPlayerPos = player.gameObj[0].body.center.clone();
            this.destroyUnit(player);
            player.gameObj[0] = null;
            gameResult.score = Math.floor(timer) / 1000.0;
            gameResult.deaths = 1;
            saveGameResult(gameResult);
            playerDeathEvent();
            playSound(this, SoundEffect.Death);
            // slowmo effect
            this.setTimescale(0.4);
            // Show the mouse again
            this.input.setDefaultCursor("default");
            if (getCurrentChallenge() == Challenge.TwinStick) {
                reticule.destroy();
            }
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

    updateUnitsAI(delta, filter?) {
        let units = Object.keys(enemyUnits);
        if (filter) {
            units = units.filter(filter);
        }
        units.forEach(id => {
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

    getThrustKey(): Phaser.Input.Keyboard.Key {
        if (getCurrentChallenge() == Challenge.InReverse) {
            return reverseThrustKey;
        }
        return thrustKey;
    }

    isThrustKeyDown(): boolean {
        if (getCurrentChallenge() == Challenge.EngineFailure) {
            return false;
        }
        return this.getThrustKey().isDown;
    }

    drawPlayerTrail() {
        if (player.gameObj[0] && player.state.lastPositions.length > 1 && player.gameObj[0].body.velocity.length() > 0) {
            let newGraphics = this.add.graphics();
            // Draw a line between the last two player positions each frame
            newGraphics.lineStyle(4, player.color, config()["playerTrailStartingAlpha"]);
            newGraphics.lineBetween(player.state.lastPositions[0].x, player.state.lastPositions[0].y, player.state.lastPositions[1].x, player.state.lastPositions[1].y)
            this.tweens.add({
                targets: newGraphics,
                alpha: {
                    from: config()["playerTrailStartingAlpha"],
                    to: 0
                },
                duration: 1000,
                onComplete: () => {
                    newGraphics.destroy();
                }
            });
        }
    }

    /** Main game update loop */
    update(time, delta) {
        if (shakeDuration > 0) {
            this.cameras.main.shake(shakeDuration, shakeIntensity);
        }
        shakeIntensity = -1;
        shakeDuration = -1;
        enemyDeathSoundsActive = 0;
        // FPS timing for debugging
        //if (fpsTimer == -1) {
        //    fpsTimer = 0;
        //}
        //fpsCount++;
        //fpsTimer += delta;
        //if (fpsTimer >= 1000) {
        //    fpsTimer = fpsTimer - 1000;
        //    if (fpsCount < 50)
        //        console.log("low FPS: " + fpsCount);
        //    fpsCount = 0;
        //}

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
            let reticuleX = 0;
            let reticuleY = 0;
            if (getCurrentChallenge() == Challenge.TwinStick) {
                let reticulePos = this.cameras.main.getWorldPoint(this.input.mousePointer.x, this.input.mousePointer.y)
                reticule.setPosition(reticulePos.x, reticulePos.y);
                reticuleX = reticule.x;
                reticuleY = reticule.y;
            }
            movePlayerUnit(player, quickTurnKey.isDown, boostKey.isDown,
                this.isThrustKeyDown(), leftTurnKey.isDown, rightTurnKey.isDown,
                upKey.isDown, downKey.isDown, slowTurnKey.isDown,
                reticuleX, reticuleY, this, delta);
            if (isOutsideBounds(player.gameObj[0].body.center, killZoneTopLeft, killZoneBottomRight)) {
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
                this.startUnitSpawns(getSpawns(timer));
            }
            recordPlayerPosition(player);
            this.drawPlayerTrail();
        } else {
            // Enemy movement
            this.moveUnits(finalPlayerPos, delta, bombRepelRemainingMs > 0);
            // Keep updating bombs after player dies
            this.updateUnitsAI(delta, unitId => {
                return enemyUnits[unitId].ai == "bomb";
            });
            // Gem movement
            this.moveGems();
        }
        this.updateSpawns(delta);
    }
}