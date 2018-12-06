@objc (RNReactNativeGutenbergBridge)
public class RNReactNativeGutenbergBridge: RCTEventEmitter {
    weak var delegate: GutenbergBridgeDelegate?

    // MARK: - Messaging methods

    @objc
    func provideToNative_Html(_ html: String, changed: Bool) {
        DispatchQueue.main.async {
            self.delegate?.gutenbergDidProvideHTML(html, changed: changed)
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
}

// MARK: - RCTBridgeModule delegate

extension RNReactNativeGutenbergBridge {
    public override func supportedEvents() -> [String]! {
        return [
            Gutenberg.EventName.requestHTML,
            Gutenberg.EventName.toggleHTMLMode,
            Gutenberg.EventName.updateHtml
        ]
    }

    public override static func requiresMainQueueSetup() -> Bool {
        return true
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
