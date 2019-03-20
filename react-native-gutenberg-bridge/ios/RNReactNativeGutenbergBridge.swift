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
    func requestMediaPickFrom(_ source: String, callback: @escaping RCTResponseSenderBlock) {
        let mediaSource: MediaPickerSource = MediaPickerSource(rawValue: source) ?? .deviceLibrary

        DispatchQueue.main.async {
            self.delegate?.gutenbergDidRequestMedia(from: mediaSource, with: { (mediaID, url) in
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
