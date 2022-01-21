import Phaser from 'phaser'

const createPunkAnimations = (anims: Phaser.Animations.AnimationManager,type:string) => {
	
	/* regular punk */

	anims.create({
		key: 'punk-idle',
		frames: anims.generateFrameNames('punk', { start: 1, end: 4, prefix: 'idle', suffix: '.png' }),
		repeat: -1,
		frameRate: 8
	})

	anims.create({
		key: 'punk-walk',
		frames: anims.generateFrameNames('punk', { start: 1, end: 4, prefix: 'walk', suffix: '.png' }),
		repeat: -1,
		frameRate: 8
	})

	anims.create({
		key: 'punk-attack',
		frames: anims.generateFrameNames('punk', { start: 1, end: 4, prefix: 'punch', suffix: '.png' }),
		frameRate: 7
	})

	anims.create({
		key: 'punk-hurt',
		frames: anims.generateFrameNames('punk', { start: 2, end: 2, prefix: 'hurt', suffix: '.png' }),
		frameRate: 10
	})

	anims.create({
		key: 'punk-die',
		frames: anims.generateFrameNames('punk', { start: 1, end: 4, prefix: 'hurt', suffix: '.png' }),
		frameRate: 10
	})

	/* /regular punk */

	/* bana punk */

	anims.create({
		key: `punk-${type}-idle`,
		frames: anims.generateFrameNames(`punk-${type}`, { start: 1, end: 4, prefix: 'idle', suffix: '.png' }),
		repeat: -1,
		frameRate: 8
	})

	anims.create({
		key: `punk-${type}-walk`,
		frames: anims.generateFrameNames(`punk-${type}`, { start: 1, end: 4, prefix: 'walk', suffix: '.png' }),
		repeat: -1,
		frameRate: 8
	})

	anims.create({
		key: `punk-${type}-attack`,
		frames: anims.generateFrameNames(`punk-${type}`, { start: 1, end: 4, prefix: 'punch', suffix: '.png' }),
		frameRate: 7
	})

	anims.create({
		key: `punk-${type}-hurt`,
		frames: anims.generateFrameNames(`punk-${type}`, { start: 2, end: 2, prefix: 'hurt', suffix: '.png' }),
		frameRate: 10
	})

	anims.create({
		key: `punk-${type}-die`,
		frames: anims.generateFrameNames(`punk-${type}`, { start: 1, end: 4, prefix: 'hurt', suffix: '.png' }),
		frameRate: 10
	})

	/* /bana punk */
}

export {
	createPunkAnimations
}
