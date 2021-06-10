#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RNSentry, NSObject)

// Extra methods to extract data from the Sentry SDK configured in the main apps.
RCT_EXTERN_METHOD(getOptions:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)rejecter)
RCT_EXTERN_METHOD(attachScopeToEvent:(NSDictionary * _Nonnull)event resolve:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)rejecter)
RCT_EXTERN_METHOD(shouldSendEvent:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)rejecter)


// This methods are extracted from the original implementation.
// Reference: https://github.com/getsentry/sentry-react-native/blob/master/ios/RNSentry.m
RCT_EXTERN_METHOD(startWithOptions:(NSDictionary *_Nonnull)options resolve:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)rejecter)
RCT_EXTERN_METHOD(deviceContexts:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)rejecter)
RCT_EXTERN_METHOD(setLogLevel:(int)level)
RCT_EXTERN_METHOD(fetchRelease:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)rejecter)
RCT_EXTERN_METHOD(captureEnvelope:(NSDictionary * _Nonnull)envelopeDict
                  resolve:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)rejecter)
RCT_EXTERN_METHOD(setUser:(NSDictionary *)user
                  otherUserKeys:(NSDictionary *)otherUserKeys
)
RCT_EXTERN_METHOD(addBreadcrumb:(NSDictionary *)breadcrumb)
RCT_EXTERN_METHOD(clearBreadcrumbs)
RCT_EXTERN_METHOD(setExtra:(NSString *)key
                  extra:(NSString *)extra
)
RCT_EXTERN_METHOD(setContext:(NSString *)key
                  context:(NSDictionary *)context
)
RCT_EXTERN_METHOD(setTag:(NSString *)key
                  value:(NSString *)value
)
RCT_EXTERN_METHOD(crash)
@end
