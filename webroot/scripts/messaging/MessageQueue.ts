export enum Message {
    AbilityUsed,
    PlayerRespawn,
    PlayerDeath,
    TimerUpdated,
    GemCountUpdated,
    WeaponLevelUpdated,
    BombCountUpdated
}

type Callback = {
    callback: (args: {}, scene: Phaser.Scene) => void;
    scene: Phaser.Scene;
};

let messageListeners: { [message: number]: Callback[] } = {};

/** Send a message to any subscribed callbacks with the given args */
export function sendMessage(message: Message, args: {}) {
    if (message in messageListeners) {
        messageListeners[message].forEach(callback => {
            callback.callback(args, callback.scene);
        });
    }
}

/** Subscribe a callback function to a message */
export function subscribe(message: Message, callback: (args: {}, scene: Phaser.Scene) => void, scene: Phaser.Scene) {
    if (! (message in messageListeners)) {
        messageListeners[message] = [];
    }
    messageListeners[message].push({
        callback: callback,
        scene: scene
    });
}
