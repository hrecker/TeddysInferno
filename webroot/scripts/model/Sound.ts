export enum SoundEffect {
    Death,
    EnemyDeath,
    GemCollect,
    Shot,
    Shotgun
}

let sounds: { [effect: number]: Phaser.Sound.BaseSound } = {};

/** Load all sound files */
export function loadSounds(scene: Phaser.Scene) {
    sounds[SoundEffect.Death] = scene.sound.add("death");
    sounds[SoundEffect.EnemyDeath] = scene.sound.add("enemydeath");
    sounds[SoundEffect.GemCollect] = scene.sound.add("gemCollect");
    sounds[SoundEffect.Shot] = scene.sound.add("shot");
    sounds[SoundEffect.Shotgun] = scene.sound.add("shotgun");
}

/** Get a given sound */
export function getSound(sound: SoundEffect) {
    return sounds[sound];
}