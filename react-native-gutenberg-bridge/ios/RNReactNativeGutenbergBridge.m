
#import "RNReactNativeGutenbergBridge.h"

@implementation RNReactNativeGutenbergBridge

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}
RCT_EXPORT_MODULE()

- (NSArray<NSString *> *)supportedEvents
{
    return @[@"requestGetHtml"];
}

//provideToNative_Html

RCT_EXPORT_METHOD(provideToNative_Html:(NSString *)html)
{
    NSLog(@"provideToNative_Html called on IOS with:\n%@", html);
}

@end
  
