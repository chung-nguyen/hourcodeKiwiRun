exports = {
	background: {
		image: "resources/images/level/backgroundSky.png"
	},
	fargroundBrush: {
		image: "resources/images/level/fargroundBrush.png"
	},
	midgroundBrush: {
		image: "resources/images/level/midgroundBrush.png"
	},
	cloud: {
		image: "resources/images/level/cloud",
		candidates: [1, 2, 3, 4, 5]
	},
	water: {
		image: "resources/images/level/waterFase.png"
	},
	platform: {
		image: "resources/images/level/platform",
		candidates: [256, 512, 768, 1024],
		collision: "ground",
		object: {
			image: "resources/images/star.png",
			collision: "star"
		},
		enemy: {
			image: "resources/images/enemies/bee",
			defaultAnimation: "flying",
			startTime: 0,
			rate: 1,
			collision: "bee"
		}
	},
	character: {
		image: "resources/images/avatarKiwiAce/kiwiAce",
		defaultAnimation: "run",
		gravity: 0,
		hold_gravity: 0 / 3,
		jump_velocity: 0,
		roll_velocity: 0,
		initial_speed: 0,
		world_acceleration: 0 
	},
	sound: {
		background: {volume: 1, background: true}
	}
};