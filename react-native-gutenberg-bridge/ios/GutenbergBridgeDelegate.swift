public struct MediaInfo {
    public let id: Int32?
    public let url: String?
    public let type: String?

    public init(id: Int32?, url: String?, type: String?) {
        self.id = id
        self.url = url
        self.type = type
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

/// Ref. https://github.com/facebook/react-native/blob/master/Libraries/polyfills/console.js#L376
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
    func gutenbergDidProvideHTML(title: String, html: String, changed: Bool)

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
}

// MARK: - Optional GutenbergBridgeDelegate methods

public extension GutenbergBridgeDelegate {
    func gutenbergDidLoad() { }
    func gutenbergDidLayout() { }
}
