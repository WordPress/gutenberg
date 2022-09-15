import Foundation

public struct SourceFile {
    enum SourceFileError: Error {
        case sourceFileNotFound(String)
    }

    public enum Extension: String {
        case css
        case js
        case json
    }
    private let name: String
    private let type: Extension
    private let bundle: Bundle

    public init(name: String, type: Extension, bundle: Bundle = Bundle(for: Gutenberg.self)) {
        self.name = name
        self.type = type
        self.bundle = bundle
    }

    public func getContent() throws -> String {
        guard let path = bundle.path(forResource: name, ofType: type.rawValue) else {
            throw SourceFileError.sourceFileNotFound("\(name).\(type)")
        }
        return try String(contentsOfFile: path, encoding: .utf8)
    }
}

extension SourceFile {
    public func jsScript(with argument: String? = nil) throws -> WKUserScript {
        let content = try getContent()
        let formatted = String(format: content, argument ?? [])
        
        switch self.type {
        case .css:
            let injectCssScriptTemplate = "window.injectCss(`%@`)"
            return String(format: injectCssScriptTemplate, formatted).toJsScript()
        case .js, .json:
            return formatted.toJsScript()
        }
    }
}

extension SourceFile {
    static let editorStyle = SourceFile(name: "editor-style-overrides", type: .css)
    static let wpBarsStyle = SourceFile(name: "wp-bar-override", type: .css)
    static let injectCss = SourceFile(name: "inject-css", type: .js)
    static let retrieveHtml = SourceFile(name: "content-functions", type: .js)
    static let insertBlock = SourceFile(name: "insert-block", type: .js)
    static let localStorage  = SourceFile(name: "local-storage-overrides", type: .json)
    static let preventAutosaves = SourceFile(name: "prevent-autosaves", type: .js)
    static let gutenbergObserver = SourceFile(name: "gutenberg-observer", type: .js)
    static let supportedBlocks = SourceFile(name: "supported-blocks", type: .json)
}
