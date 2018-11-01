#import "Gutenberg.h"
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>

@interface GutenbergBridgeDelegate: NSObject<RCTBridgeDelegate>
@end

@implementation Gutenberg

+ (instancetype)sharedInstance;
{
    static Gutenberg *_sharedInstance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        _sharedInstance = [[self alloc] init];
    });
    return _sharedInstance;
}

- (instancetype)init
{
    self = [super init];
    if (self) {
        _bridge = [[RCTBridge alloc] initWithDelegate:[GutenbergBridgeDelegate new] launchOptions:nil];
    }
    return self;
}

- (UIView *)rootViewWithInitialProps:(NSDictionary<NSString *, id> *)props
{
    return [[RCTRootView alloc] initWithBridge:_bridge moduleName:@"gutenberg" initialProperties:props];
}
@end

@implementation GutenbergBridgeDelegate
- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
    return [RCTBundleURLProvider.sharedSettings jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
}
@end
