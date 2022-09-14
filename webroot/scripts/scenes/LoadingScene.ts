import { loadConfig } from "../model/Config";
import { loadSpawnset } from "../model/Spawnset";
import { loadUnitJson } from "../model/Units";
import { loadSavedSettings } from "../state/Settings";

/** Load json and assets */
export class LoadingScene extends Phaser.Scene {
    constructor() {
        super({
            key: "LoadingScene"
        });
    }

    preload() {
        // Loading message
        // Have to hard-code this because the config isn't loaded yet
        this.cameras.main.setBackgroundColor("#28282e");
        this.add.text(this.game.renderer.width / 2, this.game.renderer.height / 2, "Loading...",
            { font: "bold 64px Verdana",
            stroke: "black",
            strokeThickness: 3,
            color: "#FFF7E4" }).setOrigin(0.5, 0.5);

        // Load sprites
        let baseUnitSprites = [ 
            "bomber",
            "chaser1",
            "chaser2",
            "chaser3",
            "looper",
            "obstacle",
            "player",
            "spawner1",
            "spawner2",
            "spawner3",
            "stealer1",
            "worm",
            "wormsegment"
        ];
        baseUnitSprites.forEach(name => {
            this.load.image(name, "assets/sprites/units/" + name + ".png");
        });
        this.load.image("bomb", "assets/sprites/units/bomb.png");
        this.load.image("bombflash", "assets/sprites/units/bombflash.png");
        this.load.image("explosion", "assets/sprites/units/explosion.png");

        this.load.image("bullet", "assets/sprites/bullet.png");
        this.load.image("flame", "assets/sprites/flame.png");
        this.load.image("gem", "assets/sprites/gem.png");
        this.load.image("spawnportal", "assets/sprites/spawnportal.png");

        // Death sprites
        baseUnitSprites.forEach(name => {
            // 4 death sprites per unit (one for each corner)
            for (let i = 1; i <= 4; i++) {
                this.load.image(name + "death" + i, "assets/sprites/units/death/" + name + "death" + i + ".png");
            }
        });

        // FX
        this.load.image("particle", "assets/sprites/particle.png");

        // UI
        this.load.image("backButton", "assets/sprites/ui/backButton.png");
        this.load.image("backButtonDown", "assets/sprites/ui/backButtonDown.png");
        this.load.image("boostIcon", "assets/sprites/ui/boostIcon.png");
        this.load.image("menuButton", "assets/sprites/ui/menuButton.png");
        this.load.image("menuButtonDown", "assets/sprites/ui/menuButtonDown.png");
        this.load.image('musicOffButton', 'assets/sprites/ui/music_off_button.png');
        this.load.image('musicOffButtonDown', 'assets/sprites/ui/music_off_button_down.png');
        this.load.image('musicOnButton', 'assets/sprites/ui/music_on_button.png');
        this.load.image('musicOnButtonDown', 'assets/sprites/ui/music_on_button_down.png');
        this.load.image("playButton", "assets/sprites/ui/playButton.png");
        this.load.image("playButtonDown", "assets/sprites/ui/playButtonDown.png");
        this.load.image("progressOutline", "assets/sprites/ui/progressOutline.png");
        this.load.image("quickTurnIcon", "assets/sprites/ui/quickTurnIcon.png");
        this.load.image("retryButton", "assets/sprites/ui/retryButton.png");
        this.load.image("retryButtonDown", "assets/sprites/ui/retryButtonDown.png");
        this.load.image('soundOffButton', 'assets/sprites/ui/sound_off_button.png');
        this.load.image('soundOffButtonDown', 'assets/sprites/ui/sound_off_button_down.png');
        this.load.image('soundOnButton', 'assets/sprites/ui/sound_on_button.png');
        this.load.image('soundOnButtonDown', 'assets/sprites/ui/sound_on_button_down.png');
        this.load.image("statsButton", "assets/sprites/ui/statsButton.png");
        this.load.image("statsButtonDown", "assets/sprites/ui/statsButtonDown.png");

        // Load background
        this.load.image("background", "assets/sprites/background.png");
        this.load.image("shaderTexture", "assets/sprites/shaderTexture.png");

        // Shaders
        this.load.glsl('bundle', 'assets/shaders/bundle.glsl.js');
        
        // Load audio
        this.load.audio('backgroundMusic', 'assets/music/Endless-Cyber-Runner.mp3');

        // SFX
        this.load.audio("Ability", "assets/sfx/Ability.mp3");
        this.load.audio("BasicShot", "assets/sfx/BasicShot.mp3");
        this.load.audio("ButtonClick", "assets/sfx/button_click.ogg");
        this.load.audio("Death", "assets/sfx/Death.mp3");
        this.load.audio("EnemyBomb", "assets/sfx/EnemyBomb.mp3");
        this.load.audio("EnemyBombDrop", "assets/sfx/EnemyBombDrop.mp3");
        this.load.audio("EnemyDeath", "assets/sfx/EnemyDeath.mp3");
        this.load.audio("EnemyHit", "assets/sfx/EnemyHit.mp3");
        this.load.audio("EnemySpawned", "assets/sfx/EnemySpawned.mp3");
        this.load.audio("GemCollect", "assets/sfx/GemCollect.mp3");
        this.load.audio("LevelUp", "assets/sfx/LevelUp.mp3");
        this.load.audio("PlayerBomb", "assets/sfx/PlayerBomb.mp3");
        this.load.audio("ShotgunShot", "assets/sfx/ShotgunShot.mp3");
        this.load.audio("Spawning", "assets/sfx/Spawning.mp3");
        this.load.audio("StealerActive", "assets/sfx/StealerActive.mp3");
        this.load.audio("StealerShot", "assets/sfx/StealerShot.mp3");

        // Load json
        this.load.json("config", "assets/json/config.json");
        this.load.json("units", "assets/json/units.json");
        this.load.json("spawnset", "assets/json/spawnset.json");
    }

    create() {
        loadUnitJson(this.cache.json.get("units"));
        loadConfig(this.cache.json.get("config"));
        loadSpawnset(this.cache.json.get("spawnset"));
        loadSavedSettings();
        this.scene.start("BackgroundScene")
                  .start("MenuScene")
                  .stop();
    }
}