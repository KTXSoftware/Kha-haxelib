#import <UIKit/UIKit.h>
#import <QuartzCore/QuartzCore.h>
#ifdef SYS_METAL
#import <Metal/Metal.h>
#import <QuartzCore/CAMetalLayer.h>
#else
#import <OpenGLES/ES1/gl.h>
#import <OpenGLES/ES1/glext.h>
#endif
#import <CoreMotion/CMMotionManager.h>

@interface GLView : UIView <UIKeyInput> {
@private
#ifdef SYS_METAL
	id <MTLDevice> device;
	id <MTLCommandQueue> commandQueue;
	id <MTLCommandBuffer> commandBuffer;
	id <MTLRenderCommandEncoder> commandEncoder;
	id <CAMetalDrawable> drawable;
	id <MTLLibrary> library;
	MTLRenderPassDescriptor* renderPassDescriptor;
#else
	EAGLContext* context;
	GLuint defaultFramebuffer, colorRenderbuffer, depthRenderbuffer;
#endif
	
	CMMotionManager* motionManager;
	bool hasAccelerometer;
	float lastAccelerometerX, lastAccelerometerY, lastAccelerometerZ;
}

- (void)begin;
- (void)end;
- (void)showKeyboard;
- (void)hideKeyboard;
#ifdef SYS_METAL
- (id <MTLDevice>)metalDevice;
- (id <MTLLibrary>)metalLibrary;
- (id <MTLRenderCommandEncoder>)metalEncoder;
#endif

@end