import { Ability, abilityEvent } from "../events/EventMessenger";
import { config } from "../model/Config";
import { playSound, SoundEffect } from "../model/Sound";
import { Unit } from "../model/Units";
import { MainScene } from "../scenes/MainScene";
import { Challenge, getCurrentChallenge } from "../state/ChallengeState";
import { isOutsideBounds } from "../util/Util";

export enum MovementState {
    Neutral = "Neutral",
    Recovering = "Recovering"
}

/** Move the player unit for a frame based on inputs */
export function movePlayerUnit(player: Unit, quickTurnActive: boolean, boostActive: boolean,
                               thrustActive: boolean, leftActive: boolean, rightActive: boolean,
                               upActive: boolean, downActive: boolean, slowTurnActive: boolean,
                               reticuleX: number, reticuleY: number, scene: MainScene, delta: number) {
    let canQuickTurn = true;
    // Quick turning is pointless in twin-stick mode, so disable it there
    if (getCurrentChallenge() == Challenge.TwinStick || player.state.quickTurnCooldownRemainingMs > 0) {
        player.state.quickTurnCooldownRemainingMs -= delta;
        canQuickTurn = false;
    }
    let canBoost = true;
    if (player.state.boostCooldownRemainingMs > 0) {
        player.state.boostCooldownRemainingMs -= delta;
        canBoost = false;
    }

    if (quickTurnActive && canQuickTurn) {
        player.gameObj[0].setRotation(player.gameObj[0].rotation + Math.PI);
        player.state.quickTurnCooldownRemainingMs = getAbilityCooldown(Ability.QuickTurn);;
        abilityEvent(Ability.QuickTurn, player.state.quickTurnCooldownRemainingMs);
        playSound(scene, SoundEffect.Ability);
        // Draw some echo images implying the turn and spawn some particles
        for (let i = 2; i >= 1; i--) {
            let rot = player.gameObj[0].rotation + (Math.PI / 2 * i);
            let pos = player.gameObj[0].body.center.clone().add(Phaser.Math.Vector2.RIGHT.clone().rotate(rot).scale(5));
            let echoImage = scene.add.image(pos.x, pos.y, "player").setRotation(rot);
            scene.tweens.add({
                targets: echoImage,
                alpha: {
                    from: 1,
                    to: 0
                },
                duration: config()["playerBoostDurationMs"],
                onComplete: () => {
                    echoImage.destroy();
                }
            });
        }
        scene.explodeParticlesColor(player.color, player.gameObj[0].body.center);
    } else if (getCurrentChallenge() == Challenge.TwinStick) {
        let facingDirection = new Phaser.Math.Vector2(reticuleX, reticuleY).subtract(player.gameObj[0].body.center);
        player.gameObj[0].setRotation(facingDirection.angle());
        console.log(player.gameObj[0].body.velocity);
    } else {
        if (leftActive && !rightActive) {
            player.gameObj[0].setRotation(player.gameObj[0].rotation - getPlayerTurnSpeed(slowTurnActive));
        }
        if (!leftActive && rightActive) {
            player.gameObj[0].setRotation(player.gameObj[0].rotation + getPlayerTurnSpeed(slowTurnActive));
        }
    }

    let isBoosting = false;
    if (player.state.activeBoostRemainingMs > 0) {
        player.state.activeBoostRemainingMs -= delta;
        isBoosting = true;
        player.gameObj[0].setAcceleration(0, 0);
        player.gameObj[0].setVelocity(player.state.boostDirection.x, player.state.boostDirection.y);
        // Draw some echo images and particles while boosting
        let echoImage = scene.add.image(player.gameObj[0].body.center.x, player.gameObj[0].body.center.y, "player");
        echoImage.setRotation(player.gameObj[0].rotation);
        scene.tweens.add({
            targets: echoImage,
            alpha: {
                from: 1,
                to: 0
            },
            duration: config()["playerBoostDurationMs"],
            onComplete: () => {
                echoImage.destroy();
            }
        });
        scene.explodeParticlesColor(player.color, player.gameObj[0].body.center);
    }

    if (boostActive && canBoost) {
        player.state.activeBoostRemainingMs = config()["playerBoostDurationMs"];
        player.state.boostCooldownRemainingMs = getAbilityCooldown(Ability.Boost);
        isBoosting = true;
        player.gameObj[0].setAcceleration(0, 0);
        let velocity = getPlayerForwardDirection(player).scale(adjustSpeed(config()["playerBoostSpeed"]));
        player.state.boostDirection = velocity;
        player.gameObj[0].setVelocity(velocity.x, velocity.y);
        abilityEvent(Ability.Boost, player.state.boostCooldownRemainingMs);
        playSound(scene, SoundEffect.Ability);
    }

    if (!isBoosting) {
        let dir = Phaser.Math.Vector2.ZERO.clone();
        if (getCurrentChallenge() == Challenge.TwinStick) {
            if (upActive) {
                dir.y = -1;
            } else if (downActive) {
                dir.y = 1;
            }
            if (rightActive) {
                dir.x = 1;
            } else if (leftActive) {
                dir.x = -1
            }
            dir.normalize();
        } else if (thrustActive) {
            dir = getPlayerForwardDirection(player);
        }
        player.gameObj[0].setAcceleration(dir.x * player.maxAcceleration, dir.y * player.maxAcceleration);
        clampUnitSpeed(player);
    }
    applyUnitDrag(player);
}

/** Get cooldown for the given ability. */
function getAbilityCooldown(ability: Ability): number {
    let cooldown = 0;
    switch (ability) {
        case Ability.Boost:
            cooldown = config()["playerBoostCooldownMs"];
            break;
        case Ability.QuickTurn:
            cooldown = config()["playerQuickturnCooldownMs"];
            break;
    }
    if (getCurrentChallenge() == Challenge.EngineFailure) {
        return cooldown * config()["engineFailureChallengeAbilityCooldownFactor"];
    }
    return cooldown;
}

/** Get the current forward direction for the player, as a normalized vector. */
function getPlayerForwardDirection(player: Unit) {
    if (getCurrentChallenge() == Challenge.InReverse) {
        return Phaser.Math.Vector2.LEFT.clone().rotate(player.gameObj[0].rotation);
    }
    return Phaser.Math.Vector2.RIGHT.clone().rotate(player.gameObj[0].rotation);
}

/** Get the speed that the player should turn. */
function getPlayerTurnSpeed(slowTurnActive: boolean) {
    return slowTurnActive ? config()["playerSlowRotationSpeed"] : config()["playerRotationSpeed"];
}

/** Move a non-player unit for one frame (call each frame in the update method of a scene) */
export function moveUnit(unit: Unit, targetPos: Phaser.Math.Vector2, debugGraphics: Phaser.GameObjects.Graphics, scene: MainScene, delta: number, isBombRepelActive: boolean) {
    // Destroy units if they get really far away
    if (isOutsideBounds(unit.gameObj[0].body.center, scene.getEnemyKillZoneTopLeft(), scene.getEnemyKillZoneBottomRight())) {
        scene.destroyUnitById(unit.id);
        return;
    }
    
    // Units can't move when being repelled by bomb
    if (isBombRepelActive) {
        // Worms still should follow the head when being repelled though
        if (unit.movement == "worm") {
            moveWormUnit(unit, targetPos, debugGraphics, delta);
        }
        return;
    }
    
    switch (unit.movement) {
        case "bomber":
            moveBomberUnit(unit, scene);
            break;
        case "homing":
            moveHomingUnit(unit, targetPos, debugGraphics, delta, true);
            break;
        case "lazyHoming":
            moveHomingUnit(unit, targetPos, debugGraphics, delta, true);
            break;
        case "loop":
            moveLoopUnit(unit, debugGraphics, delta, scene);
            break;
        case "perfectHoming":
            moveHomingUnit(unit, targetPos, debugGraphics, delta, false);
            break;
        case "spawner":
            moveSpawnerUnit(unit, scene);
        case "worm":
            moveWormUnit(unit, targetPos, debugGraphics, delta);
            break;
    }
    clampUnitSpeed(unit);
    applyUnitDrag(unit);
}

/** Move a powerup gem for one frame - homing in on the player, a stealer unit, or not moving */
export function moveGem(gem: Phaser.Types.Physics.Arcade.ImageWithDynamicBody, stealerUnits: { [id: number]: Unit }, player: Unit, isGemRepelActive: boolean) {
    let isHomingOnStealer = false;
    let targetPos;
    if (! isGemRepelActive) {
        targetPos = player.gameObj[0].body.center;
    }
    let stealerIds = Object.keys(stealerUnits);
    if (stealerIds.length > 0) {
        isHomingOnStealer = true;
        if (gem.getData("stealerTargetId") in stealerUnits) {
            // Gem is already targeting an existing stealer. Use this as the target.
            targetPos = stealerUnits[gem.getData("stealerTargetId")].gameObj[0].body.center;
        } else {
            // Need to pick a stealer unit to home in on - just pick a random one
            isHomingOnStealer = true;
            let chosenId = stealerIds[Math.floor(stealerIds.length * Math.random())];
            gem.setData("stealerTargetId", chosenId);
            targetPos = stealerUnits[chosenId].gameObj[0].body.center;
        }
    } else {
        // Stop homing to any stealer when none exist
        gem.setData("stealerTargetId", -1);
    }

    if (! isGemRepelActive || isHomingOnStealer) {
        let accel = config()["gemAcceleration"];
        let homingDir = homingDirection(gem.body, targetPos, accel);      
        // Accelerate towards the target
        gem.setAcceleration(homingDir.x * accel, homingDir.y * accel);
    } else {
        gem.setAcceleration(0);
    }
    if (isHomingOnStealer) {
        // Move gems towards stealers more slowly to give more time for the player to react
        clampSpeed(gem, adjustSpeed(config()["gemMaxSpeedToStealer"]));
    } else {
        clampSpeed(gem, adjustSpeed(config()["gemMaxSpeed"]));
    }
    applyGemDrag(gem);
}

/** Update the track of player movement */
export function recordPlayerPosition(player: Unit) {
    if (player.gameObj[0]) {
        if (player.state.lastPositions.length >= config()["playerTrailPositionCount"]) {
            player.state.lastPositions.shift();
        }
        let leftPos = player.gameObj[0].body.center.clone().add(Phaser.Math.Vector2.LEFT.clone().scale(9).rotate(player.gameObj[0].rotation));
        player.state.lastPositions.push(leftPos);
    }
}

/** Get speed based on a default, adjusting for challenges if necessary. */
export function adjustSpeed(defaultSpeed: number) {
    if (getCurrentChallenge() == Challenge.SpeedKills) {
        defaultSpeed *= config()["speedKillsChallengeSpeedMultiplier"];
    }
    return defaultSpeed;
}

/** Get max speed for a unit. */
export function getUnitMaxSpeed(unit: Unit) {
    return adjustSpeed(unit.maxSpeed);
}

/** Prevent unit from going over max speed */
function clampUnitSpeed(unit: Unit) {
    clampSpeed(unit.gameObj[0], getUnitMaxSpeed(unit));
}

/** Prevent a GameObject from going over a max speed */
function clampSpeed(obj: Phaser.Types.Physics.Arcade.ImageWithDynamicBody, maxSpeed: number) {
    if (obj.body.velocity.length() > maxSpeed) {
        let newVel = obj.body.velocity.normalize().scale(maxSpeed);
        obj.setVelocity(newVel.x, newVel.y);
    }
}

/** Apply a drag force to a unit. */
function applyUnitDrag(unit: Unit) {
    if (unit.disableDrag) {
        return;
    }
    unit.gameObj.forEach(image => {
        applyDrag(image, config()["unitDrag"]);
    })
}

/** Apply a drag force to a gem. */
function applyGemDrag(gem: Phaser.Types.Physics.Arcade.ImageWithDynamicBody) {
    applyDrag(gem, config()["gemDrag"])
}

/** Apply a drag force to the given body if it isn't accelerating */
function applyDrag(image: Phaser.Types.Physics.Arcade.ImageWithDynamicBody, drag: number) {
    if (image.body.acceleration.length() != 0 || image.body.velocity.length() == 0) {
        return;
    }

    let newVelocity = Phaser.Math.Vector2.ZERO;
    if (drag < image.body.velocity.length()) {
        let dragVector = image.body.velocity.clone().negate()
                .normalize().scale(drag);
        newVelocity = dragVector.add(image.body.velocity);
    }
    image.body.setVelocity(newVelocity.x, newVelocity.y);
}

/** Convert an angle to be within Phaser's expected [-PI, PI] range to prevent issues with jerky rotation.
 *  Useful when using the Phaser.Math.Angle.RotateTo function.
 */
function clampTargetAngle(angle: number) {
    if (angle > Math.PI) {
        angle -= (2 * Math.PI);
    }
    return angle;
}

/** Move a homing unit for one frame */
function moveHomingUnit(unit: Unit, target: Phaser.Math.Vector2, debugGraphics: Phaser.GameObjects.Graphics, delta: number, isLazy?: boolean) {
    // Get direction unit should move to hit target
    let finalTarget = target;
    if (unit.inaccuracy) {
        finalTarget = target.clone().add(unit.inaccuracy);
    }
    let homingDir = homingDirection(unit.gameObj[0].body, finalTarget, unit.maxAcceleration, isLazy);
    let targetRotationAngle = clampTargetAngle(homingDir.angle());

    if (unit.rotation) {
        unit.gameObj[0].setRotation(Phaser.Math.Angle.RotateTo(unit.gameObj[0].rotation, targetRotationAngle, unit.maxAngularSpeed * delta * 0.001));
        // Draw line being rotated towards
        if (debugGraphics) {
            let targetStretched = Phaser.Math.Vector2.RIGHT.clone().rotate(targetRotationAngle).scale(50);
            let debugLine = new Phaser.Geom.Line(unit.gameObj[0].body.center.x, unit.gameObj[0].body.center.y, 
                    unit.gameObj[0].body.center.x + targetStretched.x, unit.gameObj[0].body.center.y + targetStretched.y);
            debugGraphics.strokeLineShape(debugLine);
        }
        homingDir = Phaser.Math.Vector2.RIGHT.clone().rotate(unit.gameObj[0].rotation);
    }
       
    // Accelerate towards the target
    unit.gameObj[0].setAcceleration(homingDir.x * unit.maxAcceleration, homingDir.y * unit.maxAcceleration);
}

/**
 * Note: this assumes the target is stationary
 * See https://gamedev.stackexchange.com/questions/52988/implementing-a-homing-missile
 * and https://gamedev.stackexchange.com/questions/17313/how-does-one-prevent-homing-missiles-from-orbiting-their-targets
 * Based on a (possibly moving) body, a stationary target, and the max acceleration of the body, 
 * calculate the direction the body should accelerate to hit the target.
 */
function homingDirection(body: Phaser.Physics.Arcade.Body, target: Phaser.Math.Vector2, maxAcc: number, isLazy?: boolean): Phaser.Math.Vector2 {
    let realTarget = target.clone();
    if (isLazy) {
        return realTarget.clone().subtract(body.center).normalize();
    }

    let dirToImpact = realTarget.clone().subtract(body.center);
    let dirtoImpactNorm = dirToImpact.clone().normalize();
    if (body.velocity.equals(Phaser.Math.Vector2.ZERO)) {
        return dirtoImpactNorm;
    }
    // Get relative velocity of target from body's frame of reference
    let relativeTargetVel = body.velocity.clone().negate();

    // Component of relative target velocity towards the body
    let v = relativeTargetVel.clone().negate().dot(dirtoImpactNorm);

    // Time estimate for impact
    let eta = (-v / maxAcc) + Math.sqrt(Math.pow(v, 2) / Math.pow(maxAcc, 2) + (2 * dirToImpact.length() / maxAcc));

    // Estimate impact position, and aim towards it
    let impactPos = relativeTargetVel.scale(eta).add(realTarget);
    return impactPos.subtract(body.center).normalize();
}

/** Pick a random target point in the scene on the map */
function pickRandomTarget(scene: MainScene): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(Math.random() * scene.getKillZoneBottomRight().x,
            Math.random() * scene.getKillZoneBottomRight().y);
}

/** Move a loop unit for one frame */
function moveLoopUnit(unit: Unit, debugGraphics: Phaser.GameObjects.Graphics, delta: number, scene: MainScene) {
    // Pick first target
    let radius = 0;
    let center: Phaser.Math.Vector2;
    if (unit.state.currentLoopDurationMs == -1 || unit.state.currentLoopDurationMs >= unit.loopDurationMs) {
        let target = pickRandomTarget(scene);
        unit.state.loopTarget = target;
        radius = target.clone().subtract(unit.gameObj[0].body.center).length() / 2;
        unit.state.loopRadius = radius;
        center = new Phaser.Math.Vector2((target.x + unit.gameObj[0].body.center.x) / 2,
                (target.y + unit.gameObj[0].body.center.y) / 2);
        unit.state.loopCenter = center;
        unit.state.currentLoopDurationMs = 0
    } else {
        radius = unit.state.loopRadius;
        center = unit.state.loopCenter;
        unit.state.currentLoopDurationMs += delta;
    }
    // Set desired velocity to be tangent along the circle being traveled
    let targetRotationAngle = clampTargetAngle(unit.gameObj[0].body.center.clone().subtract(center).rotate(Math.PI / 2).angle());
    unit.gameObj[0].setRotation(Phaser.Math.Angle.RotateTo(unit.gameObj[0].rotation, targetRotationAngle, unit.maxAngularSpeed * delta * 0.001));
    let vel = Phaser.Math.Vector2.RIGHT.clone().rotate(unit.gameObj[0].rotation).scale(getUnitMaxSpeed(unit));
    unit.gameObj[0].setVelocity(vel.x, vel.y);
    // Draw line being rotated towards
    if (debugGraphics) {
        let targetStretched = Phaser.Math.Vector2.RIGHT.clone().rotate(targetRotationAngle).scale(50);
        let debugLine = new Phaser.Geom.Line(unit.gameObj[0].body.center.x, unit.gameObj[0].body.center.y, 
                unit.gameObj[0].body.center.x + targetStretched.x, unit.gameObj[0].body.center.y + targetStretched.y);
        debugGraphics.strokeLineShape(debugLine);
    }
}

const wormSegmentDistance = 32;
/** Move a worm unit for one frame */
function moveWormUnit(unit: Unit, target: Phaser.Math.Vector2, debugGraphics: Phaser.GameObjects.Graphics, delta: number) {
    moveHomingUnit(unit, target, debugGraphics, delta);
    // Now move all the segments of the worm one by one
    for (let i = 1; i < unit.gameObj.length; i++) {
        // Segments need to maintain their distance between one another always. So they won't be accelerating themselves
        // but will be moving to a precise spot
        let targetPosition = unit.gameObj[i - 1].body.center.clone();
        let followAngle = unit.gameObj[i].body.center.clone().subtract(targetPosition);
        followAngle.normalize().scale(wormSegmentDistance);
        let newPosition = targetPosition.add(followAngle);
        unit.gameObj[i].setPosition(newPosition.x, newPosition.y);
    }
}

/** Get the x and y distance a unit has gone out of bounds.
 *  If still inbounds, returns the zero vector.
 */
function outOfBoundsDistance(pos: Phaser.Math.Vector2, scene: MainScene) {
    let xOut = 0;
    let yOut = 0;

    if (pos.x < scene.getKillZoneTopLeft().x) {
        xOut = pos.x - scene.getKillZoneTopLeft().x;
    } else if (pos.x > scene.getKillZoneBottomRight().x) {
        xOut = pos.x - scene.getKillZoneBottomRight().x;
    }

    if (pos.y < scene.getKillZoneTopLeft().y) {
        yOut = pos.y - scene.getKillZoneTopLeft().y;
    } else if (pos.y > scene.getKillZoneBottomRight().y) {
        yOut = pos.y - scene.getKillZoneBottomRight().y;
    }
    return new Phaser.Math.Vector2(xOut, yOut);
}

// How far out of bounds a bomber can go before entering recovery mode
const bomberRecoveryThreshold = 15;
/** Move a bomber unit for one frame */
function moveBomberUnit(unit: Unit, scene: MainScene) {
    // If the bomber unit is outside of the play area or is not moving, pick a random direction and start
    let pos = unit.gameObj[0].body.center;
    let outDistance = outOfBoundsDistance(pos, scene);
    let moveAngle = unit.state.moveAngle;

    if (unit.state.movementState == MovementState.Recovering) {
        if (outDistance.length() <= 0) {
            // Random new direction once recovered, based on current velocity
            // Ensures we don't pick a direction straight back out of bounds
            let minX = -1;
            let maxX = 1;
            let minY = -1;
            let maxY = 1;
            if (unit.gameObj[0].body.velocity.x > 0) {
                minX = 0;
            } else if (unit.gameObj[0].body.velocity.x < 0) {
                maxX = 0;
            }
            if (unit.gameObj[0].body.velocity.y > 0) {
                minY = 0;
            } else if (unit.gameObj[0].body.velocity.y < 0) {
                maxY = 0;
            }

            let randomDir = new Phaser.Math.Vector2(Math.random() * (maxX - minX) + minX, Math.random() * (maxY - minY) + minY);
            moveAngle = randomDir.angle();
            unit.state.movementState = MovementState.Neutral;
        }
    } else {
        // After being repelled, take the most direct path back to the main stage
        if (outDistance.length() >= bomberRecoveryThreshold) {
            moveAngle = outDistance.clone().negate().angle();
            unit.state.movementState = MovementState.Recovering;
        } else if (! unit.state.moveAngle || outDistance.length() > 0) {
            if (! unit.state.moveAngle) {
                // Random starting direction
                moveAngle = (Math.random() * 2 * Math.PI) - Math.PI;
            } else {
                let currentVelocity = unit.gameObj[0].body.velocity.clone();
                // If outside of x bounds and moving away from center, reverse the x component of velocity
                if ((pos.x < scene.getKillZoneTopLeft().x && currentVelocity.x < 0) || 
                        (pos.x > scene.getKillZoneBottomRight().x && currentVelocity.x > 0)) {
                    currentVelocity.x *= -1;
                }
                // If outside of y bounds and moving away from center, reverse the y component of velocity
                if ((pos.y < scene.getKillZoneTopLeft().y && currentVelocity.y < 0) ||
                        (pos.y > scene.getKillZoneBottomRight().y && currentVelocity.y > 0)) {
                    currentVelocity.y *= -1;
                }
                moveAngle = currentVelocity.angle();
            }
            
        }
    }
    unit.gameObj[0].setRotation(moveAngle + (Math.PI / 2));
    unit.state.moveAngle = moveAngle;

    let velocity = new Phaser.Math.Vector2(1, 0).rotate(unit.state.moveAngle).scale(getUnitMaxSpeed(unit));
    unit.gameObj[0].body.setVelocity(velocity.x, velocity.y);
}

/** Move a spawner unit for one frame */
function moveSpawnerUnit(unit: Unit, scene: MainScene) {
    let pos = unit.gameObj[0].body.center;
    let outDistance = outOfBoundsDistance(pos, scene);

    if (outDistance.length() > 0) {
        // Move towards the center of the stage
        let bottomRight = scene.getKillZoneBottomRight();
        let center = new Phaser.Math.Vector2(bottomRight.x / 2, bottomRight.y / 2);
        let velocity = center.subtract(pos).scale(getUnitMaxSpeed(unit));
        unit.gameObj[0].body.setVelocity(velocity.x, velocity.y);
        unit.state.movementState = MovementState.Recovering;
    } else if (outDistance.length() <= 0 && unit.state.movementState == MovementState.Recovering) {
        // Recovery complete
        unit.state.movementState = MovementState.Neutral;
        unit.gameObj[0].body.setVelocity(0, 0);
    }
}
