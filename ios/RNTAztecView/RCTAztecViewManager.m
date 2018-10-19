#import "RCTAztecViewManager.h"
#import "RNTAztecView-Swift.h"
#import <React/RCTViewManager.h>

typedef void (^ActionBlock)(RCTAztecView *aztecView);

@implementation RCTAztecViewManager (RCTExternModule)
RCT_EXPORT_MODULE(RCTAztecView)

RCT_REMAP_VIEW_PROPERTY(text, contents, NSDictionary)
RCT_EXPORT_VIEW_PROPERTY(onContentSizeChange, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onChange, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onEnter, RCTBubblingEventBlock)

RCT_EXPORT_VIEW_PROPERTY(onActiveFormatsChange, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onHTMLContentWithCursor, RCTBubblingEventBlock)

RCT_EXPORT_VIEW_PROPERTY(placeholder, NSString)
RCT_EXPORT_VIEW_PROPERTY(placeholderTextColor, UIColor)

- (void)executeBlock:(ActionBlock)block onNode:(NSNumber *)node {

    [self.bridge.uiManager addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[node];
        if (![view isKindOfClass:[RCTAztecView class]]) {
            RCTLogError(@"Invalid view returned from registry, expecting RCTAztecView, got: %@", view);
            return;
        }
        RCTAztecView *listView = view;
        if (block) {
            block(listView);
        }
    }];
}

RCT_EXPORT_METHOD(applyFormat:(nonnull NSNumber *)node format:(NSString *)format)
{    
    [self executeBlock:^(RCTAztecView *aztecView) {
        [aztecView applyWithFormat:format];
    } onNode:node];
}

RCT_EXPORT_METHOD(returnHTMLWithCursor:(nonnull NSNumber *)node)
{
    [self executeBlock:^(RCTAztecView *aztecView) {
        [aztecView returnHTMLWithCursor];
    } onNode:node];
}

@end
