import Aztec

public protocol GutenbergBridgeDataSource: class {
    func gutenbergInitialContent() -> String?
    func aztecAttachmentDelegate() -> TextViewAttachmentDelegate
}
