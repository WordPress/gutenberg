#import "RNReactNativeGutenbergBridge.h"

NSString *const RequestHTMLMessageName = @"requestGetHtml";

@implementation RNReactNativeGutenbergBridge

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}

RCT_EXPORT_MODULE()

- (NSArray<NSString *> *)supportedEvents
{
    return @[RequestHTMLMessageName];
}

//provideToNative_Html

RCT_EXPORT_METHOD(provideToNative_Html:(NSString *)html)
{
    if (self.delegate) {
        [self.delegate gutenbergDidProvideHTML:html];
    }
}

@end
