import { MainScene } from "../scenes/MainScene";
import { getSettings } from "../state/Settings";
import { config } from "./Config";

export enum SoundEffect {
    Ability = "Ability",
    BasicShot = "BasicShot",
    ButtonClick = "ButtonClick",
    Death = "Death",
    EnemyBomb = "EnemyBomb",
    EnemyBombDrop = "EnemyBombDrop",
    EnemyDeath = "EnemyDeath",
    EnemyHit = "EnemyHit",
    EnemySpawned = "EnemySpawned",
    GemCollect = "GemCollect",
    LevelUp = "LevelUp",
    PlayerBomb = "PlayerBomb",
    ShotgunShot = "ShotgunShot",
    Spawning = "Spawning",
    StealerActive = "StealerActive",
    StealerShot = "StealerShot"
}

let sounds: { [effect: string]: Phaser.Sound.BaseSound } = {};

/** Load all sound files */
export function loadSounds(scene: Phaser.Scene) {
    sounds[SoundEffect.Ability] = scene.sound.add("Ability");
    sounds[SoundEffect.BasicShot] = scene.sound.add("BasicShot");
    sounds[SoundEffect.ButtonClick] = scene.sound.add("ButtonClick");
    sounds[SoundEffect.Death] = scene.sound.add("Death");
    sounds[SoundEffect.EnemyBomb] = scene.sound.add("EnemyBomb");
    sounds[SoundEffect.EnemyBombDrop] = scene.sound.add("EnemyBombDrop");
    sounds[SoundEffect.EnemyDeath] = scene.sound.add("EnemyDeath");
    sounds[SoundEffect.EnemyHit] = scene.sound.add("EnemyHit");
    sounds[SoundEffect.EnemySpawned] = scene.sound.add("EnemySpawned");
    sounds[SoundEffect.GemCollect] = scene.sound.add("GemCollect");
    sounds[SoundEffect.LevelUp] = scene.sound.add("LevelUp");
    sounds[SoundEffect.ShotgunShot] = scene.sound.add("ShotgunShot");
    sounds[SoundEffect.Spawning] = scene.sound.add("Spawning");
    sounds[SoundEffect.StealerActive] = scene.sound.add("StealerActive");
    sounds[SoundEffect.StealerShot] = scene.sound.add("StealerShot");
}

/** Get a given sound */
export function getSound(sound: SoundEffect): Phaser.Sound.BaseSound {
    return sounds[sound];
}

/** Get a given sound */
export function playSound(scene: Phaser.Scene, sound: SoundEffect, loop?: boolean) {
    if (! getSettings().sfxEnabled) {
        return;
    }

    if (loop) {
        // Play the cached sound when looping so that it can be stopped later
        sounds[sound].play({
            volume: config()["defaultSfxVolume"][sound],
            loop: loop
        });
    } else {
        scene.sound.play(sound, {
            volume: config()["defaultSfxVolume"][sound]
        });
    }
}

/** Stop any playing sounds */
export function stopAllSounds() {
    Object.keys(sounds).forEach(soundEffect => {
        sounds[soundEffect].stop();
    })
}