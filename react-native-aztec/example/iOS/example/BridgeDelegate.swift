import Aztec
import Foundation

// IMPORTANT: if you're seeing a warning with this import, keep in mind it's marked as a Swift
// bug.  I wasn't able to get any of the workarounds to work.
//
// Ref: https://bugs.swift.org/browse/SR-3801
//
import RNTAztecView

class BridgeDelegate: NSObject, RCTBridgeDelegate {
    let sourceURL: URL
    let aztecViewManager = RCTAztecViewManager()
    
    init(sourceURL: URL) {
        self.sourceURL = sourceURL
        super.init()
    }
    
    func sourceURL(for bridge: RCTBridge!) -> URL! {
        return sourceURL
    }
    
    func extraModules(for bridge: RCTBridge!) -> [RCTBridgeModule]! {
        return [aztecViewManager]
    }
}
