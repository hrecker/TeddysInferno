//TODO some kind of more robust messaging system for stuff like this?
let abilityCallbacks = [];

/** Call any listeners for ability usage */
export function useAbility(ability, cooldownMs) {
    abilityCallbacks.forEach(callback => 
        callback.callback(ability, cooldownMs, callback.scene));
}

/** Add a callback listening for ability usage */
export function addAbilityListener(callback, scene) {
    abilityCallbacks.push({ 
        callback: callback,
        scene: scene
    });
}
