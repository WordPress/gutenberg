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
    func onMediaLibraryPress(_ callback: @escaping RCTResponseSenderBlock) {
        DispatchQueue.main.async {
            self.delegate?.gutenbergDidRequestMediaPicker(with: { (url) in
                callback(self.optionalArray(from: url))
            })
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
            Gutenberg.EventName.updateHtml
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
