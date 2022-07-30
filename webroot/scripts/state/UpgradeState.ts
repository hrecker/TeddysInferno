//TODO some kind of more robust messaging system for stuff like this?
let gemCountCallbacks = [];
let weaponLevelCallbacks = [];

/** Call any listeners for gem count */
export function updateGemCount(gemCount, currentLevel) {
    gemCountCallbacks.forEach(callback => 
        callback.callback(gemCount, currentLevel, callback.scene));
}

/** Add a callback listening for changes to gem count */
export function addGemCountListener(callback, scene) {
    gemCountCallbacks.push({ 
        callback: callback,
        scene: scene
    });
}

/** Call any listeners for weapon level */
export function updateWeaponLevel(weaponLevel) {
    weaponLevelCallbacks.forEach(callback => 
        callback.callback(weaponLevel, callback.scene));
}

/** Add a callback listening for changes to weapon level */
export function addWeaponLevelListener(callback, scene) {
    weaponLevelCallbacks.push({ 
        callback: callback,
        scene: scene
    });
}
