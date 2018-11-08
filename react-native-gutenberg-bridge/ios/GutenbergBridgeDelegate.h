@import Foundation;

NS_ASSUME_NONNULL_BEGIN

@protocol GutenbergBridgeDelegate <NSObject>
- (void)gutenbergDidProvideHTML:(NSString *)html;
@end

NS_ASSUME_NONNULL_END
