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