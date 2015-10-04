"use strict";

const path = require('path');
const KhaExporter = require('./KhaExporter.js');
const Converter = require('./Converter.js');
const Files = require('./Files.js');
const Haxe = require('./Haxe.js');
const Paths = require('./Paths.js');
const Platform = require('./Platform.js');
const exportImage = require('./ImageTool.js');
const HaxeProject = require('./HaxeProject.js');

class KoreExporter extends KhaExporter {
	constructor(platform, khaDirectory, vr, directory) {
		super(khaDirectory);
		this.platform = platform;
		this.directory = directory;
		this.addSourceDirectory(path.join(khaDirectory.toString(), 'Backends/Kore'));
		this.vr = vr;
	}

	sysdir() {
		return this.platform;
	}

	exportSolution(name, platform, khaDirectory, haxeDirectory, from, callback) {
		let defines = [
			'no-compilation',
			'sys_' + platform,
			'sys_g1', 'sys_g2', 'sys_g3', 'sys_g4',
			'sys_a1', 'sys_a2'
		];
		if (this.vr === 'gearvr') {
			defines.push('vr_gearvr');
		}
		else if (this.vr === 'cardboard') {
			defines.push('vr_cardboard');
		}
		else if (this.vr === 'rift') {
			defines.push('vr_rift');
		}

		const options = {
			from: from.toString(),
			to: path.join(this.sysdir() + '-build', 'Sources'),
			sources: this.sources,
			defines: defines,
			haxeDirectory: haxeDirectory.toString(),
			system: this.sysdir(),
			language: 'cpp',
			width: this.width,
			height: this.height,
			name: name
		};
		HaxeProject(this.directory.toString(), options);

		//Files.removeDirectory(this.directory.resolve(Paths.get(this.sysdir() + "-build", "Sources")));

		Haxe.executeHaxe(this.directory, haxeDirectory, ["project-" + this.sysdir() + ".hxml"], callback);
	}

	copyMusic(platform, from, to, encoders, callback) {
		Files.createDirectories(this.directory.resolve(this.sysdir()).resolve(to).parent());
		Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to + '.ogg'), encoders.oggEncoder, (success) => {
			callback([to + '.ogg']);
		});
	}

	copySound(platform, from, to, encoders, callback) {
		this.copyFile(from, this.directory.resolve(this.sysdir()).resolve(to + '.wav'));
		callback([to + '.wav']);
	}

	copyImage(platform, from, to, asset, callback) {
		if (platform === Platform.iOS && asset.compressed) {
			exportImage(from, this.directory.resolve(this.sysdir()).resolve(to), asset, 'pvr', true, (format) => {
				callback([to + '.' + format]);
			});
		}
		/*else if (platform === Platform.Android && asset.compressed) {
		 var index = to.toString().lastIndexOf('.');
		 to = to.toString().substr(0, index) + '.astc';
		 asset.file = to.toString().replaceAll('\\', '/');
		 exportImage(from, this.directory.resolve(this.sysdir()).resolve(to), asset, 'astc', true, callback);
		 }*/
		else {
			exportImage(from, this.directory.resolve(this.sysdir()).resolve(to), asset, undefined, true, (format) => {
				callback([to + '.' + format]);
			});
		}
	}

	copyBlob(platform, from, to, callback) {
		this.copyFile(from, this.directory.resolve(this.sysdir()).resolve(to));
		callback([to]);
	}

	copyVideo(platform, from, to, encoders, callback) {
		Files.createDirectories(this.directory.resolve(this.sysdir()).resolve(to).parent());
		if (platform === Platform.iOS) {
			Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to + '.mp4'), encoders.h264Encoder, (success) => {
				callback([to + '.mp4']);
			});
		}
		else if (platform === Platform.Android) {
			Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to + '.ts'), encoders.h264Encoder, (success) => {
				callback([to + '.ts']);
			});
		}
		else {
			Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to + '.ogv'), encoders.theoraEncoder, (success) => {
				callback([to + '.ogv']);
			});
		}
	}
}

module.exports = KoreExporter;
