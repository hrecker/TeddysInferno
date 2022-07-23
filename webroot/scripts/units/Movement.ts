import { Unit } from "../model/Units";
import { MainScene } from "../scenes/MainScene";

export const unitDrag = 250;
export const playerRotationSpeed = 0.10;
export const playerQuickturnCooldownMs = 2000;
export const playerBoostCooldownMs = 2000;
export const playerBoostDurationMs = 150;
export const playerBoostSpeed = 1000;

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
        player.aiData["quickTurnCooldownRemainingMs"] = playerQuickturnCooldownMs;
    } else {
        if (leftActive && !rightActive) {
            player.gameObj[0].setRotation(player.gameObj[0].rotation - playerRotationSpeed);
        }
        if (!leftActive && rightActive) {
            player.gameObj[0].setRotation(player.gameObj[0].rotation + playerRotationSpeed);
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
        player.aiData["activeBoostRemainingMs"] = playerBoostDurationMs;
        player.aiData["boostCooldownRemainingMs"] = playerBoostCooldownMs;
        isBoosting = true;
        player.gameObj[0].setAcceleration(0, 0);
        let dir = Phaser.Math.Vector2.RIGHT.clone().rotate(player.gameObj[0].rotation).scale(playerBoostSpeed);
        player.aiData["boostDirection"] = dir;
        player.gameObj[0].setVelocity(dir.x, dir.y);
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

/** Move a unit for one frame (call each frame in the update method of a scene) */
export function moveUnit(unit: Unit, targetPos: Phaser.Math.Vector2, debugGraphics: Phaser.GameObjects.Graphics, scene: MainScene, delta: number) {
    switch (unit.movement) {
        case "homing":
            moveHomingUnit(unit, targetPos, debugGraphics, delta, true);
            break;
        case "lazyHoming":
            moveHomingUnit(unit, targetPos, debugGraphics, delta, true);
            break;
        case "perfectHoming":
            moveHomingUnit(unit, targetPos, debugGraphics, delta, false);
            break;
        case "worm":
            moveWormUnit(unit, targetPos, debugGraphics, delta);
            break;
        case "bomber":
            moveBomberUnit(unit, debugGraphics, scene);
    }

    clampUnitSpeed(unit);
}

/** Move a homing unit for one frame */
function moveHomingUnit(unit: Unit, target: Phaser.Math.Vector2, debugGraphics: Phaser.GameObjects.Graphics, delta: number, isLazy?: boolean) {
    if (debugGraphics) {
        debugGraphics.clear();
    }

    // Get direction unit should move to hit target
    let finalTarget = target;
    if (unit.aiData["inaccuracy"]) {
        finalTarget = target.clone().add(unit.aiData["inaccuracy"]);
    }
    let homingDir = homingDirection(unit.gameObj[0].body, finalTarget, unit.maxAcceleration, isLazy);
    let targetRotationAngle = homingDir.angle();
    if (targetRotationAngle > Math.PI) {
        targetRotationAngle -= (2 * Math.PI);
    }

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
function homingDirection(body : Phaser.Physics.Arcade.Body, target: Phaser.Math.Vector2, maxAcc: number, isLazy?: boolean): Phaser.Math.Vector2 {
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

function clampUnitSpeed(unit: Unit) {
    if (unit.gameObj[0].body.velocity.length() > unit.maxSpeed) {
        let newVel = unit.gameObj[0].body.velocity.normalize().scale(unit.maxSpeed);
        unit.gameObj[0].setVelocity(newVel.x, newVel.y);
    }
}

const segmentDistance = 32;
/** Move a homing unit for one frame */
function moveWormUnit(unit: Unit, target: Phaser.Math.Vector2, debugGraphics: Phaser.GameObjects.Graphics, delta: number) {
    moveHomingUnit(unit, target, debugGraphics, delta);
    // Now move all the segments of the worm one by one
    for (let i = 1; i < unit.gameObj.length; i++) {
        // Segments need to maintain their distance between one another always. So they won't be accelerating themselves
        // but will be moving to a precise spot
        let targetPosition = unit.gameObj[i - 1].body.center.clone();
        let followAngle = unit.gameObj[i].body.center.clone().subtract(targetPosition);
        followAngle.normalize().scale(segmentDistance);
        let newPosition = targetPosition.add(followAngle);
        unit.gameObj[i].setPosition(newPosition.x, newPosition.y);
    }
}

function isOutsideBounds(pos: Phaser.Math.Vector2, scene: MainScene) {
    return pos.x < scene.getKillZoneMinX() || pos.x > scene.getKillZoneMaxX() ||
           pos.y < scene.getKillZoneMinY() || pos.y > scene.getKillZoneMaxY();
}

/** Move a bomber unit for one frame */
function moveBomberUnit(unit: Unit, debugGraphics: Phaser.GameObjects.Graphics, scene: MainScene) {
    if (debugGraphics) {
        debugGraphics.clear();
    }

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
            if ((pos.x < scene.getKillZoneMinX() && currentVelocity.x < 0) || 
                    (pos.x > scene.getKillZoneMaxX() && currentVelocity.x > 0)) {
                currentVelocity.x *= -1;
            }
            // If outside of y bounds and moving away from center, reverse the y component of velocity
            if ((pos.y < scene.getKillZoneMinY() && currentVelocity.y < 0) ||
                    (pos.y > scene.getKillZoneMaxY() && currentVelocity.y > 0)) {
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
