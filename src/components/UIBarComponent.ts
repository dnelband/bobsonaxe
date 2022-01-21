import Phaser from "phaser";
import { IComponent } from "../services/ComponentService";

export default class UIBarComponent implements IComponent {

    private gameObject: Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform
    private graphics?: Phaser.GameObjects.Graphics

    init(go:Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform){
        this.gameObject = go;
    }

    start(){
        
        console.log('start')

        const { scene } = this.gameObject
        
        this.graphics = scene.add.graphics()
        this.setHealthBar(100)
        
    }

    update(dt:number){
        
        if (!this.graphics){
            return
        }

        this.graphics.x = this.gameObject.x - 50
        this.graphics.y = this.gameObject.y - 90
    }
    
    setHealthBar(value:number){

        const width = 100;
        const height = 10;
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

}
