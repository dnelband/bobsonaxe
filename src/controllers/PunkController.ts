import { Vector } from "matter";
import Phaser from "phaser";
import StateMachine from "../statemachine/StateMachine";
import { createPunkAnimations } from "../anims/PunkAnimations";
import { createShadowAnimations } from "../anims/EffectsAnimations";

export default class PunkController {
    private scene: Phaser.Scene
    private sprite: Phaser.Physics.Arcade.Sprite
    private player: Phaser.Physics.Arcade.Sprite
    private type: string = "bana"
    
    attackHitBox: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
    bodyHitBox: Phaser.GameObjects.Rectangle

    private projectile?: Phaser.Physics.Arcade.Sprite
    private projectileInitialTarget?: Vector
    private shadow: Phaser.Physics.Arcade.Sprite

    private playerPosition!: Vector;
    private isInChaseRange: boolean = false;
    private attackRange: number = 150;
    private isInAttackRange: boolean = false;

    private attackCooldownTimer: number = 0;
    private attackCoolDownDuration: number = 150

    private speed: number = 200;
    private MaxHP: number = 50;
    private HP: number = this.MaxHP;
    private isDead: boolean = false;
    private hurtCounter: number = 0;
    private hurtCoolDownTimer: number = 0;
    private hurtThreshHold: number = 3;

    stateMachine: StateMachine
    private graphics?: Phaser.GameObjects.Graphics

    constructor(
            scene:Phaser.Scene,
            sprite:Phaser.Physics.Arcade.Sprite,
            type?:string
        ){
    
        this.scene = scene;
        
        this.sprite = sprite;
        this.sprite.setSize(120,30)
        this.sprite.body.offset.y = this.sprite.height - 15

        this.attackHitBox = this.scene.add.rectangle(this.sprite.x - 105,this.sprite.y, 100, 30, 0xff0000, 0) as unknown as Phaser.Types.Physics.Arcade.ImageWithDynamicBody
        this.bodyHitBox = this.scene.add.rectangle(this.sprite.x,this.sprite.y,120,this.sprite.height / 2, 0xff000, 0)
        this.scene.physics.add.existing(this.bodyHitBox)

        this.type = type

        createPunkAnimations(this.sprite.anims.animationManager,this.type)

        this.attackRange = this.type === "jack" ? 700 : 150;
        this.attackCoolDownDuration = this.type === "jack" ? 250 : 150;

        this.shadow = this.scene.physics.add.sprite(this.sprite.x - 15,this.sprite.y + (this.sprite.height / 2),'shadow','idle1.png')
        this.shadow.setDisplaySize(120,40)

        createShadowAnimations(this.shadow.anims.animationManager)

        this.stateMachine = new StateMachine(this, `punk`);

        this.stateMachine.addState('idle',{
            onEnter:this.onIdleEnter,
            onUpdate:this.onIdleUpdate
        }).addState('walk',{
            onEnter:this.onWalkEnter,
            onUpdate:this.onWalkUpdate
        }).addState('attack',{
            onEnter:this.onAttackEnter,
            onUpdate:this.onAttackUpdate,
            onExit:this.onAttackExit
        }).addState('ranged-attack',{
            onEnter:this.onRangedAttackEnter,
            onUpdate:this.onRangedAttackUpdate
        }).addState('hurt',{
            onEnter:this.onHurtEnter,
            onUpdate:this.onHurtUpdate
        }).addState('die',{
            onEnter:this.onDieEnter,
            onUpdate:this.onDieUpdate
        }).setState('idle')

        this.graphics = this.scene.add.graphics()
        this.setHealthBar(this.HP)
    }

    update(dt:number,player:Phaser.Physics.Arcade.Sprite) {

        if (this.HP <= 0 ){
            this.sprite.setTint(0xffffff)
            this.isDead = true
            this.removeHitBoxes([this.attackHitBox,this.bodyHitBox])
            return
        }

        this.player = player;

        let playerPosition = {x:this.player.x,y:this.player.y};

        this.playerPosition = playerPosition;

        this.updateSprite();

        this.stateMachine.update(dt)

    }

    private removeHitBoxes(gameObjects:any[]){
        const scene = this.scene;
        gameObjects.forEach(function(gameObject:any) {
            if (gameObject.body){
                gameObject.body.enable = false;
                scene.physics.world.remove(gameObject.body)
            }
        })
        if (this.projectile){
            // this.projectile.body.enable = false
            // scene.physics.world.remove(this.projectile.body)
            this.projectile.destroy()
        }
    }

    private updateSprite(){

        this.sprite.depth = this.sprite.y + this.sprite.height;
        
        this.bodyHitBox.x = this.sprite.x;
        this.bodyHitBox.y = this.sprite.y;

        this.shadow.x = this.sprite.x + (this.sprite.flipX === true ? 7 : -7)
        this.shadow.y = this.sprite.y + (this.sprite.height / 2)
        this.shadow.depth = this.sprite.depth - 1;

        this.graphics.x = this.sprite.x - 50
        this.graphics.y = this.sprite.y - 90

        if (this.playerPosition.x > this.sprite.x) this.sprite.flipX = true;
        else this.sprite.flipX = false;

        if (this.isInChaseRange === false){
            const cameraLeftX = this.scene.cameras.main.midPoint.x - (this.scene.scale.width / 2)
            const cameraRightX = this.scene.cameras.main.midPoint.x + (this.scene.scale.width / 2)

            if (this.sprite.x > cameraLeftX && (this.sprite.x + 400) < cameraRightX){
                this.isInChaseRange = true
            }       
        }
        
        if (this.hurtCoolDownTimer > 0 && this.hurtCoolDownTimer < 30){
            ++this.hurtCoolDownTimer;
        } else if (this.hurtCoolDownTimer === 30){
            this.hurtCoolDownTimer = 0;
            this.sprite.setTint(0xffffff)
        }

        if (this.projectile){
            this.projectile.setAngle(this.projectile.angle + 5)
        }
    }

    onTakeDamage(attackDamage: number){

        if (this.hurtCoolDownTimer > 0 && this.hurtCoolDownTimer < 30){
            this.sprite.setTint(0xff0000)
        } else {
            this.hurtCoolDownTimer = 1;
            this.hurtCounter += attackDamage;
            this.HP = Phaser.Math.Clamp(this.HP - (5 * attackDamage),0,this.MaxHP)
            this.setHealthBar(this.HP)
            
            if (this.HP <= 0 ){
                this.stateMachine.setState('die')
                return
            }
            
            if (this.hurtCounter >= this.hurtThreshHold){
                this.hurtCounter = 0;
                this.stateMachine.setState('hurt')
            }
        }
    }

    private setHealthBar(value:number){

        const width = 100;
        const height = 10;
        const percent = Phaser.Math.Clamp(value,0,this.MaxHP) / this.MaxHP;

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

    private getVelocityVector(){

        let x = 0, y = 0;

        let targetPosition = this.playerPosition.x;
        if (this.type === "david"){
            if (this.player.flipX === true ) targetPosition = this.playerPosition.x + 300;
            else targetPosition = this.playerPosition.x - 300
        }

        if (targetPosition > this.sprite.x + (this.attackRange - 10)){
            x = this.speed;
            this.sprite.flipX = true
        }
        else if (targetPosition < this.sprite.x - (this.attackRange - 10)){
            x = -this.speed;
            this.sprite.flipX = false
        }
        
        if (this.playerPosition.y > this.sprite.y + 60 ) y = this.speed / 2;
        else if (this.playerPosition.y < this.sprite.y - 60) y = -(this.speed / 2);
        return {x,y}
    }

    private onIdleEnter(){
        this.sprite.anims.play(`punk-${this.type}-idle`)
    }

    private onIdleUpdate(){

        const velocityVector = this.getVelocityVector()
        if (velocityVector.x === 0 && velocityVector.y === 0){
            this.isInAttackRange = true;
        } else {
            this.isInAttackRange = false;
            if (this.isInChaseRange === true){
                this.attackCooldownTimer = 0;
                this.stateMachine.setState('walk')
            }
        }

        if (this.isInAttackRange === true){
            if (this.attackCooldownTimer > 0 && this.attackCooldownTimer < this.attackCoolDownDuration){
                ++this.attackCooldownTimer
            } else {
                this.attackCooldownTimer = 0;
                this.stateMachine.setState('attack')
            }
        }

        else if (this.isInChaseRange === true){
            this.attackCooldownTimer = 0;
            this.stateMachine.setState('walk')
        }
    }

    private onWalkEnter(){
        this.sprite.anims.play(`punk-${this.type}-walk`)
    }

    private onWalkUpdate(){
        const velocityVector = this.getVelocityVector()
        if (velocityVector.x === 0 && velocityVector.y === 0){
            this.isInAttackRange = true;
            this.stateMachine.setState('attack')
        } else {
            this.sprite.setVelocity(velocityVector.x,velocityVector.y)
        }
    }

    private onAttackEnter(){

        if (this.type == "jack"){
            this.stateMachine.setState('ranged-attack')
            return
        }

        this.sprite.anims.play(`punk-${this.type}-attack`)
        const startHit = (anim:Phaser.Animations.Animation,frame:Phaser.Animations.AnimationFrame) => {
            if (frame.index < 3)
            {
                return
            }
            this.sprite.off(Phaser.Animations.Events.ANIMATION_UPDATE, startHit)

            this.scene.physics.add.existing(this.attackHitBox)

            this.attackHitBox.body.setSize(100,30)

                this.attackHitBox.x = this.sprite.flipX
                ? this.sprite.x + 95
                : this.sprite.x - 95
    
                this.attackHitBox.y = this.sprite.y
    
                this.attackHitBox.body.enable = true
                this.scene.physics.world.add(this.attackHitBox.body)
                this.sprite.setVelocity(0,0)

        }
        this.sprite.on(Phaser.Animations.Events.ANIMATION_UPDATE, startHit)
		this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + `punk-${this.type}-attack`, () => {
			this.stateMachine.setState('idle')
			// TODO: hide and remove the sword swing hitbox
			this.attackHitBox.body.enable = false;
			this.scene.physics.world.remove(this.attackHitBox.body)
		})

    }

    private onAttackUpdate(){
        ++this.attackCooldownTimer
        if (this.attackCooldownTimer > 60){
            this.removeHitBoxes([this.attackHitBox])
        }
        this.sprite.setVelocity(0,0)
    }

    private onAttackExit(){
        this.removeHitBoxes([this.attackHitBox])
    }

    private getInitialProjectileTarget(){

        let x = this.playerPosition.x - this.sprite.x;
        let y = this.playerPosition.y - this.sprite.y;
        return { x, y}
    }

    private onRangedAttackEnter(){
        this.sprite.anims.play('attack')
        this.projectileInitialTarget = this.getInitialProjectileTarget()
        this.sprite.anims.play(`punk-${this.type}-attack`)
        const startHit = (anim:Phaser.Animations.Animation,frame:Phaser.Animations.AnimationFrame) => {
            if (frame.index < 3)
            {
                return
            }
            this.sprite.off(Phaser.Animations.Events.ANIMATION_UPDATE, startHit)

            this.scene.physics.add.existing(this.attackHitBox)

            this.attackHitBox.body.setSize(50,50)

                this.attackHitBox.x = this.sprite.flipX
                ? this.sprite.x + 95
                : this.sprite.x - 95
     
                this.attackHitBox.y = this.sprite.y
    
                this.attackHitBox.body.enable = true
                this.scene.physics.world.add(this.attackHitBox.body)

                this.attackHitBox.body.setVelocity(this.projectileInitialTarget.x,this.projectileInitialTarget.y)

                this.sprite.setVelocity(0,0)

        }
        this.sprite.on(Phaser.Animations.Events.ANIMATION_UPDATE, startHit)
		this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + `punk-${this.type}-attack`, () => {
			// this.stateMachine.setState('idle')
		})

        // this.projectileInitialTarget = { x:this.playerPosition.x, y:this.playerPosition.y}
        // this.projectile = this.scene.physics.
    }

    private onRangedAttackUpdate(){

        if (this.attackCooldownTimer > 0){
            this.projectile.x = this.attackHitBox.x
            this.projectile.y = this.attackHitBox.y
        } else {
            this.projectile = this.scene.physics.add.sprite(this.attackHitBox.x,this.attackHitBox.y,'middle-finger')
        }

        ++this.attackCooldownTimer

        // console.log

        if (this.attackCooldownTimer >= this.attackCoolDownDuration){
            this.removeHitBoxes([this.attackHitBox])
            this.stateMachine.setState('idle')
        }

    }

    private onHurtEnter(){
        this.sprite.anims.play(`punk-${this.type}-hurt`);

        if (this.attackHitBox.body){
            this.attackHitBox.body.enable = false;
			this.scene.physics.world.remove(this.attackHitBox.body)
        }
    }

    private onHurtUpdate(){
        this.sprite.setVelocityX(this.sprite.flipX === true ? -this.speed : this.speed)
        if (this.sprite.anims.isPlaying && this.sprite .anims.currentAnim.key === `punk-${this.type}-hurt`){
            this.sprite.setVelocity(0,0)
        } else {
            this.stateMachine.setState('idle')
        }
    }

    private onDieEnter(){
        this.graphics.destroy();
        this.shadow.destroy();
        this.sprite.anims.play(`punk-${this.type}-die`)
    }

    private onDieUpdate(){
        console.log(this.sprite.anims.currentAnim.key === `punk-${this.type}-die`)
        if (this.sprite.anims.isPlaying && this.sprite.anims.currentAnim.key === `punk-${this.type}-die`){
            this.sprite.setVelocity(200,0)
        } else {
            this.sprite.setVelocity(0,0)
            // this.stateMachine.setState('idle')
        }

    }
}