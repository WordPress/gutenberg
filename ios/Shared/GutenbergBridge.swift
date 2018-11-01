
import UIKit
//import React

class GutenbergBridge {
    let postManager: GBPostManager
    let mediaProvider: AztecMediaProvider

    static var shared: GutenbergBridge {
        guard let bridge = _shared else {
            fatalError("RN Bridge not initialized")
        }
        return bridge
    }

    private let rnBridge: RCTBridge
    private static var _shared: GutenbergBridge?

    static func start(with launchOptions: [AnyHashable: Any]?, mediaProvider: AztecMediaProvider, postManager: GBPostManager) {
        _shared = GutenbergBridge(options: launchOptions, mediaProvider: mediaProvider, postManager: postManager)
    }

    static func rootView(with props: [AnyHashable: Any]? = nil) -> UIView {
        return RCTRootView(bridge: shared.rnBridge, moduleName: "gutenberg", initialProperties: props)
    }

    private init(options launchOptions: [AnyHashable: Any]?, mediaProvider: AztecMediaProvider, postManager: GBPostManager) {
        let sourceURL = RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index", fallbackResource: nil)!
        let bDelegate =  BridgeDelegate(sourceURL: sourceURL, mediaProvider: mediaProvider, postManager: postManager)

        self.postManager = postManager
        self.mediaProvider = mediaProvider

        rnBridge = RCTBridge(delegate: bDelegate, launchOptions: launchOptions)
    }
}
