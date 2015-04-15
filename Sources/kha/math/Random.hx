package kha.math;

//
// Random number generator
//
// Please use this one instead of the native Haxe one to
// keep consistency between different platforms.
//

// Mersenne twister
class Random {
	public static function init(seed: Int): Void {
		MT = new Array<Int>();
		MT[624 - 1] = 0;
		MT[0] = seed;
		for (i in 1...624) MT[i] = 0x6c078965 * (MT[i - 1] ^ (MT[i - 1] >> 30)) + i;
	}
	
	public static function get(): Int {
		if (index == 0) generateNumbers();

		var y: Int = MT[index];
		y = y ^ (y >> 11);
		y = y ^ ((y << 7) & (0x9d2c5680));
		y = y ^ ((y << 15) & (0xefc60000));
		y = y ^ (y >> 18);

		index = (index + 1) % 624;
		return y;
	}
	
	public static function getUpTo(max: Int): Int {
		return get() % (max + 1);
	}
	
	public static function getIn(min: Int, max: Int): Int {
		return get() % (max + 1 - min) + min;
	}
	
	private static var MT: Array<Int>;
	private static var index: Int = 0;
	
	private static function generateNumbers(): Void {
		for (i in 0...624) {
			var y: Int = (MT[i] & 1) + (MT[(i + 1) % 624]) & 0x7fffffff;
			MT[i] = MT[(i + 397) % 624] ^ (y >> 1);
			if ((y % 2) != 0) MT[i] = MT[i] ^ 0x9908b0df;
		}
	}
}
