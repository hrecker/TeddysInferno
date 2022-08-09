// This file is used for defining callbacks for events, useful for communicating between scenes
export enum Ability {
    QuickTurn = "QuickTurn",
    Boost = "Boost"
}

// Callback types
type NumberCallback = {
    callback: (value: number, scene: Phaser.Scene) => void;
    scene: Phaser.Scene;
}
type NoArgumentCallback = {
    callback: (scene: Phaser.Scene) => void;
    scene: Phaser.Scene;
}
type AbilityCallback = {
    callback: (ability: Ability, cooldownMs: number, scene: Phaser.Scene) => void;
    scene: Phaser.Scene;
}
type GemCountCallback = {
    callback: (gemCount: number, previousThreshold: number, nextThreshold: number, scene: Phaser.Scene) => void;
    scene: Phaser.Scene;
}

// Callback lists
let timerCallbacks: NumberCallback[] = [];
let abilityCallbacks: AbilityCallback[] = [];
let playerSpawnCallbacks: NoArgumentCallback[] = [];
let playerDeathCallbacks: NoArgumentCallback[] = [];
let gemCountCallbacks: GemCountCallback[] = [];
let weaponLevelCallbacks: NumberCallback[] = [];
let bombCountCallbacks: NumberCallback[] = [];

/** Add a callback listening for timer changes */
export function addTimerListener(callback: (timer: number, scene: Phaser.Scene) => void, scene: Phaser.Scene) {
    timerCallbacks.push({ 
        callback: callback,
        scene: scene
    });
}

/** Add a callback listening for ability usage */
export function addAbilityListener(callback: (ability: Ability, cooldownMs: number, scene: Phaser.Scene) => void, scene: Phaser.Scene) {
    abilityCallbacks.push({ 
        callback: callback,
        scene: scene
    });
}

/** Add a callback listening for player spawning */
export function addPlayerSpawnListener(callback: (scene: Phaser.Scene) => void, scene: Phaser.Scene) {
    playerSpawnCallbacks.push({ 
        callback: callback,
        scene: scene
    });
}

/** Add a callback listening for player death */
export function addPlayerDeathListener(callback: (scene: Phaser.Scene) => void, scene: Phaser.Scene) {
    playerDeathCallbacks.push({ 
        callback: callback,
        scene: scene
    });
}

/** Add a callback listening for gem count changes */
export function addGemCountListener(callback: (gemCount: number, previousThreshold: number, nextThreshold: number, scene: Phaser.Scene) => void, scene: Phaser.Scene) {
    gemCountCallbacks.push({ 
        callback: callback,
        scene: scene
    });
}

/** Add a callback listening for weapon level changes */
export function addWeaponLevelListener(callback: (level: number, scene: Phaser.Scene) => void, scene: Phaser.Scene) {
    weaponLevelCallbacks.push({ 
        callback: callback,
        scene: scene
    });
}

/** Add a callback listening for bomb count changes */
export function addBombCountListener(callback: (bombCount: number, scene: Phaser.Scene) => void, scene: Phaser.Scene) {
    bombCountCallbacks.push({ 
        callback: callback,
        scene: scene
    });
}

/** Call any listeners for ability usage */
export function timerEvent(timer: number) {
    timerCallbacks.forEach(callback => 
        callback.callback(timer, callback.scene));
}

/** Call any listeners for ability usage */
export function abilityEvent(ability: Ability, cooldownMs: number) {
    abilityCallbacks.forEach(callback => 
        callback.callback(ability, cooldownMs, callback.scene));
}

/** Call any callbacks listening for player spawn */
export function playerSpawnEvent() {
    playerSpawnCallbacks.forEach(callback => 
        callback.callback(callback.scene));
}

/** Call any callbacks listening for player death */
export function playerDeathEvent() {
    playerDeathCallbacks.forEach(callback => 
        callback.callback(callback.scene));
}

/** Call any callbacks listening for gem count changes */
export function gemCountEvent(gemCount: number, previousThreshold: number, nextThreshold: number) {
    gemCountCallbacks.forEach(callback => 
        callback.callback(gemCount, previousThreshold, nextThreshold, callback.scene));
}

/** Call any callbacks listening for weapon level changes */
export function weaponLevelEvent(level: number) {
    weaponLevelCallbacks.forEach(callback => 
        callback.callback(level, callback.scene));
}

/** Call any callbacks listening for bomb count changes */
export function bombCountEvent(bombCount: number) {
    bombCountCallbacks.forEach(callback => 
        callback.callback(bombCount, callback.scene));
}
