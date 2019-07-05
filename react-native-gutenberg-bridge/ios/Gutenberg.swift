import UIKit
import Aztec

// IMPORTANT: if you're seeing a warning with this import, keep in mind it's marked as a Swift
// bug.  I wasn't able to get any of the workarounds to work.
//
// Ref: https://bugs.swift.org/browse/SR-3801
import RNTAztecView

@objc
public class Gutenberg: NSObject {

    private var extraModules: [RCTBridgeModule];

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

    public var isLoaded: Bool {
        return !bridge.isLoading
    }

    public var logThreshold: LogLevel {
        get {
            return LogLevel(RCTGetLogThreshold())
        }
        set {
            RCTSetLogThreshold(RCTLogLevel(newValue))
        }
    }

    private let bridgeModule = RNReactNativeGutenbergBridge()
    private unowned let dataSource: GutenbergBridgeDataSource

    private lazy var bridge: RCTBridge = {
        return RCTBridge(delegate: self, launchOptions: [:])
    }()

    private var initialProps: [String: Any]? {
        var initialProps = [String: Any]()
        
        if let initialContent = dataSource.gutenbergInitialContent() {
            initialProps["initialData"] = initialContent
        }
        
        if let initialTitle = dataSource.gutenbergInitialTitle() {
            initialProps["initialTitle"] = initialTitle
        }

        if let locale = dataSource.gutenbergLocale() {
            initialProps["locale"] = locale
        }
        
        if let translations = dataSource.gutenbergTranslations() {
            initialProps["translations"] = translations
        }
        
        return initialProps
    }

    public init(dataSource: GutenbergBridgeDataSource, extraModules: [RCTBridgeModule] = []) {
        self.dataSource = dataSource
        self.extraModules = extraModules
        super.init()
        logThreshold = isPackagerRunning ? .trace : .error
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
    
    public func setTitle(_ title: String) {
        bridgeModule.sendEvent(withName: EventName.setTitle, body: ["title": title])
    }
    
    public func updateHtml(_ html: String) {
        bridgeModule.sendEvent(withName: EventName.updateHtml, body: ["html": html])
    }
    
    public func mediaUploadUpdate(id: Int32, state: MediaUploadState, progress: Float, url: URL?, serverID: Int32?) {
        var data: [String: Any] = ["mediaId": id, "state": state.rawValue, "progress": progress];
        if let url = url {
            data["mediaUrl"] = url.absoluteString
        }
        if let serverID = serverID {
            data["mediaServerId"] = serverID
        }
        bridgeModule.sendEventIfNeeded(name: EventName.mediaUpload, body: data)
    }

    public func appendMedia(id: Int32, url: URL) {
        let data: [String: Any] = ["mediaId": id, "mediaUrl": url.absoluteString];
        bridgeModule.sendEventIfNeeded(name: EventName.mediaAppend, body: data)
    }

    public func setFocusOnTitle() {
        bridgeModule.sendEventIfNeeded(name: EventName.setFocusOnTitle, body: nil)
    }

    private var isPackagerRunning: Bool {
        let url = sourceURL(for: bridge)
        return !(url?.isFileURL ?? true)
    }
}

extension Gutenberg: RCTBridgeDelegate {
    public func sourceURL(for bridge: RCTBridge!) -> URL! {
        return RCTBundleURLProvider.sharedSettings()?.jsBundleURL(forBundleRoot: "index", fallbackResource: "")
    }

    public func extraModules(for bridge: RCTBridge!) -> [RCTBridgeModule]! {
        let aztecManager = RCTAztecViewManager()
        aztecManager.attachmentDelegate = dataSource.aztecAttachmentDelegate()
        let baseModules:[RCTBridgeModule] = [bridgeModule, aztecManager]
        return baseModules + extraModules
    }
}

extension Gutenberg {
    
    enum EventName {
        static let requestHTML = "requestGetHtml"
        static let setTitle = "setTitle"
        static let toggleHTMLMode = "toggleHTMLMode"
        static let updateHtml = "updateHtml"
        static let mediaUpload = "mediaUpload"
        static let setFocusOnTitle = "setFocusOnTitle"
        static let mediaAppend = "mediaAppend"
    }
    
    public enum MediaUploadState: Int {
        case uploading = 1
        case succeeded = 2
        case failed = 3
        case reset = 4
    }
    
}
