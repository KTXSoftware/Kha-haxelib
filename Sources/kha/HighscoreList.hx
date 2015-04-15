package kha;

class HighscoreList {
	var scores: Array<Score>;
	
	public function new() {
		scores = [];
		//updateScores();
	}
	
	/*function updateScores() {
		var request = new Http("http://games.ktxsoftware.com/getscores");
		request.setParameter("game", name);
		request.setParameter("count", "10");
		request.onData = function(data: String) {
			var json = haxe.Json.parse(data);
			var newscores = new Array<Score>();
			for (i in 0...10) {
				newscores.push(new Score(json[i].name, json[i].score));
			}
			scores = newscores;
		};
		request.request(false);
	}*/
	
	public function getScores(): Array<Score> {
		return scores;
	}
	
	public function addScore(name: String, score: Int) {
		scores.push(new Score(name, score));
		scores.sort(function(score1: Score, score2: Score) {
			return score2.getScore() - score1.getScore();
		});
		/*var request = new Http("http://games.ktxsoftware.com/addscore");
		request.setParameter("game", this.name);
		request.setParameter("name", name);
		request.setParameter("score", Std.string(score));
		request.request(false);*/
	}
	
	public function load(file: StorageFile): Void {
		if (file == null) return;
		var loaded: Array<Dynamic> = file.readObject();
		scores = [];
		if (loaded != null) {
			for (i in 0...loaded.length) {
				scores[i] = new Score(loaded[i].name, loaded[i].score);
			}
		}
	}
	
	public function save(file: StorageFile): Void {
		file.writeObject(scores);
	}
}
