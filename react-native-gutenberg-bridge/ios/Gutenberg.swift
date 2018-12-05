import UIKit
import Aztec

// IMPORTANT: if you're seeing a warning with this import, keep in mind it's marked as a Swift
// bug.  I wasn't able to get any of the workarounds to work.
//
// Ref: https://bugs.swift.org/browse/SR-3801
import RNTAztecView

@objc
public class Gutenberg: NSObject {
    public lazy var rootView: UIView = {
        return RCTRootView(bridge: bridge, moduleName: "gutenberg", initialProperties: initialProps)
    }()

    public var delegate: GutenbergBridgeDelegate? {
        get {
            return bridgeModule.delegate
        }
        set {
            bridgeModule.delegate = newValue
        }
    }

    private let bridgeModule = RNReactNativeGutenbergBridge()
    private unowned let dataSource: GutenbergBridgeDataSource

    private lazy var bridge: RCTBridge = {
        return RCTBridge(delegate: self, launchOptions: [:])
    }()

    private var initialProps: [String: String]? {
        guard let initialContent = dataSource.gutenbergInitialContent() else {
            return nil
        }
        return ["initialData": initialContent]
    }

    public init(dataSource: GutenbergBridgeDataSource) {
        self.dataSource = dataSource
    }

    public func invalidate() {
        bridge.invalidate()
    }

    public func requestHTML() {
        bridgeModule.sendEvent(withName: EventName.requestHTML, body: nil)
    }

    public func toggleHTMLMode() {
        bridgeModule.sendEvent(withName: EventName.toggleHTMLMode, body: nil)
    }
    
    public func updateHtml(_ html: String) {
        bridgeModule.sendEvent(withName: EventName.updateHtml, body: [ "html": html ])
    }
}

extension Gutenberg: RCTBridgeDelegate {
    public func sourceURL(for bridge: RCTBridge!) -> URL! {
        return RCTBundleURLProvider.sharedSettings()?.jsBundleURL(forBundleRoot: "index", fallbackResource: "")
    }

    public func extraModules(for bridge: RCTBridge!) -> [RCTBridgeModule]! {
        let aztecManager = RCTAztecViewManager()
        aztecManager.attachmentDelegate = dataSource.aztecAttachmentDelegate()

        return [bridgeModule, aztecManager]
    }
}

extension Gutenberg {
    enum EventName {
        static let requestHTML = "requestGetHtml"
        static let toggleHTMLMode = "toggleHTMLMode"
        static let updateHtml = "updateHtml"
    }
}
