package kha.js;

import js.Browser;
import js.html.ErrorEvent;
import js.html.Event;
import js.html.MediaError;
import js.html.VideoElement;

using StringTools;

class Video extends kha.Video {
	static var extensions : Array<String> = null;
	static var loading : List<Video> = new List(); 
	public var element : VideoElement;
	private var done: kha.Video -> Void;
	public var texture: Image;
	
	public function new(filename : String, done: kha.Video -> Void) {
		super();
		
		this.done = done;
		loading.add(this); // prevent gc from removing this
		
		element = cast Browser.document.createElement("video");
		
		if (extensions == null) {
			extensions = new Array();
			if ( element.canPlayType("video/webm") != "" ) {
				extensions.push(".webm");
			}
			if ( element.canPlayType("video/mp4") != "" ) {
				extensions.push(".mp4");
			}
		}
		
		element.addEventListener("error", errorListener, false);
		element.addEventListener("canplaythrough", canPlayThroughListener, false);
		
		element.preload = "auto";
		element.src = filename + extensions[0];
	}
	
	override public function play(loop: Bool = false) : Void {
		try {
			element.loop = loop;
			element.play();
		} catch ( e : Dynamic ) {
			trace ( e );
		}
	}
	
	override public function pause() : Void {
		try {
			element.pause();
		} catch ( e : Dynamic ) {
			trace ( e );
		}
	}
	
	override public function stop() : Void {
		try {
			element.pause();
			element.currentTime = 0;
		} catch ( e : Dynamic ) {
			trace ( e );
		}
	}
	
	override public function getCurrentPos() : Int {
		return Math.ceil(element.currentTime * 1000);  // Miliseconds
	}
	
	override public function getLength() : Int {
		if ( Math.isFinite(element.duration) ) {
			return Math.floor(element.duration * 1000); // Miliseconds
		} else {
			return -1;
		}
	}
	
	function errorListener(eventInfo : ErrorEvent) : Void {
		if (element.error.code == MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
			for ( i in 0 ... extensions.length - 1 ) {
				var ext = extensions[i];
				if ( element.src.endsWith(extensions[i]) ) {
					// try loading with next extension:
					element.src = element.src.substr(0, element.src.length - extensions[i].length) + extensions[i + 1];
					return;
				}
			}
		}
		
		{
			var str = "";
			var i = extensions.length - 2;
			while ( i >= 0 ) {
				str = "|" + extensions[i];
			}
			
			trace("Error loading " + element.src + str);
		}
		
		finishAsset();
	}
	
	function canPlayThroughListener(eventInfo: Event): Void {
		finishAsset();
	}
	
	function finishAsset() {
		element.removeEventListener("error", errorListener, false);
		element.removeEventListener("canplaythrough", canPlayThroughListener, false);
		if (Sys.gl != null) texture = Image.fromVideo(this);
		done(this);
		loading.remove(this);
	}
}
