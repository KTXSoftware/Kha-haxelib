package kha;

import js.Boot;
import js.Browser;
import js.html.audio.DynamicsCompressorNode;
import js.html.ImageElement;
import kha.FontStyle;
import kha.Blob;
import kha.js.WebAudioSound;
import kha.Kravur;
import haxe.io.Bytes;
import haxe.io.BytesData;
import js.Lib;
import js.html.XMLHttpRequest;

using StringTools;

class LoaderImpl {
	public static function getImageFormats(): Array<String> {
		return ["png", "jpg"];
	}
	
	public static function loadImageFromDescription(desc: Dynamic, done: kha.Image -> Void) {
		var img: ImageElement = cast Browser.document.createElement("img");
		img.src = desc.files[0];
		var readable = Reflect.hasField(desc, "readable") ? desc.readable : false;
		img.onload = function(event: Dynamic) {
			done(Image.fromImage(img, readable));
		};
	}
	
	public static function getSoundFormats(): Array<String> {
		if (SystemImpl._hasWebAudio) return ["ogg"];
		else return ["mp4", "ogg"];
	}
	
	public static function loadSoundFromDescription(desc: Dynamic, done: kha.Sound -> Void) {
		if (SystemImpl._hasWebAudio) {
			for (i in 0...desc.files.length) {
				var file: String = desc.files[i];
				if (file.endsWith(".ogg")) {
					new WebAudioSound(file, done);
					break;
				}
			}
		}
		else new kha.js.Sound(desc.files, done);
	}
	
	public static function getVideoFormats(): Array<String> {
		return ["mp4", "webm"];
	}

	public static function loadVideoFromDescription(desc: Dynamic, done: kha.Video -> Void): Void {
		var video = new kha.js.Video(desc.files, done);
	}
	
	public static function loadBlobFromDescription(desc: Dynamic, done: Blob -> Void) {
		var request = untyped new XMLHttpRequest();
		request.open("GET", desc.files[0], true);
		request.responseType = "arraybuffer";
		
		request.onreadystatechange = function() {
			if (request.readyState != 4) return;
			if (request.status >= 200 && request.status < 400) {
				var bytes: Bytes = null;
				var arrayBuffer = request.response;
				if (arrayBuffer != null) {
					var byteArray: Dynamic = untyped __js__("new Uint8Array(arrayBuffer)");
					bytes = Bytes.alloc(byteArray.byteLength);
					for (i in 0...byteArray.byteLength) bytes.set(i, byteArray[i]);
				}
				else if (request.responseBody != null) {
					var data: Dynamic = untyped __js__("VBArray(request.responseBody).toArray()");
					bytes = Bytes.alloc(data.length);
					for (i in 0...data.length) bytes.set(i, data[i]);
				}
				else {
					trace("Error loading " + desc.files[0]);
					Browser.console.log("loadBlob failed");
				}
				done(new Blob(bytes));
			}
			else {
				trace("Error loading " + desc.files[0]);
				Browser.console.log("loadBlob failed");
			}
		};
		request.send(null);
	}
	
	public static function loadFontFromDescription(desc: Dynamic, done: Font -> Void): Void {
		loadBlobFromDescription(desc, function (blob: Blob) {
			if (SystemImpl.gl == null) done(new kha.js.Font(new Kravur(blob)));
			else done(new Kravur(blob));
		});
	}
	
	/*override public function loadURL(url: String): Void {
		// inDAgo hack
		if (url.substr(0, 1) == '#')
			Browser.location.hash = url.substr(1, url.length - 1);
		else
			Browser.window.open(url, "Kha");
	}
	
	override public function setNormalCursor() {
		Mouse.SystemCursor = "default";
		Mouse.UpdateSystemCursor();
	}

	override public function setHandCursor() {
		Mouse.SystemCursor = "pointer";
		Mouse.UpdateSystemCursor();
	}*/
}
