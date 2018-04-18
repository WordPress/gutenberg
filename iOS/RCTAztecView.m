#import <UIKit/UIKit.h>
#import <React/RCTViewManager.h>

@interface RCTAztecView : RCTViewManager
@end

@implementation RCTAztecView

RCT_EXPORT_MODULE()

- (UIView *)view
{
  UIView* view = [[UIView alloc] init];

  view.backgroundColor = [UIColor blueColor];
    
    return view;
}

@end
