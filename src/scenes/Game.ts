import Phaser from "phaser";
// import UIBarComponent from "../components/UIBarComponent";
import PlayerController from "../controllers/PlayerController";
import PunkController from "../controllers/PunkController";
// import ComponentService from "../services/ComponentService";

import { debugDraw } from "../utils/debug";

export default class Game extends Phaser.Scene {

    private player!: Phaser.Physics.Arcade.Sprite;
    private playerController!: PlayerController;

    private punk!: Phaser.Physics.Arcade.Sprite
    private punks?: PunkController[] = []
    private punkController!: PunkController;

    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys

    // private components!: ComponentService

    constructor(){
        super('game')
    }

    init(){

        this.scene.launch('game-ui')

        this.cursors = this.input.keyboard.createCursorKeys()
        
        // create components service
        // this.components = new ComponentService()

        // // clean up components on scene shutdown
        // this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
        //     this.components.destroy()
        // })

        // this.events.on(Phaser.Scenes.Events.POST_UPDATE, this.lateUpdate, this)

    }

    create(){

        console.log()

        const scene = this.scene;

        const { width, height } = this.scale

        const map = this.make.tilemap({key:'tileset'});
        const tiles = map.addTilesetImage('tileset','street-tileset');
        const backgroundLayer = map.createLayer('background',tiles,0,0);
        backgroundLayer.setCollisionByProperty({collides:true})

        const video = this.add.video(1435,348,'the-clock')
        video.setScale(.37)
        video.setMute(true)
        video.play();
        // debugDraw(backgroundLayer,this)

        this.cameras.main.setBounds(0,0,map.tileWidth * map.width,map.tileHeight * map.height)

        const objectLayer = map.getObjectLayer('objects')

        let punkTypeCounter = 0;


        objectLayer.objects.forEach(objData => {
            const { x = 0, y = 0, name, width = 0, height = 0 } = objData

            switch(name){
                case 'player':
                    
                    this.player =  this.physics.add.sprite(x + (width * 0.5),y, "brawler-girl", "idle1.png")
                    this.playerController = new PlayerController(this.player,"brawler-girl",this,this.cursors)
                    this.physics.add.collider(this.player,backgroundLayer)
                    this.cameras.main.startFollow(this.player)
                    // this.player.setCollideWorldBounds(true)
                    break;
                case 'punk':
                    
                    let type;
                    if (punkTypeCounter === 0) type = "bana"
                    else if (punkTypeCounter === 1) type = "jack"
                    else if (punkTypeCounter === 2) type = "david"

                    ++punkTypeCounter;
                    if (punkTypeCounter === 3){
                        punkTypeCounter = 0;
                    }

                    const punk = this.physics.add.sprite(x,y,`punk-${type}`, "idle1.png");
                    punk.setData('type','punk')
                    const punkController = new PunkController(this,punk,type)

                    this.punks.push(punkController);

                    this.physics.add.collider(punk,backgroundLayer)

                    this.physics.add.overlap(this.playerController.attackHitBox, punkController.bodyHitBox,() => {                        
                        if (!punkController.stateMachine.isCurrentState('hurt')){
                            let attackDamage = this.player.anims.currentAnim.key.indexOf('light') > -1 ? 1 : 3;
                            if (this.player.anims.currentAnim.key.indexOf('jump') > -1 ){
                                attackDamage = attackDamage * 2
                            }
                            punkController.onTakeDamage(attackDamage)
                        }
                    }, undefined, this)

                    this.physics.add.overlap(punkController.attackHitBox, this.playerController.bodyHitBox, () => {
                        if (!this.playerController.stateMachine.isCurrentState('hurt')) this.playerController.onTakeDamage(1)
                    }, undefined, this)

                    break;

            }
        })

        // this.punk = this.physics.add.sprite(width * 0.85, height * 0.5, "punk", "idle1.png")        
        // this.components.addComponent(this.punk, new UIBarComponent())
        // this.punkController = new PunkController(this,this.punk);
        // this.punks.push(new PunkController(this,this.punk))

    }

    private handlePlayerAttack(obj1:Phaser.GameObjects.GameObject,obj2:Phaser.GameObjects.GameObject){
        if (!this.punkController.stateMachine.isCurrentState('hurt')){
            let attackDamage = this.player.anims.currentAnim.key.indexOf('light') > -1 ? 1 : 3;
            this.punkController.onTakeDamage(attackDamage)
        }
    }

    private handlePunkAttack(obj1:Phaser.GameObjects.GameObject,obj2:Phaser.GameObjects.GameObject){
        if (!this.playerController.stateMachine.isCurrentState('hurt')) this.playerController.onTakeDamage(1)
    }

    // lateUpdate(time: number, delta: number){
    //     this.components.update(delta)    
    // }

    update(time: number, delta: number): void {
        this.playerController.update(delta)
        // this.punkController.update(delta,playerPosition)
        this.punks.forEach((punkController) => punkController.update(delta,this.player))

        if (this.playerController.stateMachine.isCurrentState('die')){
            setTimeout(() => {
                this.scene.launch('game-over');
            }, 2000);
        }
    }
}