import './style.css'
import Phaser from 'phaser'
import StartScene from './scenes/StartScene'
import GameScene from './scenes/GameScene'
import VictoryScene from './scenes/VictoryScene'
import BossScene from './scenes/BossScene'

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 1000 },
            debug: false
        }
    },
    scene: [StartScene, GameScene, VictoryScene, BossScene]
}

new Phaser.Game(config)
