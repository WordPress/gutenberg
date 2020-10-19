#import <React/RCTViewManager.h>
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RNReactNativeGutenbergBridge, NSObject)

RCT_EXTERN_METHOD(provideToNative_Html:(NSString *)html title:(NSString *)title changed:(BOOL)changed contentInfo:(NSDictionary *)info)
RCT_EXTERN_METHOD(requestMediaPickFrom:(NSString *)source filter:(NSArray<NSString *> *)filter allowMultipleSelection:(BOOL)allowMultipleSelection callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getOtherMediaOptions:(NSArray<NSString *> *)filter callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(mediaUploadSync)
RCT_EXTERN_METHOD(requestImageFailedRetryDialog:(int)mediaID)
RCT_EXTERN_METHOD(requestImageUploadCancelDialog:(int)mediaID)
RCT_EXTERN_METHOD(requestImageUploadCancel:(int)mediaID)
RCT_EXTERN_METHOD(requestMediaImport:(NSString *)sourceURL callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(editorDidLayout)
RCT_EXTERN_METHOD(editorDidMount:(NSArray *)unsupportedBlockNames)
RCT_EXTERN_METHOD(editorDidEmitLog:(NSString *)message logLevel:(int)logLevel)
RCT_EXTERN_METHOD(editorDidAutosave)
RCT_EXTERN_METHOD(fetchRequest:(NSString *)path resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(requestImageFullscreenPreview:(NSString *)currentImageUrlString originalImageUrlString:(NSString *)originalImageUrlString)
RCT_EXTERN_METHOD(requestMediaEditor:(NSString *)mediaUrl callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(logUserEvent:(NSString *)event properties:(NSDictionary *)properties)
RCT_EXTERN_METHOD(requestUnsupportedBlockFallback:(NSString *)content blockId:(NSString *)blockId blockName:(NSString *)blockName blockTitle:(NSString *)blockTitle)
RCT_EXTERN_METHOD(showUserSuggestions:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)rejecter)
RCT_EXTERN_METHOD(showXpostSuggestions:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)rejecter)
RCT_EXTERN_METHOD(requestStarterPageTemplatesTooltipShown:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setStarterPageTemplatesTooltipShown:(BOOL)tooltipShown)
RCT_EXTERN_METHOD(actionButtonPressed:(NSString *)buttonType)

@end
