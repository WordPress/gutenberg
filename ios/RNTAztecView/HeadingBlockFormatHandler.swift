import Aztec

struct HeadingBlockFormatHandler: BlockFormatHandler {
    let level: Header.HeaderType

    init?(block: BlockModel) {
        guard let level = HeadingBlockFormatHandler.headerLevel(from: block.tag) else {
            return nil
        }
        self.level = level
    }

    func forceTypingFormat(on textView: RCTAztecView) {
        textView.text = ensureNonEmptyString(textView.text)
        let attributes = textView.typingAttributesSwifted
        let formatter = HeaderFormatter(headerLevel: level)
        textView.typingAttributesSwifted = formatter.apply(to: attributes, andStore: nil)
    }

    private func ensureNonEmptyString(_ content: String) -> String {
        let zeroWithSpace = String(Character.Name.zeroWidthSpace.rawValue)
        guard content.isEmpty else {
            return content.replacingOccurrences(of: zeroWithSpace, with: "")
        }
        return content.appending(zeroWithSpace)
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
