#import <UIKit/UIKit.h>
#import <QuartzCore/QuartzCore.h>
#import <OpenGLES/ES1/gl.h>
#import <OpenGLES/ES1/glext.h>
#import <CoreMotion/CMMotionManager.h>

@interface GLView : UIView <UIKeyInput> {
@private
	EAGLContext *context;
	GLint backingWidth, backingHeight;
	GLuint defaultFramebuffer, colorRenderbuffer, depthRenderbuffer;

	CMMotionManager *motionManager;
	bool hasAccelerometer;
	float lastAccelerometerX, lastAccelerometerY, lastAccelerometerZ;
}

- (void)begin;
- (void)end;
- (void)showKeyboard;
- (void)hideKeyboard;

@end