
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

extern NSString * const RequestHTMLMessageName;

@protocol GutenbergBridgeDelegate <NSObject>
- (void)didProvideHTML:(NSString *)html;
@end

@interface RNReactNativeGutenbergBridge : RCTEventEmitter <RCTBridgeModule>
@property (nonatomic, weak, nullable) id<GutenbergBridgeDelegate> delegate;
@end
  
