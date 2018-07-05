#import <React/RCTViewManager.h>

@interface RCT_EXTERN_REMAP_MODULE(RCTAztecView, RCTAztecViewManager, RCTViewManager)
RCT_EXPORT_VIEW_PROPERTY(onContentSizeChange, RCTBubblingEventBlock)
@end
