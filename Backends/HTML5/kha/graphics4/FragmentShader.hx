package kha.graphics4;

class FragmentShader {
	public var source: String;
	public var type: Dynamic;
	public var shader: Dynamic;
	
	public function new(source: Blob) {
		this.source = source.toString();
		this.type = SystemImpl.gl.FRAGMENT_SHADER;
		this.shader = null;
	}
}
