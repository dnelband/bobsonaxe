import Phaser from 'phaser';
import Preloader from './scenes/Preloader';
import Game from './scenes/Game';
import UI from './scenes/UI';
import GameOver from './scenes/GameOver';

var config = {
    type: Phaser.AUTO,
    width: 1904,
    height: 1064,
    physics: {
        default: 'arcade',
        arcade: {
            // debug:true,
            gravity: { y: 0 }
        }
    },
    scene:[Preloader,Game, UI, GameOver]
};

var game = new Phaser.Game(config);