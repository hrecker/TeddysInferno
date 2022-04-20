import { loadUnitJson } from "../model/Units";

// Load json and assets
export class LoadingScene extends Phaser.Scene {
    constructor() {
        super({
            key: "LoadingScene"
        });
    }

    preload() {
        // Load sprites
        this.load.image("lazyChaser", "assets/sprites/units/lazyChaser.png");
        this.load.image("accurateChaser", "assets/sprites/units/accurateChaser.png");
        this.load.image("perfectChaser", "assets/sprites/units/perfectChaser.png");
        this.load.image("player", "assets/sprites/units/player.png");

        this.load.image("bullet", "assets/sprites/bullet.png");

        // Load background
        this.load.image("background", "assets/background/background.png");

        // Load json
        this.load.json("units", "assets/units/units.json");
    }

    create() {
        loadUnitJson(this.cache.json.get("units"));
        this.scene.start("MainScene")
                  .start("MainUIScene")
                  .stop();
    }
}