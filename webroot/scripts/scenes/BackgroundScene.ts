import { addSettingsListener } from "../events/EventMessenger";
import { config } from "../model/Config";
import { stopAllSounds } from "../model/Sound";
import { getSettings, Settings } from "../state/Settings";

let bgMusic: Phaser.Sound.BaseSound;

/** Shader background shown for menu and for the main game */
export class BackgroundScene extends Phaser.Scene {
    constructor() {
        super({
            key: "BackgroundScene"
        });
    }

    getMusicVolume() {
        if (getSettings().musicEnabled) {
            return config()["defaultMusicVolume"];
        } else {
            return 0;
        }
    }

    create() {
        bgMusic = this.sound.add('backgroundMusic');
        bgMusic.play({
            loop: true,
            volume: this.getMusicVolume()
        });
        addSettingsListener(this.settingsListener, this);
    }

    settingsListener(newSettings: Settings, scene: Phaser.Scene) {
        bgMusic.setVolume(scene.getMusicVolume());
        if (! newSettings.sfxEnabled) {
            stopAllSounds();
        }
    }
}
