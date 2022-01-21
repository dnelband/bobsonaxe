import Phaser from 'phaser'

const createShadowAnimations = (anims: Phaser.Animations.AnimationManager) => {
    
    anims.create({
        key: 'shadow-idle',
        frames: anims.generateFrameNames('shadow', { start: 1, end: 1, prefix: 'walk', suffix: '.png' }),
        repeat: -1,
        frameRate: 5
    })
    
    anims.create({
        key: 'shadow-walk',
        frames: anims.generateFrameNames('shadow', { start: 1, end: 2, prefix: 'walk', suffix: '.png' }),
        repeat: -1,
        frameRate: 5
    })

    anims.create({
        key: 'shadow-jump',
        frames: anims.generateFrameNames('shadow', { start: 1, end: 6, prefix: 'jump', suffix: '.png' }),
        frameRate: 7
    })
    
}

export {
	createShadowAnimations
}
