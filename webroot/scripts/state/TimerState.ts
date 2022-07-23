// Timer counts in milliseconds
let timer = 0;
let timerCallbacks = [];

/** Set the timer value and call any callbacks listening for changes */
function setTimer(val) {
    timer = val;
    timerCallbacks.forEach(callback => 
        callback.callback(timer, callback.scene));
}

/** Set the timer to 0 */
export function resetTimer() {
    setTimer(0);
}

/** Add delta to the timer */
export function incrementTimer(delta) {
    setTimer(timer + delta);
    return timer;
}

/** Add a callback listening for timer changes */
export function addTimerListener(callback, scene) {
    timerCallbacks.push({ 
        callback: callback,
        scene: scene
    });
}
