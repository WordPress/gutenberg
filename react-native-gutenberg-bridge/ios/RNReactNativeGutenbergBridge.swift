@objc (RNReactNativeGutenbergBridge)
public class RNReactNativeGutenbergBridge: RCTEventEmitter {
    weak var delegate: GutenbergBridgeDelegate?
    private var isJSLoading = true

    // MARK: - Messaging methods

    @objc
    func provideToNative_Html(_ html: String, title: String, changed: Bool) {
        DispatchQueue.main.async {
            self.delegate?.gutenbergDidProvideHTML(title: title, html: html, changed: changed)
        }
    }

    @objc
    func onMediaLibraryPressed(_ callback: @escaping RCTResponseSenderBlock) {
        DispatchQueue.main.async {
            self.delegate?.gutenbergDidRequestMedia(from: .mediaLibrary, with: { (mediaID, url) in
                guard let url = url, let mediaID = mediaID else {
                    callback(nil)
                    return
                }
                callback([mediaID, url])
            })
        }
    }
    
    @objc
    func onMediaUploadPressed(_ callback: @escaping RCTResponseSenderBlock) {
        DispatchQueue.main.async {
            self.delegate?.gutenbergDidRequestMedia(from: .deviceLibrary, with: { (mediaID, url) in
                guard let url = url, let mediaID = mediaID else {
                    callback(nil)
                    return
                }
                callback([mediaID, url])
            })
        }
    }

    @objc
    func onMediaCapturePressed(_ callback: @escaping RCTResponseSenderBlock) {
        DispatchQueue.main.async {
            self.delegate?.gutenbergDidRequestMedia(from: .deviceCamera, with: { (mediaID, url) in
                guard let url = url, let mediaID = mediaID else {
                    callback(nil)
                    return
                }
                callback([mediaID, url])
            })
        }
    }

    @objc
    func mediaUploadResync() {
        DispatchQueue.main.async {
            self.delegate?.gutenbergDidRequestMediaUploadSync()
        }
    }

    @objc
    func editorDidLayout() {
        DispatchQueue.main.async {
            self.delegate?.gutenbergDidLayout()
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
            Gutenberg.EventName.mediaUpload
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
