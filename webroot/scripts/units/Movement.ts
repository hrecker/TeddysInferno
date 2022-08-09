import { Ability, abilityEvent } from "../events/EventMessenger";
import { config } from "../model/Config";
import { Unit } from "../model/Units";
import { MainScene } from "../scenes/MainScene";

/** Move the player unit for a frame based on inputs */
export function movePlayerUnit(player: Unit, quickTurnActive: boolean, boostActive: boolean,
                               thrustActive: boolean, leftActive: boolean, rightActive: boolean, delta: number) {
    let canQuickTurn = true;
    if ("quickTurnCooldownRemainingMs" in player.aiData && player.aiData["quickTurnCooldownRemainingMs"] > 0) {
        player.aiData["quickTurnCooldownRemainingMs"] -= delta;
        canQuickTurn = false;
    }
    let canBoost = true;
    if ("boostCooldownRemainingMs" in player.aiData && player.aiData["boostCooldownRemainingMs"] > 0) {
        player.aiData["boostCooldownRemainingMs"] -= delta;
        canBoost = false;
    }

    if (quickTurnActive && canQuickTurn) {
        player.gameObj[0].setRotation(player.gameObj[0].rotation + Math.PI);
        player.aiData["quickTurnCooldownRemainingMs"] = config()["playerQuickturnCooldownMs"];
        abilityEvent(Ability.QuickTurn, config()["playerQuickturnCooldownMs"]);
    } else {
        if (leftActive && !rightActive) {
            player.gameObj[0].setRotation(player.gameObj[0].rotation - config()["playerRotationSpeed"]);
        }
        if (!leftActive && rightActive) {
            player.gameObj[0].setRotation(player.gameObj[0].rotation + config()["playerRotationSpeed"]);
        }
    }

    let isBoosting = false;
    if ("activeBoostRemainingMs" in player.aiData && player.aiData["activeBoostRemainingMs"] > 0) {
        player.aiData["activeBoostRemainingMs"] -= delta;
        isBoosting = true;
        player.gameObj[0].setAcceleration(0, 0);
        player.gameObj[0].setVelocity(player.aiData["boostDirection"].x, player.aiData["boostDirection"].y);
    }

    if (boostActive && canBoost) {
        player.aiData["activeBoostRemainingMs"] = config()["playerBoostDurationMs"];
        player.aiData["boostCooldownRemainingMs"] = config()["playerBoostCooldownMs"];
        isBoosting = true;
        player.gameObj[0].setAcceleration(0, 0);
        let dir = Phaser.Math.Vector2.RIGHT.clone().rotate(player.gameObj[0].rotation).scale(config()["playerBoostSpeed"]);
        player.aiData["boostDirection"] = dir;
        player.gameObj[0].setVelocity(dir.x, dir.y);
        abilityEvent(Ability.Boost, config()["playerBoostCooldownMs"]);
    }

    if (!isBoosting) {
        if (thrustActive) {
            let dir = Phaser.Math.Vector2.RIGHT.clone().rotate(player.gameObj[0].rotation);
            player.gameObj[0].setAcceleration(dir.x * player.maxAcceleration, dir.y * player.maxAcceleration);
        } else {
            player.gameObj[0].setAcceleration(0, 0);
        }
        
        clampUnitSpeed(player);
    }
}

/** Move a non-player unit for one frame (call each frame in the update method of a scene) */
export function moveUnit(unit: Unit, targetPos: Phaser.Math.Vector2, debugGraphics: Phaser.GameObjects.Graphics, scene: MainScene, delta: number, isBombRepelActive: boolean) {
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
        case "worm":
            moveWormUnit(unit, targetPos, debugGraphics, delta);
            break;
    }
    clampUnitSpeed(unit);
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
    clampSpeed(gem, config()["gemMaxSpeed"]);
}

/** Prevent unit from going over max speed */
function clampUnitSpeed(unit: Unit) {
    clampSpeed(unit.gameObj[0], unit.maxSpeed);
}

/** Prevent a GameObject from going over a max speed */
function clampSpeed(obj: Phaser.Types.Physics.Arcade.ImageWithDynamicBody, maxSpeed: number) {
    if (obj.body.velocity.length() > maxSpeed) {
        let newVel = obj.body.velocity.normalize().scale(maxSpeed);
        obj.setVelocity(newVel.x, newVel.y);
    }
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
    if (unit.aiData["inaccuracy"]) {
        finalTarget = target.clone().add(unit.aiData["inaccuracy"]);
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
    if (! ("target" in unit.aiData) || unit.aiData["currentLoopDurationMs"] >= unit.aiData["loopDuration"]) {
        let target = pickRandomTarget(scene);
        unit.aiData["target"] = target;
        radius = target.clone().subtract(unit.gameObj[0].body.center).length() / 2;
        unit.aiData["radius"] = radius;
        center = new Phaser.Math.Vector2((target.x + unit.gameObj[0].body.center.x) / 2,
                (target.y + unit.gameObj[0].body.center.y) / 2);
        unit.aiData["center"] = center;
        unit.aiData["currentLoopDurationMs"] = 0
    } else {
        radius = unit.aiData["radius"];
        center = unit.aiData["center"];
        unit.aiData["currentLoopDurationMs"] += delta;
    }
    // Set desired velocity to be tangent along the circle being traveled
    let targetRotationAngle = clampTargetAngle(unit.gameObj[0].body.center.clone().subtract(center).rotate(Math.PI / 2).angle());
    unit.gameObj[0].setRotation(Phaser.Math.Angle.RotateTo(unit.gameObj[0].rotation, targetRotationAngle, unit.maxAngularSpeed * delta * 0.001));
    let vel = Phaser.Math.Vector2.RIGHT.clone().rotate(unit.gameObj[0].rotation).scale(unit.maxSpeed);
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

/** Check if a unit is outside the bounds of the stage */
function isOutsideBounds(pos: Phaser.Math.Vector2, scene: MainScene) {
    return pos.x < scene.getKillZoneTopLeft().x || pos.x > scene.getKillZoneBottomRight().x ||
           pos.y < scene.getKillZoneTopLeft().y || pos.y > scene.getKillZoneBottomRight().y;
}

/** Move a bomber unit for one frame */
function moveBomberUnit(unit: Unit, scene: MainScene) {
    // If the bomber unit is outside of the play area or is not moving, pick a random direction and start
    let pos = unit.gameObj[0].body.center;
    if (! ("angle" in unit.aiData) || isOutsideBounds(pos, scene)) {
        let newAngle;
        if (! ("angle" in unit.aiData)) {
            // Random starting direction
            newAngle = (Math.random() * 2 * Math.PI) - Math.PI;
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
            newAngle = currentVelocity.angle();
        }
        
        unit.gameObj[0].setRotation(newAngle + (Math.PI / 2));
        unit.aiData["angle"] = newAngle;
    }

    let velocity = new Phaser.Math.Vector2(1, 0).rotate(unit.aiData["angle"]).scale(unit.maxSpeed);
    unit.gameObj[0].body.setVelocity(velocity.x, velocity.y);
}
