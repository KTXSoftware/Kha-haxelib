package kha.graphics2;

import haxe.io.Bytes;
import kha.Canvas;
import kha.Color;
import kha.Image;

class Graphics1 implements kha.graphics1.Graphics {
	private var canvas: Canvas;
	private var texture: Image;
	private var pixels: Bytes;
	
	public function new(canvas: Canvas) {
		this.canvas = canvas;
	}
	
	public function begin(): Void {
		if (texture == null) {
			texture = Image.createRenderTarget(canvas.width, canvas.height);
		}
		pixels = texture.lock();
	}
	
	public function end(): Void {
		texture.unlock();
		canvas.g2.begin();
		canvas.g2.drawImage(texture, 0, 0);
		canvas.g2.end();
	}
	
	public function setPixel(x: Int, y: Int, color: Color): Void {
		pixels.set(y * texture.realWidth * 4 + x * 4, color.value);
	}
}
