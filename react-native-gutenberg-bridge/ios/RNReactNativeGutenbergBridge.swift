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
    func requestMediaPickFrom(_ source: String, filter: [String]?, callback: @escaping RCTResponseSenderBlock) {
        let mediaSource: MediaPickerSource = MediaPickerSource(rawValue: source) ?? .deviceLibrary
        let mediaFilter: [MediaFilter]? = filter?.map({
            if let type = MediaFilter(rawValue: $0) {
                return type
            }
            return MediaFilter.other
        })
        DispatchQueue.main.async {
            self.delegate?.gutenbergDidRequestMedia(from: mediaSource, filter: mediaFilter, with: { (mediaID, url) in
                guard let mediaID = mediaID else {
                    callback(nil)
                    return
                }
                callback([mediaID, url])
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
            self.delegate?.gutenbergDidRequestImport(from: url, with: { (mediaID, url) in
                guard let url = url, let mediaID = mediaID else {
                    callback(nil)
                    return
                }
                callback([mediaID, url])
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
    func editorDidMount(_ hasUnsupportedBlocks: Bool) {
        DispatchQueue.main.async {
            self.delegate?.gutenbergDidMount(hasUnsupportedBlocks: hasUnsupportedBlocks)
        }
    }

    @objc
    func editorDidEmitLog(_ message: String, logLevel: Int) {
        guard let logLevel = LogLevel(rawValue: logLevel) else { return }
        delegate?.gutenbergDidEmitLog(message: message, logLevel: logLevel)
    }

    override public func startObserving() {
        super.startObserving()
        hasObservers = true
    }

    override public func stopObserving() {
        super.stopObserving()
        hasObservers = false
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
