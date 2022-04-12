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
        this.load.image("chaser", "assets/sprites/units/chaser.png");
        this.load.image("player", "assets/sprites/units/player.png");

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