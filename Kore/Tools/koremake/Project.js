"use strict";

const Files = require('./Files.js');
const Path = require('./Path.js');
const Paths = require('./Paths.js');
const uuid = require('./uuid.js');

function contains(array, value) {
	for (let element of array) {
		if (element === value) return true;
	}
	return false;
}

function isAbsolute(path) {
	return (path.length > 0 && path[0] == '/') || (path.length > 1 && path[1] == ':');
}

let koreDir = new Path('.');

class Project {
	constructor(name) {
		this.name = name;
		this.debugDir = '';
		this.basedir = require('./Solution').scriptdir;
		if (name == 'Kore') Project.koreDir = this.basedir;
		this.uuid = uuid.v4();

		this.files = [];
		this.javadirs = [];
		this.subProjects = [];
		this.includeDirs = [];
		this.defines = [];
		this.libs = [];
		this.systemDependendLibraries = {};
		this.includes = [];
		this.excludes = [];
	}

	flatten() {
		for (let sub of this.subProjects) sub.flatten();
		for (let sub of this.subProjects) {
			let basedir = this.basedir;
			//if (basedir.startsWith("./")) basedir = basedir.substring(2);
			let subbasedir = sub.basedir;
			//if (subbasedir.startsWith("./")) subbasedir = subbasedir.substring(2);
			//if (subbasedir.startsWith(basedir)) subbasedir = subbasedir.substring(basedir.length());
			if (subbasedir.startsWith(basedir)) subbasedir = basedir.relativize(subbasedir);

			for (let d of sub.defines) if (!contains(this.defines, d)) this.defines.push(d);
			for (let file of sub.files) this.files.push(subbasedir.resolve(file).toString().replace(/\\/g, '/'));
			for (let i of sub.includeDirs) if (!contains(this.includeDirs, subbasedir.resolve(i).toString())) this.includeDirs.push(subbasedir.resolve(i).toString());
			for (let j of sub.javadirs) if (!contains(this.javadirs, subbasedir.resolve(j).toString())) this.javadirs.push(subbasedir.resolve(j).toString());
			for (let lib of sub.libs) {
				if (!contains(lib, '/') && !contains(lib, '\\')) {
					if (!contains(this.libs, lib)) this.libs.push(lib);
				}
				else {
					if (!contains(this.libs, subbasedir.resolve(lib).toString())) this.libs.push(subbasedir.resolve(lib).toString());
				}
			}
			for (let system in sub.systemDependendLibraries) {
				let libs = sub.systemDependendLibraries[system];
				for (let lib of libs) {
					if (this.systemDependendLibraries[system] === undefined) this.systemDependendLibraries[system] = [];
					if (!contains(this.systemDependendLibraries[system], this.stringify(subbasedir.resolve(lib)))) {
						if (!contains(lib, '/') && !contains(lib, '\\')) this.systemDependendLibraries[system].push(lib);
						else this.systemDependendLibraries[system].push(this.stringify(subbasedir.resolve(lib)));
					}
				}
			}
		}
		this.subProjects = [];
	}

	getName() {
		return this.name;
	}

	getUuid() {
		return this.uuid;
	}

	matches(text, pattern) {
		const regexstring = pattern.replace(/\./g, "\\.").replace(/\*\*/g, ".?").replace(/\*/g, "[^/]*").replace(/\?/g, '*');
		const regex = new RegExp('^' + regexstring + '$', 'g');
		return regex.test(text);
	}

	matchesAllSubdirs(dir, pattern) {
		if (pattern.endsWith("/**")) {
			return this.matches(this.stringify(dir), pattern.substr(0, pattern.length - 3));
		}
		else return false;
	}

	stringify(path) {
		return path.toString().replace(/\\/g, '/');
	}

	searchFiles(current) {
		if (current === undefined) {
			for (let sub of this.subProjects) sub.searchFiles();
			this.searchFiles(this.basedir);
			//std::set<std::string> starts;
			//for (std::string include : includes) {
			//	if (!isAbsolute(include)) continue;
			//	std::string start = include.substr(0, firstIndexOf(include, '*'));
			//	if (starts.count(start) > 0) continue;
			//	starts.insert(start);
			//	searchFiles(Paths::get(start));
			//}
			return;
		}

		let files = Files.newDirectoryStream(current);
		nextfile: for (let f in files) {
			var file = Paths.get(current, files[f]);
			if (Files.isDirectory(file)) continue;
			//if (!current.isAbsolute())
			file = this.basedir.relativize(file);
			for (let exclude of this.excludes) {
				if (this.matches(this.stringify(file), exclude)) continue nextfile;
			}
			for (let include of this.includes) {
				if (isAbsolute(include)) {
					let inc = Paths.get(include);
					inc = this.basedir.relativize(inc);
					include = inc.path;
				}
				if (this.matches(this.stringify(file), include)) {
					this.files.push(this.stringify(file));
				}
			}
		}
		let dirs = Files.newDirectoryStream(current);
		nextdir: for (let d in dirs) {
			var dir = Paths.get(current, dirs[d]);
			if (!Files.isDirectory(dir)) continue;
			for (let exclude of this.excludes) {
				if (this.matchesAllSubdirs(this.basedir.relativize(dir), exclude)) {
					continue nextdir;
				}
			}
			this.searchFiles(dir);
		}
	}

	addFile(file) {
		this.includes.push(file);
	}

	addFiles() {
		for (let i = 0; i < arguments.length; ++i) {
			this.addFile(arguments[i]);
		}
	}

	addJavaDir(dir) {
		this.javadirs.push(dir);
	}

	addJavaDirs() {
		for (let i = 0; i < arguments.length; ++i) {
			this.addJavaDir(arguments[i]);
		}
	}

	addExclude(exclude) {
		this.excludes.push(exclude);
	}

	addExcludes() {
		for (let i = 0; i < arguments.length; ++i) {
			this.addExclude(arguments[i]);
		}
	}

	addDefine(define) {
		if (contains(this.defines, define)) return;
		this.defines.push(define);
	}

	addDefines() {
		for (let i = 0; i < arguments.length; ++i) {
			this.addDefine(arguments[i]);
		}
	}

	addIncludeDir(include) {
		if (contains(this.includeDirs, include)) return;
		this.includeDirs.push(include);
	}

	addIncludeDirs() {
		for (let i = 0; i < arguments.length; ++i) {
			this.addIncludeDir(arguments[i]);
		}
	}

	addSubProject(project) {
		this.subProjects.push(project);
	}

	addLib(lib) {
		this.libs.push(lib);
	}

	addLibs() {
		for (let i = 0; i < arguments.length; ++i) {
			this.addLib(arguments[i]);
		}
	}

	addLibFor(system, lib) {
		if (this.systemDependendLibraries[system] === undefined) this.systemDependendLibraries[system] = [];
		this.systemDependendLibraries[system].push(lib);
	}

	addLibsFor() {
		if (this.systemDependendLibraries[arguments[0]] === undefined) this.systemDependendLibraries[arguments[0]] = [];
		for (let i = 1; i < arguments.length; ++i) {
			this.systemDependendLibraries[arguments[0]].push(arguments[i]);
		}
	}

	getFiles() {
		return this.files;
	}

	getJavaDirs() {
		return this.javadirs;
	}

	getBasedir() {
		return this.basedir;
	}

	getSubProjects() {
		return this.subProjects;
	}

	getIncludeDirs() {
		return this.includeDirs;
	}

	getDefines() {
		return this.defines;
	}

	getLibs() {
		return this.libs;
	}

	getLibsFor(system) {
		if (this.systemDependendLibraries[system] === undefined) return [];
		return this.systemDependendLibraries[system];
	}

	getDebugDir() {
		return this.debugDir;
	}

	setDebugDir(debugDir) {
		this.debugDir = debugDir;
	}
}

module.exports = Project;
