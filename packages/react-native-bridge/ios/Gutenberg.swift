import UIKit
import Aztec

// IMPORTANT: if you're seeing a warning with this import, keep in mind it's marked as a Swift
// bug.  I wasn't able to get any of the workarounds to work.
//
// Ref: https://bugs.swift.org/browse/SR-3801
import RNTAztecView

@objc
public class Gutenberg: NSObject {
    public static func supportedBlocks(isDev: Bool = false) -> [String] {
        guard let json = try? SourceFile.supportedBlocks.getContent() else { return [] }
        let data = Data(json.utf8)
        guard let blockSupport = try? JSONSerialization.jsonObject(with: data, options: []) as? [String : [String]] else { return [] }
        var supportedBlocks = [String]()
        supportedBlocks += blockSupport["common"] ?? []
        supportedBlocks += blockSupport["iOSOnly"] ?? []

        if isDev {
            supportedBlocks += blockSupport["devOnly"] ?? []
        }

        return supportedBlocks
    }

    private var extraModules: [RCTBridgeModule];

    public lazy var rootView: UIView = {
        let view = RCTRootView(bridge: bridge, moduleName: "gutenberg", initialProperties: initialProps)
        view.loadingView = dataSource.loadingView
        return view
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

        initialProps["postType"] = dataSource.gutenbergPostType()

        if let locale = dataSource.gutenbergLocale() {
            initialProps["locale"] = locale
        }
        
        if let translations = dataSource.gutenbergTranslations() {
            initialProps["translations"] = translations
        }

        let capabilities = dataSource.gutenbergCapabilities()
        if capabilities.isEmpty == false {
            initialProps["capabilities"] = capabilities.toJSPayload()
        }

        let editorTheme = dataSource.gutenbergEditorTheme()
        if let colors = editorTheme?.colors {
            initialProps["colors"] = colors
        }

        if let gradients = editorTheme?.gradients {
            initialProps["gradients"] = gradients
        }

        return initialProps
    }

    public init(dataSource: GutenbergBridgeDataSource, extraModules: [RCTBridgeModule] = []) {
        self.dataSource = dataSource
        self.extraModules = extraModules
        super.init()
        bridgeModule.dataSource = dataSource
        logThreshold = isPackagerRunning ? .trace : .error
    }

    public func invalidate() {
        bridge.invalidate()
    }

    public func requestHTML() {
        sendEvent(.requestGetHtml)
    }

    public func toggleHTMLMode() {
        sendEvent(.toggleHTMLMode)
    }
    
    public func setTitle(_ title: String) {
        sendEvent(.setTitle, body: ["title": title])
    }
    
    public func updateHtml(_ html: String) {
        sendEvent(.updateHtml, body: ["html": html])
    }

    public func replace(block: Block) {
        sendEvent(.replaceBlock, body: ["html": block.content, "clientId": block.id])
    }

    public func replace(blockID: String, content: String) {
        sendEvent(.replaceBlock, body: ["html": content, "clientId": blockID])
    }

    public func updateCapabilities() {
        let capabilites = dataSource.gutenbergCapabilities()
        sendEvent(.updateCapabilities, body: capabilites.toJSPayload())
    }

    private func sendEvent(_ event: RNReactNativeGutenbergBridge.EventName, body: [String: Any]? = nil) {
        bridgeModule.sendEvent(withName: event.rawValue, body: body)
    }

    public func mediaUploadUpdate(id: Int32, state: MediaUploadState, progress: Float, url: URL?, serverID: Int32?) {
        mediaUpdate(event: .mediaUpload, id: id, state: state, progress: progress, url: url, serverID: serverID)
    }

    public func updateMediaSaveStatus(id: Int32, state: MediaSaveState, progress: Float, url: URL?, serverID: Int32?) {
        mediaUpdate(event: .mediaSave, id: id, state: state, progress: progress, url: url, serverID: serverID)
    }

    public func onMediaCollectionSaveResult(firstMediaIdInCollection: String, success: Bool) {
        sendEvent(.mediaSave, body: [
            "state": MediaSaveEvent.result.rawValue,
            "firstMediaIdInCollection": firstMediaIdInCollection,
            "success": success,
        ])
    }

    public func onMediaIdChanged(oldId: String, newId: String, oldUrl: URL) {
        sendEvent(.mediaSave, body: [
            "state": MediaSaveEvent.idChange.rawValue,
            "oldId": oldId,
            "newId": newId,
            "oldUrl": oldUrl,
        ])
    }

    private func mediaUpdate<State: MediaState>(event: RNReactNativeGutenbergBridge.EventName, id: Int32, state: State, progress: Float, url: URL?, serverID: Int32?)  {
        var data: [String: Any] = ["mediaId": id, "state": state.rawValue, "progress": progress];
        if let url = url {
            data["mediaUrl"] = url.absoluteString
        }
        if let serverID = serverID {
            data["mediaServerId"] = serverID
        }
        sendEvent(event, body: data)
    }

    public func appendMedia(id: Int32, url: URL, type: MediaType) {
        let data: [String: Any] = [
            "mediaId"  : id,
            "mediaUrl" : url.absoluteString,
            "mediaType": type.rawValue,
        ]
        sendEvent(.mediaAppend, body: data)
    }

    public func setFocusOnTitle() {
        bridgeModule.sendEventIfNeeded(.setFocusOnTitle, body: nil)
    }

    private var isPackagerRunning: Bool {
        let url = sourceURL(for: bridge)
        return !(url?.isFileURL ?? true)
    }

    public func updateTheme(_ editorTheme: GutenbergEditorTheme?) {

        var themeUpdates = [String : Any]()

        if let colors = editorTheme?.colors {
            themeUpdates["colors"] = colors
        }

        if let gradients = editorTheme?.gradients {
            themeUpdates["gradients"] = gradients
        }

        bridgeModule.sendEventIfNeeded(.updateTheme, body:themeUpdates)
    }

    public func showNotice(_ message: String) {
        sendEvent(.showNotice, body: ["message": message])
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

protocol MediaState: RawRepresentable {}

extension Gutenberg {
    public enum MediaUploadState: Int, MediaState {
        case uploading = 1
        case succeeded = 2
        case failed = 3
        case reset = 4
    }

    public enum MediaSaveState: Int, MediaState {
        case saving = 5
        case succeeded = 6
        case failed = 7
        case reset = 8
    }

    enum MediaSaveEvent: Int {
        case result = 9
        case idChange = 10
    }
}

extension Gutenberg {
    public enum MediaType: String {
        case image
        case video
        case audio
        case other
        case any
    }
}

extension Gutenberg.MediaType {
    init(fromJSString rawValue: String) {
        self = Gutenberg.MediaType(rawValue: rawValue) ?? .other
    }
}

extension Gutenberg {
    public struct MediaSource: Hashable {
        /// The label string that will be shown to the user.
        let label: String

        /// A unique identifier of this media source option.
        let id: String

        /// The types of media this source can provide.
        let types: Set<MediaType>

        var jsRepresentation: [String: String] {
            return [
                "label": label,
                "value": id,
            ]
        }
    }
}

public extension Gutenberg.MediaSource {
    init(id: String, label: String, types: [Gutenberg.MediaType]) {
        self.id = id
        self.label = label
        self.types = Set(types)
    }
}

private extension Dictionary where Key == Capabilities, Value == Bool {
    func toJSPayload() -> [String: Bool] {
        Dictionary<String, Bool>(uniqueKeysWithValues: self.map { key, value in
            (key.rawValue, value)
        })
    }
}
