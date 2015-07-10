package kha.audio2;

import js.Browser;
import js.html.audio.AudioContext;
import js.html.audio.AudioProcessingEvent;
import js.html.audio.ScriptProcessorNode;

class Audio {
	private static var buffer: Buffer;
	@:noCompletion public static var _context: AudioContext;
	private static var processingNode: ScriptProcessorNode;
	
	private static function initContext(): Void {
		try {
			_context = new AudioContext();
			return;
		}
		catch (e: Dynamic) {
			
		}
		try {
			untyped __js__('this._context = new webkitAudioContext();');
			return;
		}
		catch (e: Dynamic) {
			
		}
	}
	
	@:noCompletion
	public static function _init(): Bool {
		var bufferSize = 1024 * 2;
		
		buffer = new Buffer(bufferSize * 4, 2, 44100);
		
		initContext();
		if (_context == null) return false;
		
		processingNode = _context.createScriptProcessor(bufferSize, 0, 2);
		processingNode.onaudioprocess = function (e: AudioProcessingEvent) {
			var output1 = e.outputBuffer.getChannelData(0);
			var output2 = e.outputBuffer.getChannelData(1);
			if (audioCallback != null) {
				audioCallback(e.outputBuffer.length * 2, buffer);
				for (i in 0...e.outputBuffer.length) {
					output1[i] = buffer.data.get(buffer.readLocation);
					buffer.readLocation += 1;
					output2[i] = buffer.data.get(buffer.readLocation);
					buffer.readLocation += 1;
					if (buffer.readLocation >= buffer.size) {
						buffer.readLocation = 0;
					}
				}
			}
			else {
				for (i in 0...e.outputBuffer.length) {
					output1[i] = 0;
					output2[i] = 0;
				}
			}
		}
		processingNode.connect(_context.destination);
		return true;
	}

	public static var audioCallback: Int->Buffer->Void;
}
