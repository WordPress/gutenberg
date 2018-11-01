#import <Foundation/Foundation.h>
#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>


NS_ASSUME_NONNULL_BEGIN

@interface Gutenberg : NSObject
@property (nonatomic, strong, readonly) RCTBridge *bridge;
+ (instancetype)sharedInstance;
- (instancetype)init NS_UNAVAILABLE;
- (UIView *)rootViewWithInitialProps:(NSDictionary<NSString *, id> *)props;
@end

NS_ASSUME_NONNULL_END
