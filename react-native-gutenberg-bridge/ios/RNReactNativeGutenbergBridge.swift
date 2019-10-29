@objc (RNReactNativeGutenbergBridge)
public class RNReactNativeGutenbergBridge: RCTEventEmitter {
    weak var delegate: GutenbergBridgeDelegate?
    private var isJSLoading = true
    private var hasObservers = false
    // MARK: - Messaging methods

    @objc
    func provideToNative_Html(_ html: String, title: String, changed: Bool) {
        DispatchQueue.main.async {
            self.delegate?.gutenbergDidProvideHTML(title: title, html: html, changed: changed)
        }
    }
    
    @objc
    func requestMediaPickFrom(_ source: String, filter: [String]?, allowMultipleSelection: Bool, callback: @escaping RCTResponseSenderBlock) {
        let mediaSource: MediaPickerSource = MediaPickerSource(rawValue: source) ?? .deviceLibrary
        let mediaFilter: [MediaFilter]? = filter?.map({
            if let type = MediaFilter(rawValue: $0) {
                return type
            }
            return MediaFilter.other
        })
        DispatchQueue.main.async {
            self.delegate?.gutenbergDidRequestMedia(from: mediaSource, filter: mediaFilter, allowMultipleSelection: allowMultipleSelection, with: { media in
                guard let media = media else {
                    callback(nil)
                    return
                }
                let mediaToReturn: [MediaInfo]
                if allowMultipleSelection {
                    mediaToReturn = media
                } else {
                    mediaToReturn = Array(media.prefix(1))
                }

                let jsFormattedMedia = mediaToReturn.map { mediaInfo in
                    return mediaInfo.encodeForJS()
                }
                if allowMultipleSelection {
                    callback([jsFormattedMedia])
                } else {
                    callback(jsFormattedMedia)
                }
            })
        }
    }

    @objc
    func requestMediaImport(_ urlString: String, callback: @escaping RCTResponseSenderBlock) {
        guard let url = URL(string: urlString) else {
            callback(nil)
            return
        }
        DispatchQueue.main.async {
            self.delegate?.gutenbergDidRequestImport(from: url, with: { mediaInfo in
                guard let mediaInfo = mediaInfo else {
                    callback(nil)
                    return
                }                
                callback([mediaInfo.id as Any, mediaInfo.url as Any])
            })
        }
    }

    @objc
    func mediaUploadSync() {
        DispatchQueue.main.async {
            self.delegate?.gutenbergDidRequestMediaUploadSync()
        }
    }

    @objc
    func requestImageFailedRetryDialog(_ mediaID: Int32) {
        DispatchQueue.main.async {
            self.delegate?.gutenbergDidRequestMediaUploadActionDialog(for: mediaID)
        }
    }

    @objc
    func requestImageUploadCancelDialog(_ mediaID: Int32) {
        DispatchQueue.main.async {
            self.delegate?.gutenbergDidRequestMediaUploadActionDialog(for: mediaID)
        }
    }

    @objc
    func requestImageUploadCancel(_ mediaID: Int32) {
        DispatchQueue.main.async {
            self.delegate?.gutenbergDidRequestMediaUploadCancelation(for: mediaID)
        }
    }

    @objc
    func editorDidLayout() {
        DispatchQueue.main.async {
            self.delegate?.gutenbergDidLayout()
        }
    }

    @objc
    func editorDidMount(_ unsupportedBlockNames: [AnyObject]) {
        let unsupportedNames = unsupportedBlockNames.compactMap { $0 as? String }
        DispatchQueue.main.async {
            self.delegate?.gutenbergDidMount(unsupportedBlockNames: unsupportedNames)
        }
    }

    @objc
    func editorDidEmitLog(_ message: String, logLevel: Int) {
        guard
            shouldLog(with: logLevel),
            let logLevel = LogLevel(rawValue: logLevel)
        else {
            return
        }

        delegate?.gutenbergDidEmitLog(message: message, logLevel: logLevel)
    }

    private func shouldLog(with level: Int) -> Bool {
        return level >= RCTGetLogThreshold().rawValue
    }

    override public func startObserving() {
        super.startObserving()
        hasObservers = true
    }

    override public func stopObserving() {
        super.stopObserving()
        hasObservers = false
    }

    @objc
    func editorDidAutosave() {
        DispatchQueue.main.async {
            self.delegate?.editorDidAutosave()
        }
    }


    /// Sends events to the JS side only if there is observers listening
    ///
    /// - Parameters:
    ///   - name: name of the event
    ///   - body: data for the event
    public func sendEventIfNeeded(name: String, body: Any!) {
        if ( hasObservers ) {
            self.sendEvent(withName: name, body: body)
        }
    }
}

// MARK: - RCTBridgeModule delegate

extension RNReactNativeGutenbergBridge {
    public override func supportedEvents() -> [String]! {
        return [
            Gutenberg.EventName.requestHTML,
            Gutenberg.EventName.toggleHTMLMode,
            Gutenberg.EventName.setTitle,
            Gutenberg.EventName.updateHtml,
            Gutenberg.EventName.mediaUpload,
            Gutenberg.EventName.setFocusOnTitle,
            Gutenberg.EventName.mediaAppend
        ]
    }

    public override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    public override func batchDidComplete() {
        if isJSLoading {
            isJSLoading = false
            DispatchQueue.main.async {
                self.delegate?.gutenbergDidLoad()
            }
        }
    }
}

// MARK: - Helpers

extension RNReactNativeGutenbergBridge {
    
    func optionalArray(from optionalString: String?) -> [String]? {
        guard let string = optionalString else {
            return nil
        }
        return [string]
    }
}

extension RNReactNativeGutenbergBridge {
    enum mediaDictKeys {
        static let IDKey = "id"
        static let URLKey = "url"
        static let TypeKey = "type"
    }
}

extension MediaInfo {

    func encodeForJS() -> [String: Any] {
        return [
            RNReactNativeGutenbergBridge.mediaDictKeys.IDKey: id as Any,
            RNReactNativeGutenbergBridge.mediaDictKeys.URLKey: url as Any,
            RNReactNativeGutenbergBridge.mediaDictKeys.TypeKey: type as Any
        ]
    }
}
