#import <React/RCTViewManager.h>

@interface RCT_EXTERN_REMAP_MODULE(RCTAztecView, RCTAztecViewManager, RCTViewManager)
//RCT_REMAP_VIEW_PROPERTY(text, contents, NSString)
RCT_EXPORT_VIEW_PROPERTY(onContentSizeChange, RCTBubblingEventBlock)
@end
