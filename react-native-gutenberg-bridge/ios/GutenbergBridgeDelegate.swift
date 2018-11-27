public typealias MediaPickerDidPickMediaCallback = (String?) -> Void

public protocol GutenbergBridgeDelegate: class {
    func gutenbergDidProvideHTML(_ html: String, changed: Bool)
    func gutenbergDidRequestMediaPicker(with callback: MediaPickerDidPickMediaCallback)
}
