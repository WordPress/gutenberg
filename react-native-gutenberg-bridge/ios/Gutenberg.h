#import <UIKit/UIKit.h>
#import "GutenbergBridgeDelegate.h"

NS_ASSUME_NONNULL_BEGIN

@protocol GutenbergDelegate <NSObject>

- (void)gutenbergDidProvideHTML:(NSString *)html;

@end

@interface Gutenberg : NSObject

@property (nonatomic, weak, nullable) id<GutenbergBridgeDelegate> delegate;
@property (nonatomic, strong, readonly) UIView* rootView;

- (instancetype)initWithProps:(nullable NSDictionary<NSString *, id> *)props NS_DESIGNATED_INITIALIZER;

#pragma mark - Messages

- (void)requestHTML;

@end

NS_ASSUME_NONNULL_END
