import device;
import ui.View;
import ui.ImageView;
import ui.SpriteView;
import ui.ImageScaleView;
import ui.resource.loader as loader;

import animate;
import AudioManager;

import math.geom.Rect as Rect;
import math.geom.Point as Point;

import src.platformer.ParallaxView as ParallaxView;
import src.platformer.GestureView as GestureView;
import src.platformer.Physics as Physics;
import src.platformer.ScoreView as ScoreView;
import src.platformer.util as util;

import resources.starGrids as starGrids;
import src.template.Config as config;

var app;
var game;
var BG_WIDTH = 1024;
var BG_HEIGHT = 576;
var DEFAULT_VALUE = false;

var ingameImages = [];

exports = Class(function(supr) {

	// Game constants, for easy tweaking:
	const REBOUND_PERCENTAGE = 0.3;
	const SCORE_STAR_VALUE = 100;
	const SCORE_TIME_VALUE = 1;

	this.init = function(_app) {
		app = _app;
		game = this;
        
        this.spriteSheet = JSON.parse(CACHE['spritesheets/map.json']);    

		// Scale the root view to 1024x576, which will fit on most phones.
		// If we didn't do this, we'd have to scale each view differently
		// for different device dimensions. This letterboxes the game, if necessary.
		this.scaleRootView(BG_WIDTH > BG_HEIGHT);

		this.backgroundCreated = DEFAULT_VALUE;
		this.farBrushCreated = DEFAULT_VALUE;
		this.midBrushCreated = DEFAULT_VALUE;
		this.playerCreated = DEFAULT_VALUE;
		this.platformCreated = DEFAULT_VALUE;
		this.starCreated = DEFAULT_VALUE;
		this.scoreCreated = DEFAULT_VALUE;
		this.cloudCreated = DEFAULT_VALUE;
		this.waterCreated = DEFAULT_VALUE;
		this.enemyCreated = DEFAULT_VALUE;
		this.soundCreated = DEFAULT_VALUE;        
      
        this.parallaxView = new ParallaxView({
			superview: app.view,
		 	width: app.view.style.width,
		 	height: app.view.style.height,
		});
        
        
		// The game layer will contain all of our platforms, the player,
		// and anything else relevant to the main gameplay.
		// Here, we delegate the real work to a separate function for clarity:
		this.gameLayer = this.parallaxView.addLayer({
			distance: 7,
			populate: function (layer, x) {
				return this.populateGameLayer(layer, x);
			}.bind(this)
		});
	};

	/**
	 * scaleRootView
	 * ~ normalizes the game's root view to fit any device screen
	 */
	this.scaleRootView = function(horz) {
		var ds = device.screen;
		var vs = app.view.style;
		vs.width = horz ? ds.width * (BG_HEIGHT / ds.height) : BG_WIDTH;
		vs.height = horz ? BG_HEIGHT : ds.height * (BG_WIDTH / ds.width);
		vs.scale = horz ? ds.height / BG_HEIGHT : ds.width / BG_WIDTH;
	}

	// this.createBackground = function(opts){
	// 	this.backgroundCreated = true;
	// };


	// From this line is that the original game works
	this.run = function() {
		// After preloding certain assets...
        ingameImages.push("resources/audio/effects");
		loader.preload(ingameImages, function () {

			// Initialize everything.
			this.resetState();
			this.setupParallaxView();
			this.setupInput();			
			this.setupUILayer();
			this.loadSound();
            this.setupPlayer();
			this.startGame();
			
			Physics.start();

			// this flag allows the tick function below to begin stepping.
			this.loaded = true;
		
		}.bind(this));
	};

	// Initialize the ParallaxView, which will serve as a container
	// for most of the layers in our game:
	this.setupParallaxView = function() {
		
		// add a view for the sky
		if (this.backgroundCreated) {
			this.parallaxView.addBackgroundView(new ui.ImageScaleView(merge({
				scaleMethod: 'cover'
			}, config.background)));
		}
	
		// add some brush, far away
		if (this.farBrushCreated) {
			this.parallaxView.addLayer({
				distance: 20,
				populate: function (layer, x) {
					var v = layer.obtainView(ui.ImageView, merge({
						superview: layer,
						x: x,
						y: layer.style.height - 250,
						opacity: 0.5,
						width: 1024,
						height: 212
					}, config.fargroundBrush));
					return v.style.width;
				}
			});
		}
		
		// add some brush closer to the screen
		if (this.midBrushCreated) {
			this.parallaxView.addLayer({
				distance: 10,
				populate: function (layer, x) {
					var v = layer.obtainView(ui.ImageView, merge({
						superview: layer,
						x: x,
						y: layer.style.height - 200,
						width: 1024,
						height: 212
					}, config.midgroundBrush));
					return v.style.width;
				}
			});		
		}
		
		// Add some low-level fog in front of the platforms:
		if (this.cloudCreated) {
			this.parallaxView.addLayer({
				distance: 5,
				populate: function (layer, x) {
					var size = util.choice(config.cloud.candidates);
					var v = layer.obtainView(ui.ImageView, {
						superview: layer,
						image: config.cloud.image + size + ".png",
						x: x,
						y: layer.style.height - util.randInt(100, 300),
						opacity: Math.random(),
						autoSize: true
					});
					return util.randInt(200, 500);
				}
			});
		}

		// Add water at the very bottom of the screen, in front:
		if (this.waterCreated) {
			this.parallaxView.addLayer({
				distance: 4,
				populate: function (layer, x) {
					var v = layer.obtainView(ui.ImageView, {
						superview: layer,
						image: config.water.image,
						x: x,
						y: layer.style.height - 50,
						width: 1024,
						height: 111
					});
					return v.style.width;
				}
			});
		}
	}
	
	this.onJump = function() {
		if (!this.player)
			return;
		if (!this.isFinished) {
			if ((this.player.jumpingLevel == 0 && this.player.velocity.y < 150)
					|| this.player.jumpingLevel == 1) {
						this.player.jumpingLevel++;
						this.player.velocity.y = -1 * config.character.jump_velocity;
						//this.player.startAnimation(this.player.jumpingLevel == 1 ? "jump" : "float", {
							//loop: this.player.jumpingLevel == 2,
							//callback: function () {
								//this.player.startAnimation("glider", {loop: true});
							//}.bind(this)
						//});
					}
		} else {
			this._touchedWhenFinished = true;
		}
	}

	this.onJumpDone = function () {
		if (!this.player)
			return;

		if (this._touchedWhenFinished && this.isFinished) {
			this._touchedWhenFinished = false;
			// If the game was over, start a new game
			this.startGame();
		} else {
			// When the player lifts their finger
			// swap out the animation to show that they're
			// falling faster now
			if (this.player.jumpingLevel > 0) {
				//this.player.startAnimation("land", {
				//	loop: true
				//});
			}
		}
	}

	// We'll handle a couple gestures: swipe down, and tap-and-hold,
	// using a GestureView.
	this.setupInput = function () {
		this.gestureView = new GestureView({
			superview: app.view,
			width: app.view.style.width,
			height: app.view.style.height,
			zIndex: 10000
		});
		
		this._touchedWhenFinished = false;

		// When the player taps, try to jump
		this.gestureView.on("InputStart", this.onJump.bind(this));

		this.gestureView.on("InputSelect", this.onJumpDone.bind(this));
		
		// When their finger is moving around on the screen, see if it
		// has moved down far and fast enough to be a swipe. If so, make
		// the player fall quickly by rolling.
		this.gestureView.on("Drag", function (e) {
			if (Math.abs(e.dx) > 100) {
				return;
			}
			if (e.dy > 100 && e.duration < 500) {
				// swipe down
				if (!this.player.rolling) {
					this.player.rolling = true;
					this.player.velocity.y = config.character.roll_velocity;
				}
				//this.player.startAnimation("roll", {
				//	loop: true
				//});
				animate(this.player).now({r: Math.PI * 2}, 500, animate.linear);
				
				e.cancel(); // stop sending drag events.
			}

		}.bind(this));

	}

	// The UI for this game is pretty simple: just a score view.
	this.setupUILayer = function () {
		if (this.scoreCreated) {
			this.scoreView = new ScoreView({
				superview: app.view,
				zIndex: 10000,
				x: 0,
				y: 10,
				width: app.view.style.width,
				height: 70,
				anchorX: app.view.style.width / 2,
				anchorY: 35,
				charWidth: 50,
				charHeight: 70,
				text: "0",
				url: 'resources/images/numbers/char-{}.png',
			});
		}
	}	

	// Sound effects are straightforward:
	this.loadSound = function () {
		if (this.soundCreated) {
			this.sound = new AudioManager({
				path: "resources/audio/",
				files: {
					background: { volume: 1, background: true },
					win: { volume: 1, background: true  },
					lose: { volume: 1, path: 'effects' },
					star1: { volume: 0.5, path: 'effects' },
					star2: { volume: 0.5, path: 'effects' },
					star3: { volume: 0.5, path: 'effects' },
					star4: { volume: 0.5, path: 'effects' },
					star5: { volume: 0.5, path: 'effects' },
					star6: { volume: 0.5, path: 'effects' },
					star7: { volume: 0.5, path: 'effects' },
					star8: { volume: 0.5, path: 'effects' },
				}
			});
		}
	}

	// Clear out a few variables before we start any game:
	this.resetState = function () {
		if (this.isFinished) {
			if (this.scoreView) animate(this.scoreView).commit();
			animate(this.parallaxView).commit();
		}
		this.t = 0;
		this.isFinished = false;
		this.score = 0;
	}
	
	// This code actually starts the game.
	this.startGame = function() {
		setTimeout(function () {
			// This is in a setTimeout because some desktop browsers need
			// a moment to prepare the sound (this is probably a bug in DevKit)
			this.sound && this.sound.play("background");
		}.bind(this), 10);
		
		this.resetState();
		this.parallaxView.scrollTo(0, 0);
		this.parallaxView.clear();
		if (this.player){
			this.gameLayer.addSubview(this.player);
			this.player.jumpingLevel = 1; // they start in the air
			this.player.setCollisionEnabled(true);
			this.player.style.r = 0; // he rotates when he dies
			//this.player.startAnimation("land", {
			//	loop: true
			//});
			this.player
				.setPosition(50, 0)
				.setVelocity(config.character.initial_speed, 0)
				.setAcceleration(config.character.world_acceleration, config.character.gravity);
		}
	};	

	// Load the player's sprite. Take a look at the resources directory
	// to see what these images look like and how they fit together to
	// form a SpriteView.
	this.setupPlayer = function () {
		if (this.playerCreated) {
			this.player = new ui.SpriteView({
				zIndex: 1,
				x: 0,
				y: 0,
				anchorX: 50,
				anchorY: 50,
				autoSize: true,
				url: config.character.url,
				defaultAnimation: 'run',
				autoStart: true,
			});
			
			// The player can double-jump, so the first jump == 1, second jump == 2
			this.player.jumpingLevel = 1;
			
			// This player needs to be able to move with physics.
			// This function will give the player a bunch of new
			// functionality like velocity, acceleration, and
			// a bunch of positioning helper functions.
			// See the Physics class documentation!
			Physics.addToView(this.player, {
				hitbox: {
					x: 0,
					y: 20,
					width: 80,
					height: 80,
				}
			});
		}
	}

	// Here's where the real work for the game layer takes place. You
	// should read through the documentation for ParallaxView to fully
	// understand this function. In short, this function gets called
	// with an `x` coordinate for the position where we should start
	// adding views to the game layer. As the player scrolls further
	// right in the game, this function will get called to add more
	// platforms and items.
	this.populateGameLayer = function (layer, x) {
		var halfh = layer.style.height / 2;

		if (this.lastPlatformHeight == null) {
			this.lastPlatformHeight = 100;
		}

        var platformCfg = gameObjects["platformIslands"];
        
		// First, select a height for the next platform that's
		// somewhat close to the previous platform
		if (platformCfg) {
			var platformHeight = Math.min(halfh, Math.max(0, 
														  util.randInt(this.lastPlatformHeight - halfh / 2, 
																	   this.lastPlatformHeight + halfh / 2)));
			this.lastPlatformHeight = platformHeight;
			
			// Get a new platform of a random size. (This view comes from
			// a ViewPool automatically, which improves performance.)
			var size = Math.random() * platformCfg.urls.length | 0;
			var platform = layer.obtainView(ui.ImageView, {
				superview: layer,
				image: platformCfg.urls[size],
				x: x,
				y: layer.style.height - 100 - platformHeight,
				autoSize: true
			});

			// To detect collisions between the player and any platform,
			// we add Physics to this view with a group of "ground".
			Physics.addToView(platform, {group: config.platform.collision});
		}

		// In our game, we predefined grid arrangements of stars to display in
		// starGrids.js. Here, we'll pull out that information and add some views
		// for those stars for the player to collect:
		if (this.starCreated) {
            
            var n = Math.random() * config.platform.object.images.length | 0;
            var starImage = config.platform.object.images[n];
            
            var spr = this.spriteSheet[starImage];                 
			var starHeight = util.randInt(50, 200);
			var starSize = spr[0].w;
			var numStars = size / starSize - 2;
			var maxPerRow = platform.style.width / starSize | 0;
			var grid = util.choice(starGrids); // choose a random arrangement of stars
			var initX = util.randInt(0, Math.max(0, maxPerRow - grid[0].length)) * starSize;
			
			for (var gridY = 0; gridY < grid.length; gridY++) {
				var row = grid[gridY];
				var rowCount = Math.min(row.length, maxPerRow);
				for (var gridX = 0; gridX < rowCount; gridX++) {
					if (grid[gridY][gridX] == 0) {
						continue;
					}
					var star = layer.obtainView(ui.ImageView, {
						superview: layer,
						image: starImage,
						x: x + initX + gridX * starSize,
						y: platform.style.y - starHeight - starSize * gridY,
						anchorX: starSize/2,
						anchorY: starSize/2,
						width: starSize,
						height: starSize,
						scale: 1
					}, {poolSize: 40, group: "star"}); // note the large pool size, for performance.

					// Again, we group these in a "star" group for easy collision detection processing.
					Physics.addToView(star, {group: config.platform.object.collision});
				}
			}
		}
		// We want to create spaces where the player could fall in between,
		// and those spaces should get bigger the longer the player has been running:
		var spaceBetweenPlatforms = 0;
		
		// if they're more than a few seconds in, start spacing out the platforms
		if (platformCfg && this.t > 5) {
			spaceBetweenPlatforms = (1 + Math.random() * this.t * 0.2) * platformCfg.gap;
		}
		
		// Should we add an enemy?
		if (this.enemyCreated) {
			if (Math.random() < config.platform.enemy.rate && this.t >= config.platform.enemy.startTime && platform.style.width >= 512) {
				var enemyBee = layer.obtainView(EnemyBeeView, {
					superview: layer,
					x: x + util.randInt(0, platform.style.width - 50),
					y: platform.style.y - util.choice([100, 300]),
					width: 50,
					height: 100,
				}, {poolSize: 5, group: config.platform.enemy.collision});
			}
		}
		
		
		// Because we populated the view as far as the platform, plus the extra space,
		// we return the amount of space populated. Then, the ParallaxView knows to only populate
		// the view starting from the last unpopulated x coordinate. In this case, it'll 
		// call this function again to populate once we reach the place where we want to 
		// place the next platform.
		return platform && (platform.style.width + spaceBetweenPlatforms) || 0;

	}

	// When the player dies...
	this.finishGame = function() {
		if (!this.isFinished) {
			this.isFinished = true;
			this.sound && this.sound.play("lose");
			if (this.player) this.player.acceleration.x = -200; // slow them down until they stop
			// Fade out the parallax layer
			animate(this.parallaxView)
				.now({opacity: 0.2}, 1000)
				.wait(10000000)
				.then({opacity: 1});
			// animate the scoreView to the middle of the screen
			if (this.scoreView) {
				var origY = this.scoreView.style.y;
				animate(this.scoreView)
					.now({
						dy: (app.view.style.height - this.scoreView.style.height) / 2
					}, 1000, animate.easeIn)
					.then({scale: 2}, 400, animate.easeIn)
					.then({scale: 1.5}, 400, animate.easeOut)
					.wait(10000000)
					.then({y: origY, scale: 1}, 400, animate.easeOut);
			}
			
			// Note that we instruct these animations to wait for a long time.
			// When we call resetState() again, it calls .commit() on these views'
			// animations, which will cause them to move to their final state, which
			// in this case is the position from which they began.
		}
	}

	this.tick = function(dtMS) {
		if (!this.loaded) {
			return;
		}
		// I prefer to handle the tick in seconds. Also, here we limit the DT to
		// prevent large drops, which could cause the player to teleport through platforms:
		var dt = Math.min(dtMS / 1000, 1/30);
		this.t += dt;
		
		if (this.isFinished) {
			// When the player finishes slowing down at the end of a game, play the "win" music.
			if (this.player && this.player.velocity.x < 0) {
				this.player.stopAllMovement();
				this.sound && this.sound.play("win");
			}
		} else {
			// During the game, give the player acceleration depending on whether or not they're
			// dragging on the screen:
			if (this.gestureView.isPressed() && this.player) {
				this.player.acceleration.y = config.character.hold_gravity;
			} else {
				if (this.player) this.player.acceleration.y = config.character.gravity;
			}
			// give them some points for surviving based on time
			this.score += SCORE_TIME_VALUE;
		}
		
		// update the score UI
		if (this.scoreView) this.scoreView.setText(this.score | 0);
		
		// Scroll the ParallaxView (relative to the frame of reference of the gameLayer)
		// to always place the player at the left of the screen, with a bit of variance in
		// the ParallaxView's `y` coordinate to raise the gameplay area when the player jumps higher.
		if (this.player) {
			this.gameLayer.scrollTo(this.player.getLeft() - 50, 
									Math.min(0, this.player.getTop() - this.gameLayer.style.height / 4));

		
			// Check for collisions with the ground:
			var hits = this.player.getCollisions("ground");
			for (var i = 0; i < hits.length; i++) {
				var hit = hits[i];
				// If the player is close to the top of a platform, and they're falling (not jumping up),
				// we must make them hit the platform.
				if (this.player.getPrevBottom() <= hit.view.getTop() + 10 && this.player.velocity.y >= 0) {
					if (this.player.jumpingLevel > 0 || this.player.rolling) {
						this.player.jumpingLevel = 0;
						this.player.rolling = false;
						animate(this.player).clear();
						this.player.setRotation(0);
						this.player.resetAnimation();
					}
					// They're currently _colliding_ with the platform; move them up higher so that they
					// only touch the top of the platform instead
					this.player.position.y -= hit.intersection.height;
					this.player.velocity.y = 0;
				}
			}

			// See if they've collided with any stars
			var hits = this.player.getCollisions("star");
			for (var i = 0; i < hits.length; i++) {
				var hit = hits[i];
				// If they've hit a star, give them extra points
				var star = hit.view;
				this.score += SCORE_STAR_VALUE;
				// remove the star from the physics simulation so that we don't
				// collide with it any more
				star.setCollisionEnabled(false);
				// now animate it away.
				animate(star).now({
					scale: 0,
					dx: util.randInt(-100, 100),
					dy: util.randInt(-100, 100),
				}, 200).then(function () {star.removeFromSuperview()});
				// Note that the star view will get recycled in the view pool automatically,
				// because ParallaxView's obtainView function adds a listener to the view's
				// "ViewRemoved" event which handles releasing it back to the pool.
				// 
				// Also note that if a star falls off the front of the screen because the
				// player missed it, the star will still be removed (and added back to the pool)
				// because ParallaxView removes views that have scrolled off the screen to the left.
			}
			
			// If they've collided with any stars, play a collision sound
			if (hits.length) {
				this.sound && this.sound.play("star" + util.randInt(1,9));
			}

			// If they hit an ememy bee, they die.
			var hits = this.player.getCollisions("bee");
			for (var i = 0; i < hits.length; i++) {
				var hit = hits[i];
				var bee = hit.view;
				bee.setCollisionEnabled(false);
				bee.stopAllMovement();
				bee.velocity.x = this.player.velocity.x;
				bee.acceleration.y = config.character.gravity;
				bee.die();
				this.player.setCollisionEnabled(false); // let him fall through the platforms
				animate(this.player).now({
					dr: Math.PI * -2
				}, 2000);
				this.finishGame();
			}

			// If the player fell off the bottom of the screen, game over!
			if (this.player.getY() >= this.gameLayer.style.height) {
				this.finishGame();
			}	
		}	
	}
});

var EnemyBeeView = new Class([ui.View, Physics], function (supr) {
	this.init = function(opts) {
        var n = Math.random() * config.platform.enemy.images.length | 0;
        var enemyImage = config.platform.enemy.images[n];
        
        var spr = game.spriteSheet[enemyImage + "_flying_0001.png"];
        var sprSize = spr[0].w;
        
		opts.group = "bee";
		opts.hitbox = {
			x: 10,
			y: 10,
			width: sprSize - 20,
			height: sprSize - 20,
		};
		supr(this, 'init', arguments);
		Physics.prototype.init.apply(this, arguments);
		var sprite = this.sprite = new ui.SpriteView({
			superview: this,
            zIndex: 100,
			x: 0,
			y: 0,
            autoSize: true,
			url: enemyImage,
			defaultAnimation: "flying",
			autoStart: true,
		});
		function animateBee() {
			animate(sprite)
				.clear()
				.now({dy: 50}, 400)
				.then({dy: -50}, 400)
				.then(animateBee);
		}
		animateBee();
	}
	
	this.tick = function () {
		this.hitbox.y = this.sprite.style.y + 10;
	}
	
	this.die = function() {
		animate(this.sprite, "rotation").now({r: Math.PI * 1.5}, 1000);
	}
});

var gameObjects = {};

GLOBAL.themHinhNen = function(url) {  
    url = 'resources/images/' + url;
    var bkg = game.parallaxView.addBackgroundView(new ui.ImageScaleView({
				scaleMethod: 'cover',
                image: url
			}));
    ingameImages.push(url);
};

GLOBAL.themDayHinh = function (name) {
    var urls = [];
    for (var i = 1; i < arguments.length; ++i) {
        var img = 'resources/images/' + arguments[i];
        urls.push(img);
        ingameImages.push(img);
    }    
    
    var cfg = {
        urls: urls,
        lowerY: 0,
        higherY: 0,
        gap: 0
    };
    var layer = game.parallaxView.addLayer({
        distance: 20,
        populate: function (layer, x) {
            var size = Math.random() * cfg.urls.length | 0;
            var v = layer.obtainView(ui.ImageView, merge({
                superview: layer,
                image: urls[size],
                x: x,
                y: layer.style.height - util.randInt(cfg.lowerY, cfg.higherY),            
                autoSize: true,
            }, cfg));
            
            v.style.y -= v.style.height;            
            return v.style.width + (Math.random() * 3 + 2) * cfg.gap;;
        }
    });
    cfg.obj = layer;
    gameObjects[name] = cfg;
};

GLOBAL.datViTri = function (name, y) {    
    gameObjects[name].lowerY = y;  
    gameObjects[name].higherY = y;  
};

GLOBAL.datDoXa = function (name, distance) {
    gameObjects[name].obj.setDistance(distance);
}

GLOBAL.doiDoTrongSuot = function (name, opacity) {
    gameObjects[name].opacity = opacity;
};

GLOBAL.themDamMay = function (name) {
    
    var urls = [];
    for (var i = 1; i < arguments.length; ++i) {
        var img = 'resources/images/' + arguments[i];
        urls.push(img);
        ingameImages.push(img);
    }    
    
    var cfg = {
        urls: urls,
        gap: 100,
        startingX: 0,
        lowerY: 0,
        higherY: 0
    };
    
    var layer = game.parallaxView.addLayer({
        distance: 5,
        populate: function (layer, x) {
            var size = Math.random() * cfg.urls.length | 0;
            var v = layer.obtainView(ui.ImageView, {
                superview: layer,
                image: cfg.urls[size],
                x: x + cfg.startingX,
                y: layer.style.height - util.randInt(cfg.lowerY, cfg.higherY),
                opacity: Math.random(),
                autoSize: true
            });
            
            v.style.y -= v.style.height;
            return (Math.random() * 3 + 2) * cfg.gap;
        }
    });
    
    cfg.obj = layer;
    gameObjects[name] = cfg;
};

GLOBAL.doiKhoangCach = function (name, gap) {
    gameObjects[name].gap = gap;  
};

GLOBAL.datViTriTrongKhoang = function (name, lowerY, higherY) {
    gameObjects[name].lowerY = lowerY;
    gameObjects[name].higherY = higherY;
};

GLOBAL.themDao = function () {
    var urls = [];
    for (var i = 0; i < arguments.length; ++i) {
        var img = 'resources/images/' + arguments[i];
        urls.push(img);
        ingameImages.push(img);
    }
    
    var cfg = {
        urls: urls,
        gap: 100
    };
    gameObjects["platformIslands"] = cfg;
};

GLOBAL.datDoXaCuaDao = function (distance) {
    game.gameLayer.setDistance(distance);    
}

GLOBAL.datKhoangCachDao = function (gap) {
    if (gameObjects["platformIslands"]) {
        gameObjects["platformIslands"].gap = gap;
    }
}

GLOBAL.themNhanVat = function (url) {
    game.playerCreated = true;
    config.character.url = 'resources/images/' + url;
    config.character.gravity = 1400;
	config.character.hold_gravity = config.character.gravity / 3;
	config.character.jump_velocity = 500;
	config.character.roll_velocity = 700;
	config.character.initial_speed = 400;
	config.character.world_acceleration = 15;
}

GLOBAL.datTrongLucNhanVat = function (gravity) {
    config.character.gravity = gravity;
    config.character.hold_gravity = config.character.gravity / 3;
}

GLOBAL.datLucNhayNhanVat = function (velocity) {
    config.character.jump_velocity = velocity;
}

GLOBAL.themDoAn = function() {
    var urls = [];
    for (var i = 0; i < arguments.length; ++i) {
        var img = 'resources/images/' + arguments[i];
        urls.push(img);
        ingameImages.push(img);
    }
    
    config.platform.object.images = urls;
    config.platform.object.collision = "star";
    game.starCreated = true;
};

GLOBAL.themKeThu = function () {
    var urls = [];
    for (var i = 0; i < arguments.length; ++i) {
        urls.push('resources/images/' + arguments[i]);
    }
    
    config.platform.enemy.images = urls;
    config.platform.enemy.startTime = 5;
    config.platform.enemy.rate = 0.5;
    config.platform.enemy.collision = "bee";
    config.platform.enemy.defaultAnimation = "flying";
    game.enemyCreated = true;
}

GLOBAL.datXacSuatHienKeThu = function (rate) {
    config.platform.enemy.rate = rate * 0.01;
}

GLOBAL.batNhac = function () {
	game.soundCreated = true;
}

GLOBAL.batBangDiem = function(opts) {
	game.scoreCreated = true;
}
