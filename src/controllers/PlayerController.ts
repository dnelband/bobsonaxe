import Phaser from "phaser";
import StateMachine from "../statemachine/StateMachine";
import { sceneEvents as events } from "../events/EventsCenter";

export default class PlayerController {

    private scene: Phaser.Scene
    private sprite: Phaser.Physics.Arcade.Sprite
    private type: String
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private keys: any;
    
    attackHitBox: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
    bodyHitBox: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;

    private shadow: Phaser.Physics.Arcade.Sprite

    private HP: number = 100;
    private playerSpeed: number = 300;
    private attackType!: String;
    private attackNumber: number = 1;

    private attackDurationTimer: number = 0;

    private hurtCounter: number = 0;
    private hurtCoolDownTimer: number = 0;
    private hurtThreshHold: number = 3;

    jumpTimer: number = 0;
    preJumpPositionY!: number;

    stateMachine: StateMachine

    constructor(
            sprite:Phaser.Physics.Arcade.Sprite,
            type: String, 
            scene:Phaser.Scene, 
            cursors:Phaser.Types.Input.Keyboard.CursorKeys
        )
    {

        this.scene = scene;

        this.sprite = sprite;
        this.sprite.setSize(100,30);
        this.sprite.body.offset.y = this.sprite.height - 15;

        this.type = type;

        this.attackHitBox = this.scene.add.rectangle(this.sprite.x + 75,this.sprite.y, 100, 30, 0xff0000, 0) as unknown as Phaser.Types.Physics.Arcade.ImageWithDynamicBody
        this.bodyHitBox = this.scene.add.rectangle(this.sprite.x,this.sprite.y, 100, this.sprite.height / 2, 0xff000, 0) as unknown as Phaser.Types.Physics.Arcade.ImageWithDynamicBody
        this.scene.physics.add.existing(this.bodyHitBox)

        this.cursors = cursors;

        this.keys = {
            heavyAttack:this.scene.input.keyboard.addKey('ENTER'),
            lightAttack: this.scene.input.keyboard.addKey('CTRL'),
            lightAttack2: this.scene.input.keyboard.addKey('B'),
            roll:this.scene.input.keyboard.addKey('V')
        }

        this.shadow = this.scene.physics.add.sprite(this.sprite.x - 15,this.sprite.y + (this.sprite.height / 2),'shadow','idle1.png')
        this.shadow.setDisplaySize(120,40)

        this.createAnimations()

        this.stateMachine = new StateMachine(this, `player: {${this.type}}`);

        this.stateMachine.addState('idle',{
            onEnter:this.onIdleEnter,
            onUpdate:this.onIdleUpdate
        }).addState('walk',{
            onEnter:this.onWalkEnter,
            onUpdate:this.onWalkUpdate
        }).addState('roll',{
            onEnter:this.onRollEnter,
            onUpdate:this.onRollUpdate
        })
        .addState('attack',{
            onEnter:this.onAttackEnter,
            onUpdate:this.onAttackUpdate,
            onExit:this.onAttackExit
        }).addState('jump',{
            onEnter:this.onJumpEnter,
            onUpdate:this.onJumpUpdate
        }).addState('jump-attack',{
            onEnter:this.onJumpAttackEnter,
            onUpdate:this.onJumpAttackUpdate,
            onExit:this.onAttackExit
        }).addState('hurt',{
            onEnter:this.onHurtEnter,
            onUpdate:this.onHurtUpdate
        }).addState('die',{
            onEnter:this.onDieEnter
        }).setState('idle')
    }

    update(dt:number) {

        if (this.HP <= 0 && !this.stateMachine.isCurrentState('die')){
            this.stateMachine.setState('die')
        }

        this.sprite.depth = ( this.jumpTimer === 0 ? this.sprite.y : this.shadow.y) + this.sprite.height;
        
        this.bodyHitBox.x = this.sprite.x;
        this.bodyHitBox.y = this.sprite.y;

        this.shadow.x = this.sprite.x + (this.sprite.flipX === true ? 7 : -7)
        this.shadow.y = this.sprite.y + (this.sprite.height / 2)
        this.shadow.depth = this.sprite.depth - 1;

        if (this.hurtCoolDownTimer > 0 && this.hurtCoolDownTimer < 30){
            ++this.hurtCoolDownTimer;
        } else if (this.hurtCoolDownTimer === 30){
            this.hurtCoolDownTimer = 0;
            this.sprite.setTint(0xffffff)
        }

        this.stateMachine.update(dt)
    }

    onTakeDamage(attackDamage:number){

        if (this.HP <= 0){
            return
        }

        if (this.attackHitBox.body){
            this.attackHitBox.body.enable = false;
			this.scene.physics.world.remove(this.attackHitBox.body)
        }

        if (this.hurtCoolDownTimer > 0 && this.hurtCoolDownTimer < 30){
            this.sprite.setTint(0xff0000)
        } else {
            
            this.hurtCoolDownTimer = 1;
            this.hurtCounter += attackDamage;

            // TODO: change this to dynamic value of hp taken from hit
            this.HP = Phaser.Math.Clamp(this.HP - 5,0,100)
            events.emit('player-health-changed',this.HP)

            if (this.hurtCounter >= this.hurtThreshHold){
                this.hurtCounter = 0;
                if (this.jumpTimer === 0) this.stateMachine.setState('hurt')
            }
        }
    }


    private removeHitBoxes(gameObjects:any[]){
        const scene = this.scene;
        gameObjects.forEach(function(gameObject:any) {
            if (gameObject.body){
                gameObject.body.enable = false;
                scene.physics.world.remove(gameObject.body)
            }
        })
    }


    private onIdleEnter(){
        this.sprite.setVelocity(0,0)
        this.sprite.anims.play(this.type+'-idle');
        this.shadow.anims.play('shadow-idle')
    }

    private onIdleUpdate(){

        const spaceJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.space)
        if (spaceJustPressed){
            this.stateMachine.setState('jump')
        }

		const leftDown = this.cursors.left?.isDown
		const rightDown = this.cursors.right?.isDown
		const upDown = this.cursors.up?.isDown
		const downDown = this.cursors.down?.isDown

        if (this.keys?.lightAttack?.isDown){
            this.attackType = 'light';
            this.attackNumber = 1;
            this.stateMachine.setState('attack')
        } else if (this.keys?.lightAttack2?.isDown){
            this.attackType = 'light';
            this.attackNumber = 2;
            this.stateMachine.setState('attack')            
        } else if (this.keys?.heavyAttack?.isDown){
            this.attackType = 'heavy';
            this.attackNumber = 1;
            this.stateMachine.setState('attack')
        } else if (this.keys?.roll?.isDown){
            this.stateMachine.setState('roll')
        }

		if (leftDown || rightDown || upDown || downDown)
		{
			this.stateMachine.setState('walk')
		}

    }

    private onWalkEnter(){
        this.sprite.anims.play(this.type+'-walk')
        this.shadow.anims.play('shadow-walk')
    }

    private onWalkUpdate(){

        const spaceJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.space)
        if (spaceJustPressed){
            this.stateMachine.setState('jump')
        }

        let velocityMultiplier = 1;

		const leftDown = this.cursors.left?.isDown
		const rightDown = this.cursors.right?.isDown
		const upDown = this.cursors.up?.isDown
		const downDown = this.cursors.down?.isDown

        if (this.keys?.lightAttack?.isDown){
            this.attackType = 'light';
            this.attackNumber = 1;
            this.stateMachine.setState('attack')
        } else if (this.keys?.lightAttack2?.isDown){
            this.attackType = 'light';
            this.attackNumber = 2;
            this.stateMachine.setState('attack')            
        } else if (this.keys?.heavyAttack?.isDown){
            this.attackType = 'heavy';
            this.attackNumber = 1;
            this.stateMachine.setState('attack')
        } else if (this.keys?.roll?.isDown){
            velocityMultiplier = 1.8
        }

        if (leftDown || rightDown || upDown || downDown){

            let velocityX = 0;
            let velocityY = 0;
            
            this.sprite.flipX = false

            if (leftDown){
                velocityX = -this.playerSpeed
                this.sprite.flipX = true
            } 
            
            if (rightDown){
                velocityX = this.playerSpeed
            } 
            
            if (upDown){
                velocityY = (this.playerSpeed / 1.2) * -1
            } 
            
            if (downDown){
                velocityY = (this.playerSpeed / 1.2)
            }

            this.sprite.setVelocity(velocityX * velocityMultiplier,velocityY * velocityMultiplier)
            
            if (this.keys?.roll?.isDown){
                this.stateMachine.setState('roll')
            }

        } else {
            this.sprite.setVelocity(0,0)
            this.stateMachine.setState('idle')      
        }
    }

    private onRollEnter(){
        this.sprite.anims.play('brawler-girl-roll')
        this.removeHitBoxes([this.bodyHitBox])
    }

    private onRollUpdate(){
        if (this.sprite.anims.isPlaying && this.sprite.anims.currentAnim.key === 'brawler-girl-roll'){
            
        } else {
            this.bodyHitBox.body.enable = true
            this.scene.physics.world.add(this.bodyHitBox.body)
            this.stateMachine.setState('idle')
        }
    }

    private onAttackEnter(){

        // this.attackDurationTimer = 0;

        this.sprite.anims.play(`${this.type}-${this.attackType}-attack-${this.attackNumber}`)
        const startHit = (anim:Phaser.Animations.Animation,frame:Phaser.Animations.AnimationFrame) => {

            if (this.attackType === 'light' && frame.index < 1 || this.attackType === 'heavy' && frame.index < 3)
            {
                return
            }
            this.sprite.off(Phaser.Animations.Events.ANIMATION_UPDATE, startHit)

            this.scene.physics.add.existing(this.attackHitBox)
            this.scene.physics.world.remove(this.attackHitBox.body)

            this.attackHitBox.body.setSize(100,30)

            if (this.attackType === 'heavy' && frame.index > 3){
                this.attackHitBox.body.enable = false
                this.scene.physics.world.remove(this.attackHitBox.body)
            } else {
                this.attackHitBox.x = this.sprite.flipX
                ? this.sprite.x - 85
                : this.sprite.x + 85
    
                this.attackHitBox.y = this.sprite.y
    
                this.attackHitBox.body.enable = true
                this.scene.physics.world.add(this.attackHitBox.body)
                if (this.attackType === "heavy") this.sprite.setVelocity((this.sprite.flipX === true ? -this.playerSpeed : this.playerSpeed) / 4,0)
                else this.sprite.setVelocity(0,0)
            }

        }
        this.sprite.on(Phaser.Animations.Events.ANIMATION_UPDATE, startHit)

		this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + `${this.type}-${this.attackType}-attack-${this.attackNumber}`, () => {
			this.stateMachine.setState('idle')
			// TODO: hide and remove the sword swing hitbox
			this.attackHitBox.body.enable = false;
			this.scene.physics.world.remove(this.attackHitBox.body)
		})
    }

    private onAttackUpdate(){

        ++this.attackDurationTimer

        if (this.sprite.anims.isPlaying && this.sprite.anims.currentAnim.key === `${this.type}-${this.attackType}-attack-${this.attackNumber}`){

            if (this.attackType === 'heavy' && this.attackDurationTimer > 45 ){
                if (this.attackHitBox.body){
                    this.attackHitBox.body.enable = false;
                    this.scene.physics.world.remove(this.attackHitBox.body)
                }
            }

        } else {
            this.stateMachine.setState('idle')
        }

    }

    private onAttackExit(){
        this.attackDurationTimer = 0;
    }
    
    private onJumpEnter(){
        this.preJumpPositionY = this.sprite.y;
        this.sprite.anims.play(`${this.type}-jump`)
        this.shadow.anims.play('shadow-jump')
        this.sprite.body.enable = false;
    }
    
    private onJumpUpdate(){
        this.onAirBourneUpdate()
    }

    private onJumpAttackEnter(){
        this.sprite.anims.play(`${this.type}-jump-${this.attackType}-attack`)

        const startHit = (anim:Phaser.Animations.Animation,frame:Phaser.Animations.AnimationFrame) => {
            if (this.attackType === 'light' && frame.index < 1 || this.attackType === 'heavy' && frame.index < 3)
            {
                return
            }

            this.scene.physics.add.existing(this.attackHitBox)
            this.scene.physics.world.remove(this.attackHitBox.body)
            
            this.sprite.off(Phaser.Animations.Events.ANIMATION_UPDATE, startHit)

            this.attackHitBox.body.enable = true
            this.scene.physics.world.add(this.attackHitBox.body)

            this.attackHitBox.x = this.sprite.flipX
            ? this.sprite.x - 75
            : this.sprite.x + 75

            if (this.attackType === 'light') {
                this.attackHitBox.body.setSize(50,100)
            } else if (this.attackType === 'heavy'){
                this.attackHitBox.body.setSize(100,50)
            }
            
        }
        
        this.sprite.on(Phaser.Animations.Events.ANIMATION_UPDATE, startHit)

		this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + `${this.type}-jump-${this.attackType}-attack`, () => {
			// this.stateMachine.setState('idle')
			// TODO: hide and remove the sword swing hitbox
			this.attackHitBox.body.enable = false;
			this.scene.physics.world.remove(this.attackHitBox.body)
		})

    }

    private onJumpAttackUpdate(){
        ++this.attackDurationTimer
        this.attackHitBox.y = this.attackType === "light" ? this.sprite.y : this.sprite.y + 50
        this.onAirBourneUpdate()
    }

    private onAirBourneUpdate() {

        ++this.jumpTimer;

        if (this.sprite.anims.isPlaying && this.sprite.anims.currentAnim.key === `${this.type}-jump-${this.attackType}-attack`){
            // console.log(`playing ${this.attackType} animation`)
        } else {
            if (this.keys?.lightAttack?.isDown || this.keys?.lightAttack2?.isDown){
                this.attackType = "light"
                this.stateMachine.setState('jump-attack')
            } else if (this.keys?.heavyAttack.isDown){
                this.attackType = "heavy"
                this.stateMachine.setState('jump-attack')
            }
        }

        const leftDown = this.cursors.left?.isDown
		const rightDown = this.cursors.right?.isDown

        let velocityX = this.sprite.x;
        if (leftDown){
            this.sprite.flipX = true;
            if (this.attackHitBox.body){
                this.attackHitBox.x = this.sprite.x - 75
            }
            velocityX = this.sprite.x - 3;
        } else if (rightDown){
            this.sprite.flipX = false;
            if (this.attackHitBox.body){
                this.attackHitBox.x = this.sprite.x + 75
            }            
            velocityX = this.sprite.x + 3;
        }

        if (this.jumpTimer > 30 && this.jumpTimer < 60){
            this.sprite.setPosition(velocityX,this.sprite.y - 5)
        } else if (this.jumpTimer >= 70 && this.jumpTimer < 90){
            this.sprite.setPosition(velocityX,this.sprite.y)
        } else if (this.jumpTimer >= 90 && this.jumpTimer < 120){
            this.sprite.setPosition(velocityX,this.sprite.y + 5)
        } else if (this.jumpTimer >= 120){

            if (this.attackHitBox.body !== null){
                this.attackHitBox.body.enable = false;
                this.scene.physics.world.remove(this.attackHitBox.body)
            }

            this.stateMachine.setState('idle')

            this.sprite.body.enable = true;
            this.jumpTimer = 0
            this.sprite.setPosition(velocityX,this.sprite.y)
        
        }
        
        this.shadow.setPosition(this.sprite.x, this.preJumpPositionY + (this.sprite.height / 2))

    }

    private onHurtEnter(){

        if (this.attackHitBox.body){
            this.attackHitBox.body.enable = false;
			this.scene.physics.world.remove(this.attackHitBox.body)
        }
        this.sprite.anims.play(`${this.type}-hurt`)
		this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + `${this.type}-hurt`, () => {
            this.stateMachine.setState('idle')
		})
    }

    private onHurtUpdate(){
        this.sprite.setVelocityX(this.sprite.flipX === false ? -(this.playerSpeed / 2) : (this.playerSpeed / 2))
        // this.sprite.setTint(0xffffff)
        // this.stateMachine.setState('idle')
    }

    private onDieEnter(){
        this.sprite.anims.play('brawler-girl-die')
        // console.log('dead coz')
    }

    createAnimations(){

        this.sprite.anims.create({
            key: 'brawler-girl-idle',
            frames: this.sprite.anims.generateFrameNames('brawler-girl', { start: 1, end: 4, prefix: 'idle', suffix: '.png' }),
            repeat: -1,
            frameRate: 10
        })

        this.sprite.anims.create({
            key: 'brawler-girl-walk',
            frames: this.sprite.anims.generateFrameNames('brawler-girl', { start: 1, end: 10, prefix: 'walk', suffix: '.png' }),
            repeat: -1,
            frameRate: 10
        })


        this.sprite.anims.create({
            key: 'brawler-girl-roll',
            frames: this.sprite.anims.generateFrameNames('brawler-girl', { start: 1, end: 4, prefix: 'roll', suffix: '.png' }),
            frameRate: 10
        })


        this.sprite.anims.create({
            key: 'brawler-girl-light-attack-1',
            frames: this.sprite.anims.generateFrameNames('brawler-girl', { start: 1, end: 3, prefix: 'jab', suffix: '.png' }),
            frameRate: 10
        })

        this.sprite.anims.create({
            key: 'brawler-girl-light-attack-2',
            frames: this.sprite.anims.generateFrameNames('brawler-girl', { start: 1, end: 3, prefix: 'punch', suffix: '.png' }),
            frameRate: 10
        })

        this.sprite.anims.create({
            key: 'brawler-girl-heavy-attack-1',
            frames: this.sprite.anims.generateFrameNames('brawler-girl', { start: 1, end: 5, prefix: 'kick', suffix: '.png' }),
            frameRate:10
        })

        this.sprite.anims.create({
            key: 'brawler-girl-jump',
            frames: this.sprite.anims.generateFrameNames('brawler-girl', { start: 1, end: 4, prefix: 'jump', suffix: '.png' }),
            frameRate: 5
        })

        this.sprite.anims.create({
            key: 'brawler-girl-jump-light-attack',
            frames: this.sprite.anims.generateFrameNames('brawler-girl', { start: 1, end: 3, prefix: 'jump_kick', suffix: '.png' }),
            frameRate: 15
        })

        this.sprite.anims.create({
            key: 'brawler-girl-jump-heavy-attack',
            frames: this.sprite.anims.generateFrameNames('brawler-girl', { start: 1, end: 5, prefix: 'dive_kick', suffix: '.png' }),
            frameRate: 15
        })

        this.sprite.anims.create({
            key: 'brawler-girl-hurt',
            frames: this.sprite.anims.generateFrameNames('brawler-girl', { start: 1, end: 2, prefix: 'hurt', suffix: '.png' }),
            frameRate: 5
        })

        this.sprite.anims.create({
            key: 'brawler-girl-die',
            frames: this.sprite.anims.generateFrameNames('brawler-girl', { start: 1, end: 4, prefix: 'hurt', suffix: '.png' }),
            frameRate: 5
        })

        this.shadow.anims.create({
            key: 'shadow-idle',
            frames: this.sprite.anims.generateFrameNames('shadow', { start: 1, end: 1, prefix: 'walk', suffix: '.png' }),
            repeat: -1,
            frameRate: 5
        })

        this.shadow.anims.create({
            key: 'shadow-walk',
            frames: this.sprite.anims.generateFrameNames('shadow', { start: 1, end: 2, prefix: 'walk', suffix: '.png' }),
            repeat: -1,
            frameRate: 5
        })

        this.shadow.anims.create({
            key: 'shadow-jump',
            frames: this.sprite.anims.generateFrameNames('shadow', { start: 1, end: 6, prefix: 'jump', suffix: '.png' }),
            frameRate: 7
        })

    }

}