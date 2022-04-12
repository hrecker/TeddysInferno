import 'phaser';

import { LoadingScene } from "./scenes/LoadingScene";
import { MainScene } from "./scenes/MainScene";
import { MainUIScene } from "./scenes/MainUIScene";

var config: Phaser.Types.Core.GameConfig = {
    width: 800,
    height: 608,
    physics: {
        default: 'arcade',
        arcade: {
            debug: true
        }
    },
    scene: [
        LoadingScene,
        MainScene,
        MainUIScene
    ]
};

new Phaser.Game(config);
