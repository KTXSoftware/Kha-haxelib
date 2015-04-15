package kha;

import haxe.io.Bytes;
import js.html.ImageElement;
import kha.graphics4.TextureFormat;
import kha.graphics4.Usage;

class Image implements Canvas implements Resource {
	public static function create(width: Int, height: Int, format: TextureFormat = null, usage: Usage = null, levels: Int = 1): Image {
		if (format == null) format = TextureFormat.RGBA32;
		if (usage == null) usage = Usage.StaticUsage;
		if (Sys.gl == null) return new CanvasImage(width, height, format, false);
		else return new WebGLImage(width, height, format, false);
	}
	
	public static function createRenderTarget(width: Int, height: Int, format: TextureFormat = null, depthStencil: Bool = false, antiAliasingSamples: Int = 1): Image {
		if (format == null) format = TextureFormat.RGBA32;
		if (Sys.gl == null) return new CanvasImage(width, height, format, true);
		else return new WebGLImage(width, height, format, true);
	}
	
	public static function fromImage(image: ImageElement, readable: Bool): Image {
		if (Sys.gl == null) {
			var img = new CanvasImage(image.width, image.height, TextureFormat.RGBA32, false);
			img.image = image;
			img.createTexture();
			return img;
		}
		else {
			var img = new WebGLImage(image.width, image.height, TextureFormat.RGBA32, false);
			img.image = image;
			img.createTexture();
			return img;
		}
	}
	
	public static function fromVideo(video: kha.js.Video): Image {
		if (Sys.gl == null) {
			var img = new CanvasImage(video.element.videoWidth, video.element.videoHeight, TextureFormat.RGBA32, false);
			img.video = video.element;
			img.createTexture();
			return img;
		}
		else {
			var img = new WebGLImage(video.element.videoWidth, video.element.videoHeight, TextureFormat.RGBA32, false);
			img.video = video.element;
			img.createTexture();
			return img;
		}
	}
	
	public static var maxSize(get, null): Int;
	
	public static function get_maxSize(): Int {
		return Sys.gl == null ? 1024 * 8 : Sys.gl.getParameter(Sys.gl.MAX_TEXTURE_SIZE);
	}
	
	public static var nonPow2Supported(get, null): Bool;
	
	public static function get_nonPow2Supported(): Bool {
		return Sys.gl != null;
	}
	
	public function isOpaque(x: Int, y: Int): Bool { return false; }
	public function unload(): Void { }
	public function lock(level: Int = 0): Bytes { return null; }
	public function unlock(): Void { }
	public var width(get, null): Int;
	private function get_width(): Int { return 0; }
	public var height(get, null): Int;
	private function get_height(): Int { return 0; }
	public var realWidth(get, null): Int;
	private function get_realWidth(): Int { return 0; }
	public var realHeight(get, null): Int;
	private function get_realHeight(): Int { return 0; }
	public var g2(get, null): kha.graphics2.Graphics;
	private function get_g2(): kha.graphics2.Graphics { return null; }
	public var g4(get, null): kha.graphics4.Graphics;
	private function get_g4(): kha.graphics4.Graphics { return null; }
}
