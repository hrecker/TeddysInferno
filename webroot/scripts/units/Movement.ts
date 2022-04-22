import { Unit } from "../model/Units";

export const unitDrag = 250;
export const playerRotationSpeed = 0.10;

export function movePlayerUnit(player: Unit, thrustActive: boolean, leftActive: boolean, rightActive: boolean) {
    if (leftActive && !rightActive) {
        player.gameObj[0].setRotation(player.gameObj[0].rotation - playerRotationSpeed);
    }
    if (!leftActive && rightActive) {
        player.gameObj[0].setRotation(player.gameObj[0].rotation + playerRotationSpeed);
    }

    if (thrustActive) {
        let dir = Phaser.Math.Vector2.RIGHT.clone().rotate(player.gameObj[0].rotation)
        player.gameObj[0].setAcceleration(dir.x * player.maxAcceleration, dir.y * player.maxAcceleration);
    } else {
        player.gameObj[0].setAcceleration(0, 0);
    }
    
    clampUnitSpeed(player);
}

/** Move a unit for one frame (call each frame in the update method of a scene) */
export function moveUnit(unit: Unit, targetPos: Phaser.Math.Vector2, debugGraphics: Phaser.GameObjects.Graphics) {
    switch (unit.movement) {
        case "homing":
            moveHomingUnit(unit, targetPos, debugGraphics, false);
            break;
        case "lazyHoming":
            moveHomingUnit(unit, targetPos, debugGraphics, true);
            break;
        case "perfectHoming":
            moveHomingUnit(unit, targetPos, debugGraphics, false, true);
            break;
        case "worm":
            moveWormUnit(unit, targetPos, debugGraphics);
            break;
    }

    clampUnitSpeed(unit);
}

/** Move a homing unit for one frame */
function moveHomingUnit(unit: Unit, target: Phaser.Math.Vector2, debugGraphics: Phaser.GameObjects.Graphics, isLazy?: boolean, isPerfect?: boolean) {
    if (debugGraphics) {
        debugGraphics.clear();
    }

    // Get direction unit should move to hit target
    let homingDir = homingDirection(unit.gameObj[0].body, target, unit.maxAcceleration, isLazy, isPerfect);
    let targetRotationAngle = homingDir.angle();

    if (unit.rotation) {
        // Rotate towards the target        
        unit.gameObj[0].setRotation(Phaser.Math.Angle.RotateTo(unit.gameObj[0].rotation, targetRotationAngle, unit.maxAngularSpeed));
        // Draw line being rotated towards
        if (debugGraphics) {
            let targetStretched = Phaser.Math.Vector2.RIGHT.clone().rotate(targetRotationAngle).scale(50);
            let debugLine = new Phaser.Geom.Line(unit.gameObj[0].body.center.x, unit.gameObj[0].body.center.y, 
                    unit.gameObj[0].body.center.x + targetStretched.x, unit.gameObj[0].body.center.y + targetStretched.y);
            debugGraphics.strokeLineShape(debugLine);
        }
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
const missRange = [-200, 200];
function homingDirection(body : Phaser.Physics.Arcade.Body, target: Phaser.Math.Vector2, maxAcc: number, isLazy?: boolean, isPerfect?: boolean): Phaser.Math.Vector2 {
    let realTarget = target.clone();
    
    if (!isPerfect) {
        let xDiff = Math.random() * (missRange[1] - missRange[0]) + missRange[0];
        let yDiff = Math.random() * (missRange[1] - missRange[0]) + missRange[0];
        realTarget.add({ x: xDiff, y: yDiff });
    }

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
function moveWormUnit(unit: Unit, target: Phaser.Math.Vector2, debugGraphics: Phaser.GameObjects.Graphics) {
    if (debugGraphics) {
        debugGraphics.clear();
    }

    // Get direction unit should move to hit target
    let homingDir = homingDirection(unit.gameObj[0].body, target, unit.maxAcceleration, false, true);
    let targetRotationAngle = homingDir.angle();

    if (unit.rotation) {
        // Rotate towards the target        
        unit.gameObj[0].setRotation(Phaser.Math.Angle.RotateTo(unit.gameObj[0].rotation, targetRotationAngle, unit.maxAngularSpeed));
        // Draw line being rotated towards
        if (debugGraphics) {
            let targetStretched = Phaser.Math.Vector2.RIGHT.clone().rotate(targetRotationAngle).scale(50);
            let debugLine = new Phaser.Geom.Line(unit.gameObj[0].body.center.x, unit.gameObj[0].body.center.y, 
                    unit.gameObj[0].body.center.x + targetStretched.x, unit.gameObj[0].body.center.y + targetStretched.y);
            debugGraphics.strokeLineShape(debugLine);
        }
        // Limit to moving the direction the worm is actually facing, so it has to take slow turns
        homingDir = Phaser.Math.Vector2.RIGHT.clone().rotate(unit.gameObj[0].rotation);
    }

    // Accelerate towards the target
    unit.gameObj[0].setAcceleration(homingDir.x * unit.maxAcceleration, homingDir.y * unit.maxAcceleration);

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
