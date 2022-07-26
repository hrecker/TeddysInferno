import 'phaser';

import { LoadingScene } from "./scenes/LoadingScene";
import { MainScene } from "./scenes/MainScene";
import { MainUIScene } from "./scenes/MainUIScene";
import { MenuScene } from './scenes/MenuScene';

var config: Phaser.Types.Core.GameConfig = {
    width: 960,
    height: 640,
    // NOTE - With hardware acceleration disabled in Chrome, WEBGL causes enormous CPU usage on my desktop.
    // Will want to test on some other devices to see if there are performance issues.
    type: Phaser.WEBGL,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: [
        LoadingScene,
        MenuScene,
        MainScene,
        MainUIScene
    ]
};

new Phaser.Game(config);
