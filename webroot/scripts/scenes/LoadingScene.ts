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
        this.load.image("chaser1", "assets/sprites/units/chaser1.png");
        this.load.image("chaser2", "assets/sprites/units/chaser2.png");
        this.load.image("chaser3", "assets/sprites/units/chaser3.png");
        this.load.image("spawner1", "assets/sprites/units/spawner1.png");
        this.load.image("spawner2", "assets/sprites/units/spawner2.png");
        this.load.image("spawner3", "assets/sprites/units/spawner3.png");
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