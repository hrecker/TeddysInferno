/** Check if a unit is outside the bounds of the stage */
export function vector2Str(vector: Phaser.Types.Math.Vector2Like) {
    return "(" + vector.x + ", " + vector.y + ")";
}

/** Get multiple random elements from an array */
// https://stackoverflow.com/questions/7158654/how-to-get-random-elements-from-an-array?noredirect=1&lq=1
export function getRandomArrayElements(arr, count: number) {
    let shuffled = arr.slice(0), i = arr.length, min = i - count, temp, index;
    while (i-- > min) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(min);
}

/** Check is a position is outside the given bounds representing a rectangle */
export function isOutsideBounds(pos: Phaser.Math.Vector2, topLeft: Phaser.Types.Math.Vector2Like, bottomRight: Phaser.Types.Math.Vector2Like) {
    return pos.x < topLeft.x || pos.x > bottomRight.x ||
           pos.y < topLeft.y || pos.y > bottomRight.y;
}

/** Set a sprite to full white for a time */
export function flashSprite(sprite: Phaser.Physics.Arcade.Image, durationMs: number, scene: Phaser.Scene) {
    sprite.setTintFill(0xffffff);
    scene.time.delayedCall(durationMs, () => {
        sprite.clearTint();
    });
}
