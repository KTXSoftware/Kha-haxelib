"use strict";

const path = require('path');
const KhaExporter = require('./KhaExporter.js');
const Converter = require('./Converter.js');
const Files = require('./Files.js');
const Haxe = require('./Haxe.js');
const Options = require('./Options.js');
const Paths = require('./Paths.js');
const exportImage = require('./ImageTool.js');
const fs = require('fs');
const HaxeProject = require('./HaxeProject.js');

class JavaExporter extends KhaExporter {
	constructor(khaDirectory, directory) {
		super(khaDirectory);
		this.directory = directory;
	}

	sysdir() {
		return 'java';
	}

	exportSolution(name, platform, khaDirectory, haxeDirectory, from, callback) {
		this.addSourceDirectory("Kha/Backends/" + this.backend());

		this.createDirectory(this.directory.resolve(this.sysdir()));

		const defines = [
			'no-compilation',
			'sys_' + platform,
			'sys_g1', 'sys_g2',
			'sys_a1'
		];

		const options = {
			from: from.toString(),
			to: path.join(this.sysdir(), 'Sources'),
			sources: this.sources,
			defines: defines,
			haxeDirectory: haxeDirectory.toString(),
			system: this.sysdir(),
			language: 'java',
			width: this.width,
			height: this.height,
			name: name
		};
		HaxeProject(this.directory.toString(), options);

		Files.removeDirectory(this.directory.resolve(Paths.get(this.sysdir(), "Sources")));

		Haxe.executeHaxe(this.directory, haxeDirectory, ['project-' + this.sysdir() + '.hxml'], () => {
			this.exportEclipseProject();
			callback();
		});
	}

	backend() {
		return 'Java';
	}

	exportEclipseProject() {
		this.writeFile(this.directory.resolve(Paths.get(this.sysdir(), ".classpath")));
		this.p("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
		this.p("<classpath>");
		this.p("\t<classpathentry kind=\"src\" path=\"Sources/src\"/>");
		this.p("\t<classpathentry kind=\"con\" path=\"org.eclipse.jdt.launching.JRE_CONTAINER\"/>");
		this.p("\t<classpathentry kind=\"output\" path=\"bin\"/>");
		this.p("</classpath>");
		this.closeFile();

		this.writeFile(this.directory.resolve(Paths.get(this.sysdir(), ".project")));
		this.p("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
		this.p("<projectDescription>");
		this.p("\t<name>" + this.getCurrentDirectoryName(this.directory) + "</name>");
		this.p("\t<comment></comment>");
		this.p("\t<projects>");
		this.p("\t</projects>");
		this.p("\t<buildSpec>");
		this.p("\t\t<buildCommand>");
		this.p("\t\t\t<name>org.eclipse.jdt.core.javabuilder</name>");
		this.p("\t\t\t<arguments>");
		this.p("\t\t\t</arguments>");
		this.p("\t\t</buildCommand>");
		this.p("\t</buildSpec>");
		this.p("\t<natures>");
		this.p("\t\t<nature>org.eclipse.jdt.core.javanature</nature>");
		this.p("\t</natures>");
		this.p("</projectDescription>");
		this.closeFile();
	}

	copyMusic(platform, from, to, encoders, callback) {
		this.copyFile(from, this.directory.resolve(this.sysdir()).resolve(to + '.wav'));
		callback([to + '.wav']);
	}

	copySound(platform, from, to, encoders, callback) {
		this.copyFile(from, this.directory.resolve(this.sysdir()).resolve(to + ".wav"));
		callback([to + '.wav']);
	}

	copyImage(platform, from, to, asset, callback) {
		exportImage(from, this.directory.resolve(this.sysdir()).resolve(to), asset, undefined, false, (format) => {
			callback([to + '.' + format]);
		});
	}

	copyBlob(platform, from, to, callback) {
		this.copyFile(from, this.directory.resolve(this.sysdir()).resolve(to));
		callback([to]);
	}

	copyVideo(platform, from, to, encoders, callback) {
		callback([to]);
	}
}

module.exports = JavaExporter;
