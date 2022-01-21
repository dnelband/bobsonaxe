import Phaser from "phaser";
import { sceneEvents as events } from "../events/EventsCenter";

export default class UI extends Phaser.Scene{

    private graphics: Phaser.GameObjects.Graphics;
    private lastHealth: number = 100;
    
    constructor(){
        super('game-ui')
    }
    
    init(){

    }
    
    create(){

        console.log('what')

        // adding graphics object
        this.graphics = this.add.graphics()
        this.setHealthBar(100)


        events.on('player-health-changed', this.handleHealthChanged, this)
    }

    private setHealthBar(value:number){

        const width = 300;
        const height = 20;
        const percent = Phaser.Math.Clamp(value,0,100) / 100;

        this.graphics.clear();
        // first thing that is drawn will be gray
        this.graphics.fillStyle(0x808080)
        // the background of the hp bar
        this.graphics.fillRoundedRect(10,10,width,height,2)

        if (percent > 0){
            // next thing that is drawn will be green
            this.graphics.fillStyle(0xff0000)
            // the filling of the hp bar
            this.graphics.fillRoundedRect(10,10,width * percent,height,2)
        }
    }

    private handleHealthChanged(value:number){
        
        this.tweens.addCounter({
            from:this.lastHealth,
            to:value,
            duration:200,
            onUpdate: tween => {
                const value = tween.getValue();
                this.setHealthBar(value);
            }
        })
        
        this.lastHealth = value;
    }
}