#import "Gutenberg.h"
#import "RNReactNativeGutenbergBridge.h"

#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTRootView.h>
#import <React/RCTBundleURLProvider.h>

@interface Gutenberg ()<RCTBridgeDelegate>
@property (nonatomic, strong, readonly) RCTBridge *bridge;
@property (nonatomic, strong) RNReactNativeGutenbergBridge* gutenbergBridgeModule;
@end

@implementation Gutenberg

- (instancetype)initWithProps:(NSDictionary<NSString *, id> *)props
{
    self = [super init];
    if (self) {
        _gutenbergBridgeModule = [RNReactNativeGutenbergBridge new];
        _bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:nil];
        _rootView = [[RCTRootView alloc] initWithBridge:_bridge moduleName:@"gutenberg" initialProperties:props];
    }
    return self;
}

- (instancetype)init
{
    return [self initWithProps:nil];
}

- (void)invalidate
{
    [self.bridge invalidate];
    _bridge = nil;
}

#pragma mark - RCTBridgeDelegate

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
    return [RCTBundleURLProvider.sharedSettings jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge
{
    return @[self.gutenbergBridgeModule];
}

#pragma mark - GutenbergBridgeDelegate

-(id<GutenbergBridgeDelegate>)delegate
{
    return self.gutenbergBridgeModule.delegate;
}

-(void)setDelegate:(id<GutenbergBridgeDelegate>)delegate
{
    self.gutenbergBridgeModule.delegate = delegate;
}

#pragma mark - Messages

- (void)requestHTML
{
    [self.gutenbergBridgeModule sendEventWithName:RequestHTMLMessageName body:nil];
}

@end
