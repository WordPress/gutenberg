import Aztec
import Foundation
import RNTAztecView

class BridgeDelegate: NSObject, RCTBridgeDelegate {
    
    let attachmentDelegate: Aztec.TextViewAttachmentDelegate
    
    init(attachmentDelegate: Aztec.TextViewAttachmentDelegate) {
        self.attachmentDelegate = attachmentDelegate
        
        super.init()
    }
    
    func sourceURL(for bridge: RCTBridge!) -> URL! {
        return URL(string: "http://localhost:8081/index.ios.bundle?platform=ios");
    }
    
    func extraModules(for bridge: RCTBridge!) -> [RCTBridgeModule]! {
        return [RCTAztecViewManager(attachmentDelegate: attachmentDelegate)]
    }
}
