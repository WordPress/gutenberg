//
//  RNTAztecView.m
//  RNTAztecView
//
//  Created by diego on 04/07/2018.
//  Copyright © 2018 Automattic Inc. All rights reserved.
//

//#import "RNTAztecView.h"
#import <React/RCTViewManager.h>

//@interface RCT_EXTERN_REMAP_MODULE(RCTAztecView, RCTAztecViewManager, RCTViewManager)
@interface RCT_EXTERN_MODULE(RCTAztecView, RCTViewManager)
//RCT_EXPORT_VIEW_PROPERTY(myText, NSString)
RCT_EXTERN_METHOD(doSomething)
@end
