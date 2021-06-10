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

    /// Asks the data source for the post type to be presented by the editor.
    /// Return `nil` to assume a `post` type.
    ///
    /// - Returns: The post type or nil.
    func gutenbergPostType() -> String

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
    func gutenbergEditorTheme() -> GutenbergEditorTheme?

    /// Asks the data source for a view to show while the Editor is loading.
     var loadingView: UIView? { get }
    
    /// Asks the data source for the Sentry SDK options to initialize the SDK in the React native side.
    ///
    /// - Returns: Sentry SDK options.
    func getSentryOptions() -> [String: Any]?
    
    /// Asks the data source for the current Sentry scope and includes it to an event.
    ///
    /// - Returns: Event object with attached scope.
    func attachScopeToSentryEvent(_ event: [String: Any]) -> [String: Any]?
    
    /// Asks the data source to know if the app should send Sentry events depending on user preferences.
    ///
    /// - Returns: True if Sentry events can be sent.
    func shouldSendSentryEvent() -> Bool?
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

public protocol GutenbergEditorTheme {
    var colors: [[String: String]]? { get }
    var gradients: [[String: String]]? { get }
}
