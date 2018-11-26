import UIKit

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
    private let initialContent: String?

    private lazy var bridge: RCTBridge = {
        return RCTBridge(delegate: self, launchOptions: [:])
    }()

    private var initialProps: [String: String]? {
        guard let initialContent = initialContent else {
            return nil
        }
        return ["initialData": initialContent]
    }

    public init(with content: String? = nil) {
        initialContent = content
    }

    public func invalidate() {
        bridge.invalidate()
    }

    public func requestHTML() {
        bridgeModule.sendEvent(withName: EventName.requestHTML, body: nil)
    }
}

extension Gutenberg: RCTBridgeDelegate {
    public func sourceURL(for bridge: RCTBridge!) -> URL! {
        return RCTBundleURLProvider.sharedSettings()?.jsBundleURL(forBundleRoot: "index", fallbackResource: "")
    }

    public func extraModules(for bridge: RCTBridge!) -> [RCTBridgeModule]! {
        return [bridgeModule]
    }
}

extension Gutenberg {
    enum EventName {
        static let requestHTML = "requestGetHtml"
    }
}
