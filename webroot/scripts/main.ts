import 'phaser';

import { LoadingScene } from "./scenes/LoadingScene";
import { MainScene } from "./scenes/MainScene";
import { MainUIScene } from "./scenes/MainUIScene";

var config: Phaser.Types.Core.GameConfig = {
    width: 960,
    height: 640,
    // TODO the default WebGL renderer was causing huge CPU usage on Chrome (even with a scene containing just the background image and no update logic)
    // Using Canvas here for now. May consider looking at other Phaser versions too.
    type: Phaser.CANVAS,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: [
        LoadingScene,
        MainScene,
        MainUIScene
    ]
};

new Phaser.Game(config);
