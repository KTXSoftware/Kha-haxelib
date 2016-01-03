"use strict";

const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const Files = require('./Files.js');
const Paths = require('./Paths.js');
const log = require('./log.js');

function findFiles(dir, match) {
	if (path.isAbsolute(match)) {
		match = path.relative(dir, match);
	}
	match = match.replace(/\\/g, '/');
	
	let subdir = '.'
	if (match.indexOf('*') >= 0) {
		let beforeStar = match.substring(0, match.indexOf('*'));
		subdir = beforeStar.substring(0, beforeStar.lastIndexOf('/'));
	}
		
	let regex = new RegExp('^' + match.replace(/\./g, "\\.").replace(/\*\*/g, ".?").replace(/\*/g, "[^/]*").replace(/\?/g, '*') + '$', 'g');
	
	let collected = [];
	findFiles2(dir, subdir, regex, collected);
	return collected;
}

function findFiles2(basedir, dir, regex, collected) {
	let dirpath = path.resolve(basedir, dir);
	if (!fs.existsSync(dirpath) || !fs.statSync(dirpath).isDirectory()) return;
	let files = fs.readdirSync(dirpath);
	nextfile: for (let f of files) {
		let file = path.resolve(dirpath, f);
		if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) continue;
		//for (let exclude of this.excludes) {
		//	if (this.matches(this.stringify(file), exclude)) continue nextfile;
		//}
		let filename = path.relative(basedir, file).replace(/\\/g, '/');
		if (regex.test(filename)) {
			collected.push(file.replace(/\\/g, '/'));
		}
		regex.lastIndex = 0;
	}
	nextdir: for (let f of files) {
		let file = path.resolve(dirpath, f);
		if (!fs.existsSync(file) || !fs.statSync(file).isDirectory()) continue;
		//for (let exclude of this.excludes) {
		//	if (this.matchesAllSubdirs(this.basedir.relativize(dir), exclude)) {
		//		continue nextdir;
		//	}
		//}
		findFiles2(basedir, file, regex, collected);
	}
}

class Project {
	constructor(name) {
		this.name = name;
		this.assets = [];
		this.sources = [];
		this.shaders = [];
		this.exportedShaders = [];
		this.defines = [];
		this.parameters = [];
		this.scriptdir = Project.scriptdir;
		this.libraries = [];
	}

	/**
	 * Add all assets matching the match regex relative to the directory containing the current khafile.
	 * Asset types are infered from the file suffix.
	 * The regex syntax is very simple: * for anything, ** for anything across directories.
	 */
	addAssets(match) {
		let files = findFiles(this.scriptdir, match);
		for (let f of files) {
			let file = path.parse(f);
			let name = file.name;
			let type = 'blob';
			if (file.ext === '.png' || file.ext === '.jpg' || file.ext === '.jpeg') {
				type = 'image';
			}
			else if (file.ext === '.wav') {
				type = 'sound';
			}
			else if (file.ext === '.ttf') {
				type = 'font';
			}
			else if (file.ext === '.mp4' || file.ext === '.webm' || file.ext === '.wmv' || file.ext === '.avi') {
				type = 'video';
			}
			else {
				name = file.base;
			}

			if (!file.name.startsWith('.') && file.name.length > 0) {
				this.assets.push({
					name: name,
					file: f,
					type: type
				});
			}
		}
	}

	addSources(source) {
		this.sources.push(source);
	}

	/**
	 * Add all shaders matching the match regex relative to the directory containing the current khafile.
	 * The regex syntax is very simple: * for anything, ** for anything across directories.
	 */
	addShaders(match) {
		let shaders = findFiles(this.scriptdir, match);
		for (let shader of shaders) {
			let file = path.parse(shader);
			if (!file.name.startsWith('.') && file.ext === '.glsl') {
				this.shaders.push({
					name: file.name,
					files: [shader]
				});
			}
		}
	}

	addDefine(define) {
		this.defines.push(define);
	}
	
	addParameter(parameter) {
		this.parameters.push(parameter);
	}

	addLibrary(library) {
		let self = this;
		function findLibraryDirectory(name) {
			let libpath = path.join(self.scriptdir, 'Libraries', name);
			if (fs.existsSync(libpath) && fs.statSync(libpath).isDirectory()) {
				return libpath;
			}
            try {
                libpath = path.join(child_process.execSync('haxelib config', { encoding: 'utf8' }).trim(), name.toLowerCase());
            }
            catch (error) {
                libpath = path.join(process.env.HAXEPATH, 'lib', name.toLowerCase());
            }
            if (fs.existsSync(libpath) && fs.statSync(libpath).isDirectory()) {
                if (fs.existsSync(path.join(libpath, '.dev'))) {
                    return fs.readFileSync(path.join(libpath, '.dev'), 'utf8');
                }
                else if (fs.existsSync(path.join(libpath, '.current'))) {
                    let current = fs.readFileSync(path.join(libpath, '.current'), 'utf8');
                    return path.join(libpath, current.replaceAll('.', ','));
                }
			}
			log.error('Error: Library ' + name + ' not found.');
			return '';
		}
		
		let dir = findLibraryDirectory(library);
		
		if (dir !== '') {
			this.libraries.push(dir);
			
			if (fs.existsSync(path.join(dir, 'haxelib.json'))) {
				let options = JSON.parse(fs.readFileSync(path.join(dir, 'haxelib.json'), 'utf8'));
				if (options.classPath) {
					this.sources.push(path.join(dir, options.classPath));
				}
				else {
					this.sources.push(dir);
				}
				if (options.dependencies) {
					for (let dependency in options.dependencies) {
						if (dependency.toLowerCase() !== 'kha') {
							this.addLibrary(dependency);
						}
					}
				}
			}
			else {
				this.sources.push(path.join(dir, 'Sources'));
			}
			
			if (fs.existsSync(path.join(dir, 'extraParams.hxml'))) {
				let params = fs.readFileSync(path.join(dir, 'extraParams.hxml'), 'utf8');
				for (let parameter of params.split('\n')) {
					let param = parameter.trim();
					if (param !== '') {
						this.addParameter(param);
					}
				}
			}
			
			this.addShaders(dir + '/Sources/Shaders/**');
		}
	}
}

module.exports = Project;
