import { Unit } from "../model/Units";

export const unitDrag = 250;
export const playerRotationSpeed = 0.10;

export function movePlayerUnit(player: Unit, thrustActive: boolean, leftActive: boolean, rightActive: boolean) {
    if (leftActive && !rightActive) {
        player.gameObj.setRotation(player.gameObj.rotation - playerRotationSpeed);
    }
    if (!leftActive && rightActive) {
        player.gameObj.setRotation(player.gameObj.rotation + playerRotationSpeed);
    }

    if (thrustActive) {
        let dir = Phaser.Math.Vector2.RIGHT.clone().rotate(player.gameObj.rotation)
        player.gameObj.setAcceleration(dir.x * player.maxAcceleration, dir.y * player.maxAcceleration);
    } else {
        player.gameObj.setAcceleration(0, 0);
    }
    
    clampUnitSpeed(player);
}

/** Move a unit for one frame (call each frame in the update method of a scene) */
export function moveUnit(unit: Unit, targetUnit: Unit, debugGraphics: Phaser.GameObjects.Graphics) {
    if (targetUnit) {
        switch (unit.movement) {
            case "homing":
                moveHomingUnit(unit, targetUnit.gameObj.body.center, debugGraphics);
                break;
        }
    }

    clampUnitSpeed(unit);
}

/** Move a homing unit for one frame */
function moveHomingUnit(unit: Unit, target: Phaser.Math.Vector2, debugGraphics: Phaser.GameObjects.Graphics) {
    if (debugGraphics) {
        debugGraphics.clear();
    }

    // Get direction unit should move to hit target
    let homingDir = homingDirection(unit.gameObj.body, target, unit.maxAcceleration);
    let targetRotationAngle = homingDir.angle();

    if (unit.rotation) {
        // Rotate towards the target        
        unit.gameObj.setRotation(Phaser.Math.Angle.RotateTo(unit.gameObj.rotation, targetRotationAngle, unit.maxAngularSpeed));
        // Draw line being rotated towards
        if (debugGraphics) {
            let targetStretched = Phaser.Math.Vector2.RIGHT.clone().rotate(targetRotationAngle).scale(50);
            let debugLine = new Phaser.Geom.Line(unit.gameObj.body.center.x, unit.gameObj.body.center.y, 
                    unit.gameObj.body.center.x + targetStretched.x, unit.gameObj.body.center.y + targetStretched.y);
            debugGraphics.strokeLineShape(debugLine);
        }
    }

    // Accelerate towards the target
    unit.gameObj.setAcceleration(homingDir.x * unit.maxAcceleration, homingDir.y * unit.maxAcceleration);
}

/**
 * Note: this assumes the target is stationary
 * See https://gamedev.stackexchange.com/questions/52988/implementing-a-homing-missile
 * and https://gamedev.stackexchange.com/questions/17313/how-does-one-prevent-homing-missiles-from-orbiting-their-targets
 * Based on a (possibly moving) body, a stationary target, and the max acceleration of the body, 
 * calculate the direction the body should accelerate to hit the target.
 */
export function homingDirection(body : Phaser.Physics.Arcade.Body, target: Phaser.Math.Vector2, maxAcc: number): Phaser.Math.Vector2 {
    let dirToImpact = target.clone().subtract(body.center);
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
    let impactPos = relativeTargetVel.scale(eta).add(target);
    return impactPos.subtract(body.center).normalize();
}

function clampUnitSpeed(unit: Unit) {
    if (unit.gameObj.body.velocity.length() > unit.maxSpeed) {
        let newVel = unit.gameObj.body.velocity.normalize().scale(unit.maxSpeed);
        unit.gameObj.setVelocity(newVel.x, newVel.y);
    }
}
