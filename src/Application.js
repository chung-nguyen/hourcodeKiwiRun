import src.template.Game as Game;
import src.TroChoi as TroChoi;

exports = Class(GC.Application, function () {

	this.initUI = function () {
		game = new Game(this);

		TroChoi();

		// Chạy trò chơi
		game.run();
	}

	this.tick = function (dtMS) {
		game.tick(dtMS);
	}
});