@import Foundation;

typedef void (^MediaPickerDidPickMediaCallback)(NSString * _Nullable url);

NS_ASSUME_NONNULL_BEGIN

@protocol GutenbergBridgeDelegate <NSObject>

- (void)gutenbergDidProvideHTML:(NSString *)html changed:(BOOL)changed;
- (void)gutenbergDidRequestMediaPickerWithCallback:(MediaPickerDidPickMediaCallback)callback;

@end

NS_ASSUME_NONNULL_END
