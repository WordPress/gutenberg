import Aztec

struct HeadingBlockFormatHandler: BlockFormatHandler {
    let level: Header.HeaderType

    init?(block: BlockModel) {
        guard let level = HeadingBlockFormatHandler.headerLevel(from: block.tag) else {
            return nil
        }
        self.level = level
    }

    func forceTypingFormat(with block: BlockModel, textView: RCTAztecView) {
        let attributes = textView.typingAttributesSwifted
        let formatter = HeaderFormatter(headerLevel: level)
        textView.typingAttributesSwifted = formatter.apply(to: attributes, andStore: nil)
    }

    func reformatContent(with block: BlockModel, textView: RCTAztecView) {
        resetTextViewContentWithoutHTMLTags(textView)
        textView.toggleHeader(level, range: contentRange(of: textView))
    }

    private func resetTextViewContentWithoutHTMLTags(_ textView: RCTAztecView) {
        let content = textView.text ?? ""
        textView.setHTML(content) // needed to remove extra <p> tags.
    }

    private func contentRange(of textView: RCTAztecView) -> NSRange {
        return NSRange(location: 0, length: textView.text.utf16.count)
    }

    private static func headerLevel(from levelString: String) -> Header.HeaderType? {
        switch levelString {
        case "h2":
            return .h2
        case "h3":
            return .h3
        case "h4":
            return .h4
        default:
            return nil
        }
    }
}
