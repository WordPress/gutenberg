import Aztec

public protocol GutenbergBridgeDataSource: class {
    /// Asks the data source for the initial html content to be presented by the editor.
    /// Return `nil` to show the example content.
    ///
    /// - Returns: The HTML initial content or nil.
    func gutenbergInitialContent() -> String?
    
    /// Asks the data source for the initial title to be presented by the editor.
    /// Return `nil` to show the example content.
    ///
    /// - Returns: The HTML initial title or nil.
    func gutenbergInitialTitle() -> String?

    /// Asks the data source for an object conforming to `TextViewAttachmentDelegate`
    /// to handle media loading.
    ///
    /// - Returns: An object conforming to TextViewAttachmentDelegate.
    func aztecAttachmentDelegate() -> TextViewAttachmentDelegate
}
