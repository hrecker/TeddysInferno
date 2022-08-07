let aliveCallbacks = [];

/** Call any callbacks listening for whether the player is alive */
export function setPlayerIsAlive(isAlive) {
    aliveCallbacks.forEach(callback => 
        callback.callback(isAlive, callback.scene));
}

/** Add a callback listening for player dying or respawning */
export function addPlayerAliveListener(callback, scene) {
    aliveCallbacks.push({ 
        callback: callback,
        scene: scene
    });
}
