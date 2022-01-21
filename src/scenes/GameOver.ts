import Phaser from "phaser";

export default class GameOver extends Phaser.Scene {
    constructor(){
        super('game-over')
    }

    create(){
        const { width, height } = this.scale
        this.add.image(width * 0.5, height * 0.5, 'y-r-u-ge');
    }
}