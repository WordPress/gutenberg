public struct MediaInfo: Encodable {
    public let id: Int32?
    public let url: String?
    public let type: String?
    public let title: String?
    public let caption: String?

    public init(id: Int32?, url: String?, type: String?, caption: String? = nil, title: String? = nil) {
        self.id = id
        self.url = url
        self.type = type
        self.caption = caption
        self.title = title
    }
}

/// Definition of capabilities to enable in the Block Editor
public enum Capabilities: String {
    case contactInfoBlock
    case layoutGridBlock
    case mediaFilesCollectionBlock
    case mentions
    case xposts
    case unsupportedBlockEditor
    case canEnableUnsupportedBlockEditor
    case isAudioBlockMediaUploadEnabled
    case reusableBlock
    case canViewEditorOnboarding
}

/// Wrapper for single block data
public struct Block {
    /// Gutenberg internal block ID
    public let id: String
    /// Gutenberg internal block name
    public let name: String
    /// User facing block name string (localized)
    public let title: String
    /// Block HTML content
    public let content: String

    /// Creates a copy of the receiver modifying only its content field.
    /// - Parameter newContent: The content for the new block instance.
    /// - Returns: A new block instance with copied fields and new content.
    public func replacingContent(with newContent: String) -> Block {
        Block(id: id, name: name, title: title, content: newContent)
    }
}

public struct ContentInfo {
    public let characterCount: Int
    public let wordCount: Int
    public let paragraphCount: Int
    public let blockCount: Int
}

extension ContentInfo {

    static func decode(from dict: [String: Int]) -> ContentInfo? {
        guard  let characters = dict["characterCount"],
            let words = dict["wordCount"],
            let paragraphs = dict["paragraphCount"],
            let blocks = dict["blockCount"] else {
                return nil
        }
        return ContentInfo(characterCount: characters, wordCount: words, paragraphCount: paragraphs, blockCount: blocks)
    }
}

public typealias MediaPickerDidPickMediaCallback = (_ media: [MediaInfo]?) -> Void
public typealias MediaImportCallback = (_ media: MediaInfo?) -> Void

/// Declare internal Media Sources.
/// Label and Type are not relevant since they are delcared on the JS side.
/// Hopefully soon, this will need to be declared on the client side.
extension Gutenberg.MediaSource {
    public static let mediaLibrary = Gutenberg.MediaSource(id: "SITE_MEDIA_LIBRARY", label: "", types: [.image, .video])
    public static let deviceLibrary = Gutenberg.MediaSource(id: "DEVICE_MEDIA_LIBRARY", label: "", types: [.image, .video])
    public static let deviceCamera = Gutenberg.MediaSource(id: "DEVICE_CAMERA", label: "", types: [.image, .video])

    static var registeredInternalSources: [Gutenberg.MediaSource] {
        return [
            .deviceCamera,
            .deviceLibrary,
            .mediaLibrary,
        ]
    }
}

/// Ref. https://github.com/facebook/react-native/blob/HEAD/Libraries/polyfills/console.js#L376
public enum LogLevel: Int {
    case trace
    case info
    case warn
    case error
    case fatal
}

// Avoid possible future problems due to log level int value changes.
extension LogLevel {
    init (_ rnLogLevel: RCTLogLevel) {
        switch rnLogLevel {
        case .trace: self = .trace
        case .info: self = .info
        case .warning: self = .warn
        case .error: self = .error
        case .fatal: self = .fatal
        @unknown default:
            assertionFailure("Unknown log level: \(rnLogLevel)")
            self = .trace
        }
    }
}

extension RCTLogLevel {
    init(_ logLevel: LogLevel) {
        switch logLevel {
        case .trace: self = .trace
        case .info: self = .info
        case .warn: self = .warning
        case .error: self = .error
        case .fatal: self = .fatal
        }
    }
}

public protocol GutenbergBridgeDelegate: class {
    /// Tells the delegate that Gutenberg had returned the requested HTML content.
    /// You can request HTML content by calling `requestHTML()` on a Gutenberg bridge instance.
    ///
    /// - Parameters:
    ///     - title: the title as shown by the editor.
    ///     - html: The current HTML presented by the editor.
    ///     - changed: True if the given HTML presents changes from the last request or initial value.
    ///     - contentInfo: Information about the post content: characters, words, paragraphs, blocks.
    func gutenbergDidProvideHTML(title: String, html: String, changed: Bool, contentInfo: ContentInfo?)

    /// Tells the delegate that an image block requested an image from the media picker.
    ///
    /// - Parameters:
    ///     - source: the source from where the picker will get the media
    ///     - callback: A callback block to be called with an array of upload mediaIdentifiers and a placeholder images file url, use nil on both parameters to signal that the action was canceled.
    ///
    func gutenbergDidRequestMedia(from source: Gutenberg.MediaSource, filter: [Gutenberg.MediaType], allowMultipleSelection: Bool, with callback: @escaping MediaPickerDidPickMediaCallback)

    /// Tells the delegate that gutenberg JS requested the import of media item based on the provided URL
    ///
    /// - Parameters:
    ///   - url: the url to import
    ///   - callback: A callback block to be called with an array of upload mediaIdentifiers and a placeholder images file url, use nil on both parameters to signal that the action has failed.
    //
    func gutenbergDidRequestImport(from url: URL, with callback: @escaping MediaImportCallback)

    /// Tells the delegate that an image block requested to reconnect with media uploads coordinator.
    ///
    func gutenbergDidRequestMediaUploadSync()

    /// Tells the delegate that an image block requested for the actions available for the media upload.
    ///
    func gutenbergDidRequestMediaUploadActionDialog(for mediaID: Int32)

    /// Tells the delegate that an image block requested for the upload cancelation.
    ///
    func gutenbergDidRequestMediaUploadCancelation(for mediaID: Int32)

    /// Tells the delegate that the Gutenberg module has finished loading.
    ///
    func gutenbergDidLoad()

    /// Tells the delegate every time the editor has finished layout.
    ///
    func gutenbergDidLayout()

    /// Tells the delegate that the editor view has completed the initial render.
    /// - Parameters:
    ///   - unsupportedBlockNames: A list of loaded block names that are not supported.
    ///
    func gutenbergDidMount(unsupportedBlockNames: [String])

    /// Tells the delegate that logger method is called.
    ///
    func gutenbergDidEmitLog(message: String, logLevel: LogLevel)

    /// Tells the delegate that the editor has sent an autosave event.
    ///
    func editorDidAutosave()

    /// Tells the delegate that the editor needs to perform a network request.
    /// The paths given to perform the request are from the WP ORG REST API.
    /// https://developer.wordpress.org/rest-api/reference/
    /// - Parameter path: The path to perform the request.
    /// - Parameter completion: Completion handler to be called with the result or an error.
    func gutenbergDidRequestFetch(path: String, completion: @escaping (Swift.Result<Any, NSError>) -> Void)

    /// Tells the delegate to display a fullscreen image from a given URL
    ///
    func gutenbergDidRequestImagePreview(with mediaUrl: URL, thumbUrl: URL?)

    /// Tells the delegate to display the media editor from a given URL
    ///
    func gutenbergDidRequestMediaEditor(with mediaUrl: URL, callback: @escaping MediaPickerDidPickMediaCallback)

    /// Tells the delegate that the editor needs to render an unsupported block
    func gutenbergDidRequestUnsupportedBlockFallback(for block: Block)

    /// Tells the delegate that the editor requested a mention
    /// - Parameter callback: Completion handler to be called with an user mention or an error
    func gutenbergDidRequestMention(callback: @escaping (Swift.Result<String, NSError>) -> Void)

	/// Tells the delegate that the editor requested a mention
	/// - Parameter callback: Completion handler to be called with an xpost or an error
	func gutenbergDidRequestXpost(callback: @escaping (Swift.Result<String, NSError>) -> Void)

    /// Tells the delegate that the editor requested to show the tooltip
    func gutenbergDidRequestFocalPointPickerTooltipShown() -> Bool

    /// Tells the delegate that the editor requested to set the tooltip's visibility
    /// - Parameter tooltipShown: Tooltip's visibility value
    func gutenbergDidRequestSetFocalPointPickerTooltipShown(_ tooltipShown: Bool)

    func gutenbergDidSendButtonPressedAction(_ buttonType: Gutenberg.ActionButtonType)

    // Media Collection

    /// Tells the delegate that a media collection block requested to reconnect with media save coordinator.
    ///
    func gutenbergDidRequestMediaSaveSync()

    func gutenbergDidRequestMediaFilesEditorLoad(_ mediaFiles: [[String: Any]], blockId: String)

    func gutenbergDidRequestMediaFilesFailedRetryDialog(_ mediaFiles: [[String: Any]])

    func gutenbergDidRequestMediaFilesUploadCancelDialog(_ mediaFiles: [[String: Any]])

    func gutenbergDidRequestMediaFilesSaveCancelDialog(_ mediaFiles: [[String: Any]])
}

// MARK: - Optional GutenbergBridgeDelegate methods

public extension GutenbergBridgeDelegate {
    func gutenbergDidLoad() { }
    func gutenbergDidLayout() { }
    func gutenbergDidRequestUnsupportedBlockFallback(for block: Block) { }
    func gutenbergDidSendButtonPressedAction(_ buttonType: Gutenberg.ActionButtonType) { }

    // Media Collection

    func gutenbergDidRequestMediaSaveSync() {}
    func gutenbergDidRequestMediaFilesEditorLoad(_ mediaFiles: [[String: Any]], blockId: String) { }
    func gutenbergDidRequestMediaFilesFailedRetryDialog(_ mediaFiles: [[String: Any]]) { }
    func gutenbergDidRequestMediaFilesUploadCancelDialog(_ mediaFiles: [[String: Any]]) { }
    func gutenbergDidRequestMediaFilesSaveCancelDialog(_ mediaFiles: [[String: Any]]) { }
    func gutenbergDidRequestMediaFilesBlockReplaceSync(_ mediaFiles: [[String: Any]], clientId: String) {}
}
