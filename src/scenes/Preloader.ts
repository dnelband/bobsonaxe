import Phaser from "phaser";

export default class Preloader extends Phaser.Scene {
    constructor(){
        super('preloader')
    }
    preload(){    
        // this.load.image('pacman-tiles','assets/tilesets/tilesetx64.png');
        // this.load.image('colored-tiles','assets/tilesets/colored-tilesx64.png');
        // this.load.tilemapTiledJSON('tileset','assets/tilesets/pacman-02.json');

        this.load.image('street-tileset','assets/tiles/street-tileset64.png');

        this.load.tilemapTiledJSON('tileset','assets/tiles/street-tileset64.json')

        this.load.image('middle-finger','assets/objects/middle_finger.png')

        this.load.atlas('brawler-girl', 'assets/characters/brawler-girl.png', 'assets/characters/brawler-girl.json')
		this.load.atlas('punk', 'assets/characters/punk.png', 'assets/characters/punk.json')
		this.load.atlas('punk-bana', 'assets/characters/punk-bana.png', 'assets/characters/punk-bana.json')
		this.load.atlas('punk-jack', 'assets/characters/punk-jack.png', 'assets/characters/punk-jack.json')
		this.load.atlas('punk-david', 'assets/characters/punk-david.png', 'assets/characters/punk-david.json')

        this.load.atlas('shadow', 'assets/effects/shadow.png', 'assets/effects/shadow.json')

        this.load.video('the-clock',  'assets/videos/the_clock.mp4')
        this.load.image('y-r-u-ge',  'assets/background/y-r-u-ge.jpg')

    }


    create(){
        this.scene.start("game");
    }
}