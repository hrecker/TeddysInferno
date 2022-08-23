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
            volume: 0.8
        });
    }

    update() {
        //console.log(vector2Str(shader));
    }
}
