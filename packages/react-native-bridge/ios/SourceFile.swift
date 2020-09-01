import Foundation

internal struct SourceFile {
    enum SourceFileError: Error {
        case sourceFileNotFound(String)
    }

    enum Extension: String {
        case css
        case js
        case json
    }
    private let name: String
    private let type: Extension
    private static let bundle = Bundle(for: Gutenberg.self)

    func getContent() throws -> String {
        guard let path = SourceFile.bundle.path(forResource: name, ofType: type.rawValue) else {
            throw SourceFileError.sourceFileNotFound("\(name).\(type)")
        }
        return try String(contentsOfFile: path, encoding: .utf8)
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
    static let supportedBlocks = SourceFile(name: "supported-blocks", type: .json)
}
