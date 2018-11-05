#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@protocol GutenbergDelegate <NSObject>

- (void)gutenbergView:(UIView *)view didProvideHTML:(NSString *)html;

@end

@interface Gutenberg : NSObject

@property (nonatomic, weak, nullable) id<GutenbergDelegate> delegate;

+ (instancetype)sharedInstance;
- (instancetype)init NS_UNAVAILABLE;
- (UIView *)rootViewWithInitialProps:(NSDictionary<NSString *, id> *)props;

#pragma mark - Messages

- (void)requestHTML;

@end

NS_ASSUME_NONNULL_END
