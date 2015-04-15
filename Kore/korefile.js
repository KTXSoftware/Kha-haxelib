var project = new Project('Kore');

project.addFile('Sources/**');
project.addIncludeDir('Sources');

function addBackend(name) {
	project.addFile('Backends/' + name + '/Sources/**');
	project.addIncludeDir('Backends/' + name + '/Sources');
}

if (platform === Platform.Windows) {
	addBackend('Windows');
	
	project.addIncludeDir('Backends/Windows/Libraries/directx/Include');

	if (graphics === GraphicsApi.OpenGL) {
		addBackend('OpenGL');
		project.addDefine('OPENGL');
	}
	else if (graphics === GraphicsApi.OpenGL2) {
		addBackend('OpenGL2');
		project.addDefine('OPENGL');
	}
	else if (graphics === GraphicsApi.Direct3D11) {
		addBackend('Direct3D11');
		project.addDefine('DIRECT3D');
	}
	else {
		addBackend('Direct3D9');
		project.addDefine('DIRECT3D');
	}

	project.addLibsFor('Win32', 'Backends/Windows/Libraries/directx/Lib/x86/dxguid', 'Backends/Windows/Libraries/directx/Lib/x86/DxErr', 'Backends/Windows/Libraries/directx/Lib/x86/dsound', 'Backends/Windows/Libraries/directx/Lib/x86/XInput', 'Backends/Windows/Libraries/directx/Lib/x86/dinput8');
	project.addLibsFor('x64', 'Backends/Windows/Libraries/directx/Lib/x64/dxguid', 'Backends/Windows/Libraries/directx/Lib/x64/DxErr', 'Backends/Windows/Libraries/directx/Lib/x64/dsound', 'Backends/Windows/Libraries/directx/Lib/x64/XInput');
	if (graphics !== GraphicsApi.OpenGL) {
		if (graphics === GraphicsApi.Direct3D11) {
			project.addLibFor('Win32', 'Backends/Windows/Libraries/directx/Lib/x86/d3d11');
			project.addLibFor('x64', 'Backends/Windows/Libraries/directx/Lib/x64/d3d11');
		}
		else {
			project.addLibFor('Win32', 'Backends/Windows/Libraries/directx/Lib/x86/d3d9');
			project.addLibFor('x64', 'Backends/Windows/Libraries/directx/Lib/x64/d3d9');
		}
	}

	project.addDefine('_WINSOCK_DEPRECATED_NO_WARNINGS');
	project.addLib('ws2_32');
}
else if (platform === Platform.WindowsRT) {
	addBackend('WindowsRT');
	addBackend('Direct3D11');
}
else if (platform === Platform.Xbox360) {
	addBackend('Xbox360');
	addBackend('Direct3D9');
	project.addDefine('DIRECT3D');
}
else if (platform === Platform.PlayStation3) {
	addBackend('PlayStation3');
}
else if (platform === Platform.OSX) {
	addBackend('OSX');
	addBackend('OpenGL2');
	project.addDefine('OPENGL');
	project.addLib('Cocoa');
	project.addLib('AppKit');
	project.addLib('CoreAudio');
	project.addLib('CoreData');
	project.addLib('Foundation');
	project.addLib('OpenGL');
}
else if (platform === Platform.iOS) {
	addBackend('iOS');
	addBackend('OpenGL2');
	project.addDefine('OPENGL');
	project.addLib('UIKit');
	project.addLib('Foundation');
	project.addLib('CoreGraphics');
	project.addLib('QuartzCore');
	project.addLib('OpenGLES');
	project.addLib('CoreAudio');
	project.addLib('AudioToolbox');
	project.addLib('CoreMotion');
	project.addLib('AVFoundation');
	project.addLib('CoreFoundation');
	project.addLib('CoreVideo');
	project.addLib('CoreMedia');
}
else if (platform === Platform.Android) {
	addBackend('Android');
	addBackend('OpenGL2');
	project.addDefine('OPENGL');
}
else if (platform === Platform.HTML5) {
	addBackend('HTML5');
	addBackend('OpenGL2');
	project.addExclude('Backends/OpenGL2/Sources/GL/**');
	project.addDefine('OPENGL');
}
else if (platform === Platform.Linux) {
	addBackend('Linux');
	addBackend('OpenGL2');
	project.addDefine('OPENGL');
}
else if (platform === Platform.Tizen) {
	addBackend('Tizen');
	addBackend('OpenGL2');
	project.addExclude('Backends/OpenGL2/Sources/GL/**');
	project.addDefine('OPENGL');
}

return project;
