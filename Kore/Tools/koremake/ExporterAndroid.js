var Exporter = require('./Exporter.js');
var Files = require('./Files.js');
var Paths = require('./Paths.js');
var Project = require('./Project.js');
var fs = require('fs');

function ExporterAndroid() {

}

ExporterAndroid.prototype = Object.create(Exporter.prototype);
ExporterAndroid.constructor = ExporterAndroid;

ExporterAndroid.prototype.exportSolution = function (solution, from, to, platform, vr) {
	
	var project = solution.getProjects()[0];
	//String libname = solution.getName().toLowerCase().replace(' ', '-');

	var nvpack = false; //Configuration.getAndroidDevkit() == AndroidDevkit.nVidia;

	if (project.getDebugDir().length > 0) this.copyDirectory(from.resolve(project.getDebugDir()), to.resolve("assets"));
	if (vr === 'cardboard') {
		Files.copyIfDifferent(Paths.executableDir().resolve(Paths.get("Data", "android", "classpath.Cardboard")), to.resolve(".classpath"), true);
	}
	else {
		Files.copyIfDifferent(Paths.executableDir().resolve(Paths.get("Data", "android", "classpath")), to.resolve(".classpath"), true);
	}

	if (nvpack) {
		var file = fs.readFileSync(Paths.executableDir().resolve(Paths.get("Data", "android", "nvidia", "project")).toString(), { encoding: 'utf8' });
		file = file.replaceAll("{ProjectName}", solution.getName());
		fs.writeFileSync(to.resolve('.project').toString());
	}
	else {
		var file = fs.readFileSync(Paths.executableDir().resolve(Paths.get("Data", "android", "project")).toString(), { encoding: 'utf8' });
		file = file.replaceAll("{ProjectName}", solution.getName());
		if (Project.koreDir.toString() != "") file = file.replaceAll("{Java-Sources}", Project.koreDir.resolve(Paths.get("Backends", "Android", "Java-Sources")).toAbsolutePath().toString().replaceAll('\\', '/'));
		if (Project.koreDir.toString() != "") file = file.replaceAll("{Android-Backend-Sources}", Project.koreDir.resolve(Paths.get("Backends", "Android", "Sources")).toAbsolutePath().toString().replaceAll('\\', '/'));
		if (Project.koreDir.toString() != "") file = file.replaceAll("{OpenGL-Backend-Sources}", Project.koreDir.resolve(Paths.get("Backends", "OpenGL2", "Sources")).toAbsolutePath().toString().replaceAll('\\', '/'));
		if (Project.koreDir.toString() != "") file = file.replaceAll("{Kore-Sources}", Project.koreDir.resolve(Paths.get("Sources")).toAbsolutePath().toString().replaceAll('\\', '/'));
		fs.writeFileSync(to.resolve('.project').toString(), file);
	}

	if (nvpack) {
		var file = fs.readFileSync(Paths.executableDir().resolve(Paths.get("Data", "android", "nvidia", "cproject")).toString(), { encoding: 'utf8' });
		file = file.replaceAll("{ProjectName}", solution.getName());
		fs.writeFileSync(to.resolve('.cproject').toString(), file);
	}
	else {
		var file = fs.readFileSync(Paths.executableDir().resolve(Paths.get("Data", "android", "cproject")).toString(), { encoding: 'utf8' });
		file = file.replaceAll("{ProjectName}", solution.getName());
		fs.writeFileSync(to.resolve('.cproject').toString(), file);
	}

	if (vr === 'gearvr') {
		Files.copyIfDifferent(Paths.executableDir().resolve(Paths.get("Data", "android", "AndroidManifest.GearVr.xml")), to.resolve("AndroidManifest.xml"), true);
		Files.copyIfDifferent(Paths.executableDir().resolve(Paths.get("Data", "android", "project.GearVr.properties")), to.resolve("project.properties"), true);
	}
	else if (vr === 'cardboard') {
		Files.copyIfDifferent(Paths.executableDir().resolve(Paths.get("Data", "android", "AndroidManifest.Cardboard.xml")), to.resolve("AndroidManifest.xml"), true);
		Files.copyIfDifferent(Paths.executableDir().resolve(Paths.get("Data", "android", "project.Cardboard.properties")), to.resolve("project.properties"), true);
	}
	else {
		Files.copyIfDifferent(Paths.executableDir().resolve(Paths.get("Data", "android", "AndroidManifest.xml")), to.resolve("AndroidManifest.xml"), true);
		Files.copyIfDifferent(Paths.executableDir().resolve(Paths.get("Data", "android", "project.properties")), to.resolve("project.properties"), true);
	}
	this.createDirectory(to.resolve(".settings"));
	if (nvpack) {
		Files.copy(Paths.executableDir().resolve(Paths.get("Data", "android", "nvidia", "org.eclipse.jdt.core.prefs")), to.resolve(Paths.get(".settings", "org.eclipse.jdt.core.prefs")), true);
	}
	else {
		Files.copyIfDifferent(Paths.executableDir().resolve(Paths.get("Data", "android", "org.eclipse.jdt.core.prefs")), to.resolve(Paths.get(".settings", "org.eclipse.jdt.core.prefs")), true);
	}

	if (nvpack) {
		Files.copy(Paths.executableDir().resolve(Paths.get("Data", "android", "nvidia", "build.xml")), to.resolve("build.xml"), true);
	}

	this.createDirectory(to.resolve("res"));
	this.createDirectory(to.resolve(Paths.get("res", "values")));
	var file = fs.readFileSync(Paths.executableDir().resolve(Paths.get("Data", "android", "strings.xml")).toString(), { encoding: 'utf8' });
	file = file.replaceAll("{ProjectName}", solution.getName());
	fs.writeFileSync(to.resolve(Paths.get("res", "values", "strings.xml")).toString(), file);

	this.createDirectory(to.resolve("jni"));

	if (nvpack) {
/*
LOCAL_PATH := $(subst //,/,$(call my-dir))
include $(CLEAR_VARS)
LOCAL_MODULE := native_basic

LOCAL_SRC_FILES := $(wildcard *.cpp)
LOCAL_SRC_FILES += $(wildcard *.c)

LOCAL_ARM_MODE   := arm

LOCAL_LDLIBS :=  -lstdc++ -lc -lm -llog -landroid -ldl -lGLESv2 -lEGL
LOCAL_STATIC_LIBRARIES := nv_and_util nv_egl_util nv_bitfont nv_math nv_glesutil nv_hhdds nv_log nv_shader nv_file nv_thread

include $(BUILD_SHARED_LIBRARY)

$(call import-add-path, ../../../libs/jni)

$(call import-module,nv_and_util)
$(call import-module,nv_egl_util)
$(call import-module,nv_bitfont)
$(call import-module,nv_math)
$(call import-module,nv_glesutil)
$(call import-module,nv_hhdds)
$(call import-module,nv_log)
$(call import-module,nv_shader)
$(call import-module,nv_file)
$(call import-module,nv_thread)
*/
	}
	this.writeFile(to.resolve(Paths.get("jni", "Android_temp.mk")));
	this.p("LOCAL_PATH := $(call my-dir)");
	this.p();
	this.p("include $(CLEAR_VARS)");
	this.p();
	if (vr === 'gearvr') this.p("include ../../../VRLib/import_vrlib.mk		# import VRLib for this module.  Do NOT call $(CLEAR_VARS) until after building your module.");
	if (vr === 'gearvr') this.p("# use += instead of := when defining the following variables: LOCAL_LDLIBS, LOCAL_CFLAGS, LOCAL_C_INCLUDES, LOCAL_STATIC_LIBRARIES");

	this.p("LOCAL_MODULE    := Kore");
	var files = "";
	for (var f in project.getFiles()) {
		var filename = project.getFiles()[f];
		if (filename.endsWith(".c") || filename.endsWith(".cpp") || filename.endsWith(".cc") || filename.endsWith(".s")) files += to.resolve('jni').relativize(from.resolve(filename)).toString().replaceAll('\\', '/') + " ";
	}
	this.p("LOCAL_SRC_FILES := " + files);
	var defines = "";
	for (var def in project.getDefines()) defines += "-D" + project.getDefines()[def].replaceAll('\"', "\\\"") + " ";
	if (vr === 'gearvr') {
		this.p("LOCAL_CFLAGS += " + defines);
	}
	else {
		this.p("LOCAL_CFLAGS := " + defines);
	}
	var includes = "";
	for (var inc in project.getIncludeDirs()) includes += "$(LOCAL_PATH)/" + to.resolve('jni').relativize(from.resolve(project.getIncludeDirs()[inc])).toString().replaceAll('\\', '/') + " ";
	if (vr === 'gearvr') {
		this.p("LOCAL_C_INCLUDES += " + includes);
		this.p("LOCAL_LDLIBS    += -llog -lGLESv2 -lOpenMAXAL -landroid");
		this.p("LOCAL_CPPFLAGS := -DVR_GEAR_VR");
	}
	else {
		this.p("LOCAL_C_INCLUDES := " + includes);
		this.p("LOCAL_LDLIBS    := -llog -lGLESv2 -lOpenMAXAL -landroid");
	}
	if (vr == "cardboard") {
		this.p("LOCAL_CPPFLAGS := -DVR_CARDBOARD");
	}
	this.p("#LOCAL_SHORT_COMMANDS := true");
	this.p();
	this.p("include $(BUILD_SHARED_LIBRARY)");
	this.p();
	this.closeFile();
	
	// Check if the file is different from the old one
	Files.copyIfDifferent(to.resolve(Paths.get("jni", "Android_temp.mk")), to.resolve(Paths.get("jni", "Android.mk")), true);

	/*
	writeFile(to.resolve(Paths::get("jni", "Application.mk")));
	p("APP_CPPFLAGS += -fexceptions -frtti");
	p("APP_STL := gnustl_static");
	//p("APP_ABI := all");
	p("APP_ABI := armeabi-v7a");
	//p("LOCAL_ARM_NEON := true");
	if (nvpack) {
		//APP_ABI := armeabi-v7a
		//APP_PLATFORM := android-10
	}
	closeFile();
	*/
	Files.copyIfDifferent(Paths.executableDir().resolve(Paths.get("Data", "android", "Application.mk")), to.resolve(Paths.get("jni", "Application.mk")), true);

	/*for (var f in project.getFiles()) {
		var file = project.getFiles()[f];
		var target = to.resolve("jni").resolve(file);
		this.createDirectory(Paths.get(target.path.substr(0, target.path.lastIndexOf('/'))));
		Files.copyIfDifferent(from.resolve(file), target, true);
	}*/
};

module.exports = ExporterAndroid;
