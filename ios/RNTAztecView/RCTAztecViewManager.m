#import "RCTAztecViewManager.h"
#import "RNTAztecView-Swift.h"
#import <React/RCTViewManager.h>

@implementation RCTAztecViewManager (RCTExternModule)
RCT_EXPORT_MODULE(RCTAztecView)

RCT_REMAP_VIEW_PROPERTY(text, contents, NSDictionary)
RCT_EXPORT_VIEW_PROPERTY(onContentSizeChange, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onChange, RCTBubblingEventBlock)

@end
