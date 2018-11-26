public typealias MediaPickerDidPickMediaCallback = (String?) -> Void

public protocol GutenbergBridgeDelegate: class {
    func gutenbergDidProvideHTML(_ html: String, changed: Bool)
    func gutenbergDidRequestMediaPicker(with callback: MediaPickerDidPickMediaCallback)
}

@objc (RNReactNativeGutenbergBridge)
public class RNReactNativeGutenbergBridge: RCTEventEmitter {
    weak var delegate: GutenbergBridgeDelegate?

    public override func supportedEvents() -> [String]! {
        return [Gutenberg.EventName.requestHTML]
    }

    @objc
    func provideToNative_HTML(_ html: String, changed: Bool) {
        delegate?.gutenbergDidProvideHTML(html, changed: changed)
    }

    @objc
    func onMediaLibraryPress(_ callback: RCTResponseSenderBlock) {
        delegate?.gutenbergDidRequestMediaPicker(with: { (url) in
            guard let url = url else {
                callback(nil)
                return
            }

            callback([url])
        })
    }
}
