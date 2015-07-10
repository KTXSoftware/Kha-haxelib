package kha.js;

import haxe.io.Bytes;
import js.Browser;
import js.html.XMLHttpRequest;

class WebAudioMusic extends kha.Music {
	public function new(filename: String, done: kha.Music -> Void) {
		super();
		
		var request = untyped new XMLHttpRequest();
		request.open("GET", filename + ".ogg", true);
		request.responseType = "arraybuffer";
		
		request.onerror = function() {
			Browser.alert("loadMusic failed");
		};
		request.onload = function() {
			var arrayBuffer = request.response;
			data = Bytes.ofData(arrayBuffer);
			done(this);
		};
		request.send(null);
	}
}
