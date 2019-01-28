#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(RNReactNativeGutenbergBridge, NSObject)

RCT_EXTERN_METHOD(provideToNative_Html:(NSString *)html title:(NSString *)title changed:(BOOL)changed)
RCT_EXTERN_METHOD(onMediaLibraryPressed:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(onMediaUploadPressed:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(onMediaCapturePressed:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(mediaUploadResync)
RCT_EXTERN_METHOD(editorDidLayout)

@end
