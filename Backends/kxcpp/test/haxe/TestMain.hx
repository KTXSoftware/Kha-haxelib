package;
import gc.TestGC;

class TestMain {

	static function main(){
		var r = new haxe.unit.TestRunner();
		r.add(new TestGC());
		r.add(new TestIntHash());
		r.add(new TestStringHash());
		r.add(new TestObjectHash());
		r.add(new TestWeakHash());
		var success = r.run();
		Sys.exit(success ? 0 : 1);
	}
}
