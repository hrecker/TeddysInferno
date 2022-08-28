import { config } from "../model/Config";

let bgMusic: Phaser.Sound.BaseSound;

/** Shader background shown for menu and for the main game */
export class BackgroundScene extends Phaser.Scene {
    constructor() {
        super({
            key: "BackgroundScene"
        });
    }

    create() {
        bgMusic = this.sound.add('backgroundMusic');
        bgMusic.play({
            loop: true,
            volume: config()["defaultMusicVolume"]
        });
    }

    update() {
        //console.log(vector2Str(shader));
    }
}
