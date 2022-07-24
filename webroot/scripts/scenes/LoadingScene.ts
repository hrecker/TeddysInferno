import { loadConfig } from "../model/Config";
import { loadUnitJson } from "../model/Units";

/** Load json and assets */
export class LoadingScene extends Phaser.Scene {
    constructor() {
        super({
            key: "LoadingScene"
        });
    }

    preload() {
        // Load sprites
        this.load.image("bomb", "assets/sprites/units/bomb.png");
        this.load.image("bombflash", "assets/sprites/units/bombflash.png");
        this.load.image("bomber", "assets/sprites/units/bomber.png");
        this.load.image("chaser1", "assets/sprites/units/chaser1.png");
        this.load.image("chaser2", "assets/sprites/units/chaser2.png");
        this.load.image("chaser3", "assets/sprites/units/chaser3.png");
        this.load.image("explosion", "assets/sprites/units/explosion.png");
        this.load.image("looper", "assets/sprites/units/looper.png");
        this.load.image("obstacle", "assets/sprites/units/obstacle.png");
        this.load.image("spawner1", "assets/sprites/units/spawner1.png");
        this.load.image("spawner2", "assets/sprites/units/spawner2.png");
        this.load.image("spawner3", "assets/sprites/units/spawner3.png");
        this.load.image("worm", "assets/sprites/units/worm.png");
        this.load.image("wormsegment", "assets/sprites/units/wormsegment.png");

        this.load.image("player", "assets/sprites/units/player.png");

        this.load.image("bullet", "assets/sprites/bullet.png");
        this.load.image("gem", "assets/sprites/gem.png");

        // UI
        this.load.image("playButton", "assets/sprites/ui/playButton.png");
        this.load.image("playButtonDown", "assets/sprites/ui/playButtonDown.png");

        // Load background
        this.load.image("background", "assets/sprites/background.png");

        // Load json
        this.load.json("units", "assets/json/units.json");
        this.load.json("config", "assets/json/config.json");
    }

    create() {
        loadUnitJson(this.cache.json.get("units"));
        loadConfig(this.cache.json.get("config"));
        this.scene.start("MenuScene")
                  .stop();
    }
}