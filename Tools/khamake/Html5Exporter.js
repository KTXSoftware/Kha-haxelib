"use strict";

const path = require('path');
const KhaExporter = require('./KhaExporter.js');
const Converter = require('./Converter.js');
const Files = require('./Files.js');
const Haxe = require('./Haxe.js');
const Options = require('./Options.js');
const Paths = require('./Paths.js');
const exportImage = require('./ImageTool.js');
const fs = require('fs-extra');
const HaxeProject = require('./HaxeProject.js');

class Html5Exporter extends KhaExporter {
	constructor(khaDirectory, directory) {
		super(khaDirectory, directory);
		this.directory = directory;
		this.addSourceDirectory(path.join(khaDirectory.toString(), 'Backends/HTML5'));
	}

	sysdir() {
		return 'html5';
	}

	exportSolution(name, platform, khaDirectory, haxeDirectory, from, callback) {
		this.createDirectory(this.directory.resolve(this.sysdir()));

		let defines = [
			'sys_' + platform,
			'sys_g1', 'sys_g2', 'sys_g3', 'sys_g4',
			'sys_a1', 'sys_a2'
		];
		if (this.sysdir() === 'node') {
			defines = [
				'sys_node',
				'sys_server',
				'nodejs'
			]
		}

		const options = {
			from: from.toString(),
			to: path.join(this.sysdir(), 'kha.js'),
			sources: this.sources,
			defines: defines,
			parameters: this.parameters,
			haxeDirectory: haxeDirectory.toString(),
			system: this.sysdir(),
			language: 'js',
			width: this.width,
			height: this.height,
			name: name
		};
		HaxeProject(this.directory.toString(), options);

		let index = this.directory.resolve(Paths.get(this.sysdir(), "index.html"));
		if (!Files.exists(index)) {
			let protoindex = fs.readFileSync(path.join(__dirname, 'Data', 'html5', 'index.html'), {encoding: 'utf8'});
			protoindex = protoindex.replaceAll("{Name}", name);
			protoindex = protoindex.replaceAll("{Width}", this.width);
			protoindex = protoindex.replaceAll("{Height}", this.height);
			fs.writeFileSync(index.toString(), protoindex);
		}

		if (Options.compilation) {
			Haxe.executeHaxe(this.directory, haxeDirectory, ['project-' + this.sysdir() + '.hxml'], callback);
		}
		else {
			callback();
		}
	}

	/*copyMusic(platform, from, to, encoders, callback) {
		Files.createDirectories(this.directory.resolve(this.sysdir()).resolve(to).parent());
		Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to + '.ogg'), encoders.oggEncoder, (ogg) => {
			Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to + '.mp4'), encoders.aacEncoder, (mp4) => {
				var files = [];
				if (ogg) files.push(to + '.ogg');
				if (mp4) files.push(to + '.mp4');
				callback(files);
			});
		});
	}*/

	copySound(platform, from, to, encoders) {
		Files.createDirectories(this.directory.resolve(this.sysdir()).resolve(to).parent());
		let ogg = Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to + '.ogg'), encoders.oggEncoder);
		let mp4 = Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to + '.mp4'), encoders.aacEncoder);
		var files = [];
		if (ogg) files.push(to + '.ogg');
		if (mp4) files.push(to + '.mp4');
		return files;
	}

	copyImage(platform, from, to, asset) {
		let format = exportImage(from, this.directory.resolve(this.sysdir()).resolve(to), asset, undefined, false);
		return [to + '.' + format];
	}

	copyBlob(platform, from, to) {
		fs.copySync(from.toString(), this.directory.resolve(this.sysdir()).resolve(to).toString(), { clobber: true });
		return [to];
	}

	copyVideo(platform, from, to, encoders) {
		Files.createDirectories(this.directory.resolve(this.sysdir()).resolve(to).parent());
		let mp4 = Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to + ".mp4"), encoders.h264Encoder);
		let webm = Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to + ".webm"), encoders.webmEncoder);
		let files = [];
		if (mp4) files.push(to + '.mp4');
		if (webm) files.push(to + '.webm');
		return files;
	}
}

module.exports = Html5Exporter;
