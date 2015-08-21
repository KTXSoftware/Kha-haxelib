package kha.wpf;

import haxe.CallStack;
import haxe.io.Bytes;
import haxe.io.BytesData;
import haxe.Json;
import kha.Blob;
import kha.FontStyle;
import kha.Kravur;
import kha.Starter;
import system.io.File;
import system.windows.FrameworkElement;
import system.windows.input.Cursor;
import system.windows.input.Cursors;
import system.windows.input.Mouse;

class Loader extends kha.Loader {
	public static var path: String = "";
	public static var forceBusyCursor: Bool = false;
	var savedCursor: Cursor;
	var busyCursor: Bool = false;
	
	public function new() {
		super();
		isQuitable = true;
	}
	
	public override function loadProject(call: Void -> Void) {
		enqueue({files: ["project.kha"], name: "project.kha", type: "blob"});
		loadFiles(call, false);
	}
	
	private override function parseProject(): Dynamic {
		return Json.parse(getBlob("project.kha").toString());
	}
	
	override public function loadMusic(desc: Dynamic, done: kha.Music -> Void): Void {
		done(new Music(path + desc.files[0]));
	}

	override public function loadSound(desc: Dynamic, done: kha.Sound -> Void): Void {
		done(new Sound(path + desc.files[0]));
	}

	override public function loadImage(desc: Dynamic, done: kha.Image -> Void): Void {
		done(Image.fromFilename(path + desc.files[0]));
	}

	override public function loadBlob(desc: Dynamic, done: kha.Blob -> Void): Void {
		done(new Blob(Bytes.ofData(File.ReadAllBytes(path + desc.files[0]))));
	}

	override public function loadVideo(desc: Dynamic, done: kha.Video -> Void): Void {
		done(new Video(path + desc.files[0]));
	}
	
	override public function loadFont(name: String, style: FontStyle, size: Float): kha.Font {
		return Kravur.get(name, style, size);
	}

	@:functionCode('
		System.Diagnostics.Process.Start(new System.Uri(url).AbsoluteUri);
	')
	override public function loadURL(url : String) : Void {
		
	}

	override function checkComplete(): Void {
		if (numberOfFiles <= 0) {
			if (forceBusyCursor)
				Starter.frameworkElement.Cursor = Cursors.Wait;
		}
		super.checkComplete();
	}
	
	override function setNormalCursor() {
		savedCursor = Cursors.Arrow;
		if (!busyCursor && !forceBusyCursor) Starter.frameworkElement.Cursor = Cursors.Arrow;
	}
	
	override function setHandCursor() {
		savedCursor = Cursors.Hand;
		if (!busyCursor && !forceBusyCursor) Starter.frameworkElement.Cursor = Cursors.Hand;
	}
	
	override function setCursorBusy(busy : Bool) {
		busyCursor = busy;
		if (busy || forceBusyCursor)
			Starter.frameworkElement.Cursor = Cursors.Wait;
		else
			Starter.frameworkElement.Cursor = savedCursor;
	}
	
	@:functionCode('
		System.Windows.Application.Current.Shutdown();
	')
	override function quit() : Void { }
}
