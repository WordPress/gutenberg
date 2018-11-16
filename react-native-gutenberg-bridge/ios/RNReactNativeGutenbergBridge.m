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

RCT_EXPORT_METHOD(provideToNative_Html:(NSString *)html changed:(BOOL)changed)
{
    if (self.delegate) {
        [self.delegate gutenbergDidProvideHTML:html changed:changed];
    }
}

RCT_EXPORT_METHOD(onMediaLibraryPress:(RCTResponseSenderBlock)callback)
{
    if (self.delegate) {
        [self.delegate gutenbergDidRequestMediaPickerWithCallback:^(NSString * _Nullable url) {
            callback(url ? @[url] : @[[NSNull null]]);
        }];
    }
}

@end
