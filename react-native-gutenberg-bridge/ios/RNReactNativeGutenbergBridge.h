
#if __has_include("RCTBridgeModule.h")
#import "RCTBridgeModule.h"
#else
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#endif

@interface RNReactNativeGutenbergBridge : RCTEventEmitter <RCTBridgeModule>

@end
  
