#import "Gutenberg.h"
#import "RNReactNativeGutenbergBridge.h"

#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTRootView.h>
#import <React/RCTBundleURLProvider.h>

@interface Gutenberg ()<RCTBridgeDelegate, GutenbergBridgeDelegate>
@property (nonatomic, strong, readonly) RCTBridge *bridge;
@property (nonatomic, strong) RNReactNativeGutenbergBridge* gutenbergBridgeModule;
@property (nonatomic, strong) UIView* gutenbergRootView;
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
        _bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:nil];
    }
    return self;
}

- (UIView *)rootViewWithInitialProps:(NSDictionary<NSString *, id> *)props
{
    if (!self.gutenbergRootView) {
        self.gutenbergRootView = [[RCTRootView alloc] initWithBridge:_bridge moduleName:@"gutenberg" initialProperties:props];
        self.gutenbergBridgeModule.delegate = self;
    }
    return self.gutenbergRootView;
}

#pragma mark - RCTBridgeDelegate

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
    return [RCTBundleURLProvider.sharedSettings jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge
{
    _gutenbergBridgeModule = [RNReactNativeGutenbergBridge new];
    return @[_gutenbergBridgeModule];
}

#pragma mark - GutenbergBridgeDelegate

- (void)didProvideHTML:(NSString *)html
{
    if (self.delegate) {
        [self.delegate gutenbergView:self.gutenbergRootView didProvideHTML:html];
    }
}

#pragma mark - Messages

- (void)requestHTML
{
    [self.gutenbergBridgeModule sendEventWithName:RequestHTMLMessageName body:nil];
}

@end
