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

    /// Asks the data source for the initial featured image id to be presented by the editor.
    ///
    /// - Returns: The initial id of the post's featured image, zero if no featured image is set.
    func gutenbergFeaturedImageId() -> NSNumber?

    /// Asks the data source for the post type to be presented by the editor.
    /// Return `nil` to assume a `post` type.
    ///
    /// - Returns: The post type or nil.
    func gutenbergPostType() -> String

    /// Asks the data source for the host app's namespace.
    ///
    /// - Returns: The host app's namespace e.g. WordPress.
    func gutenbergHostAppNamespace() -> String

    /// Asks the data source for an object conforming to `TextViewAttachmentDelegate`
    /// to handle media loading.
    ///
    /// - Returns: An object conforming to TextViewAttachmentDelegate.
    func aztecAttachmentDelegate() -> TextViewAttachmentDelegate

    /// Asks the data source for the locale to be used by the editor.
    /// Return `nil` to show the default one (`en`).
    ///
    /// - Returns: The locale slug value or nil.
    func gutenbergLocale() -> String?
    
    /// Asks the data source for the list of localized strings to be used by the editor.
    /// Return `nil` if no localization file is present for the current locale
    ///
    /// - Returns: Gutenberg related localization key value pairs for the current locale.
    func gutenbergTranslations() -> [String : [String]]?

    /// Asks the data source for a list of Media Sources to show on the Media Source Picker.
    func gutenbergMediaSources() -> [Gutenberg.MediaSource]

    /// Ask the data source what capabilities should be enabled.
    /// Implement this method to enable one or more capabilities.
    /// Defaults are not enabled.
    func gutenbergCapabilities() -> [Capabilities: Bool]

    /// Asks the data source for a list of theme colors.
    func gutenbergEditorSettings() -> GutenbergEditorSettings?

    /// Asks the data source for a view to show while the Editor is loading.
     var loadingView: UIView? { get }
}

public extension GutenbergBridgeDataSource {
    func gutenbergMediaSources() -> [Gutenberg.MediaSource] {
        return []
    }

    func gutenbergPostType() -> String {
        return "post"
    }

    var loadingView: UIView? {
         return nil
     }

    func gutenbergCapabilities() -> [Capabilities: Bool] {
        return [:]
    }
}

public protocol GutenbergEditorSettings {
    var isFSETheme: Bool { get }
    var galleryWithImageBlocks: Bool { get }
    var quoteBlockV2: Bool { get }
    var listBlockV2: Bool { get }
    var rawStyles: String? { get }
    var rawFeatures: String? { get }
    var colors: [[String: String]]? { get }
    var gradients: [[String: String]]? { get }
}
