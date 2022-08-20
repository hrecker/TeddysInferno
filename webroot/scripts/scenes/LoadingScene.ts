import { loadConfig } from "../model/Config";
import { loadSpawnset } from "../model/Spawnset";
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
        this.load.image("stealer1", "assets/sprites/units/stealer1.png");
        this.load.image("worm", "assets/sprites/units/worm.png");
        this.load.image("wormsegment", "assets/sprites/units/wormsegment.png");

        this.load.image("player", "assets/sprites/units/player.png");

        this.load.image("bullet", "assets/sprites/bullet.png");
        this.load.image("flame", "assets/sprites/flame.png");
        this.load.image("gem", "assets/sprites/gem.png");
        this.load.image("spawnportal", "assets/sprites/spawnportal.png");

        // UI
        this.load.image("backButton", "assets/sprites/ui/backButton.png");
        this.load.image("backButtonDown", "assets/sprites/ui/backButtonDown.png");
        this.load.image("boostIcon", "assets/sprites/ui/boostIcon.png");
        this.load.image("menuButton", "assets/sprites/ui/menuButton.png");
        this.load.image("menuButtonDown", "assets/sprites/ui/menuButtonDown.png");
        this.load.image("playButton", "assets/sprites/ui/playButton.png");
        this.load.image("playButtonDown", "assets/sprites/ui/playButtonDown.png");
        this.load.image("quickTurnIcon", "assets/sprites/ui/quickTurnIcon.png");
        this.load.image("retryButton", "assets/sprites/ui/retryButton.png");
        this.load.image("retryButtonDown", "assets/sprites/ui/retryButtonDown.png");
        this.load.image("statsButton", "assets/sprites/ui/statsButton.png");
        this.load.image("statsButtonDown", "assets/sprites/ui/statsButtonDown.png");

        // Load background
        this.load.image("background", "assets/sprites/background.png");
        this.load.image("shaderTexture", "assets/sprites/shaderTexture.png");

        // Shaders
        this.load.glsl('bundle', 'assets/shaders/bundle.glsl.js');
        
        // Load audio
        this.load.audio('backgroundMusic', 'assets/music/Endless-Cyber-Runner.mp3');

        // Load json
        this.load.json("config", "assets/json/config.json");
        this.load.json("units", "assets/json/units.json");
        this.load.json("spawnset", "assets/json/spawnset.json");
    }

    create() {
        loadUnitJson(this.cache.json.get("units"));
        loadConfig(this.cache.json.get("config"));
        loadSpawnset(this.cache.json.get("spawnset"));
        this.scene.start("BackgroundScene")
                  .start("MenuScene")
                  .stop();
    }
}