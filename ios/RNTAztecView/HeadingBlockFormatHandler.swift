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
        let attributes = textView.typingAttributesSwifted
        let formatter = HeaderFormatter(headerLevel: level)
        textView.typingAttributesSwifted = formatter.apply(to: attributes, andStore: nil)
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
