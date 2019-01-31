import Aztec
import Foundation
import UIKit

class RCTAztecView: Aztec.TextView {
    @objc var onBackspace: RCTBubblingEventBlock? = nil
    @objc var onChange: RCTBubblingEventBlock? = nil
    @objc var onEnter: RCTBubblingEventBlock? = nil
    @objc var onFocus: RCTBubblingEventBlock? = nil
    @objc var onBlur: RCTBubblingEventBlock? = nil
    @objc var onContentSizeChange: RCTBubblingEventBlock? = nil
    @objc var onSelectionChange: RCTBubblingEventBlock? = nil
    @objc var blockType: NSDictionary? = nil {
        didSet {
            guard let block = blockType, let tag = block["tag"] as? String else {
                return
            }
            blockModel = BlockModel(tag: tag)
        }
    }
    @objc var activeFormats: NSSet? = nil {
        didSet {
            let currentTypingAttributes = formattingIdentifiersForTypingAttributes()
            for (key, value) in formatStringMap where currentTypingAttributes.contains(key) != activeFormats?.contains(value) {
                toggleFormat(format: value)
            }
        }
    }

    var blockModel = BlockModel(tag: "") {
        didSet {
            forceTypingAttributesIfNeeded()
        }
    }

    private var previousContentSize: CGSize = .zero

    private lazy var placeholderLabel: UILabel = {
        let label = UILabel(frame: .zero)
        return label
    }()

    private let formatStringMap: [FormattingIdentifier: String] = [
        .bold: "bold",
        .italic: "italic",
        .strikethrough: "strikethrough",
        .link: "link",
    ]

    override init(defaultFont: UIFont, defaultParagraphStyle: ParagraphStyle, defaultMissingImage: UIImage) {
        super.init(defaultFont: defaultFont, defaultParagraphStyle: defaultParagraphStyle, defaultMissingImage: defaultMissingImage)
        commonInit()
    }

    required init?(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
        commonInit()
    }

    func commonInit() {
        delegate = self
        addSubview(placeholderLabel)
        placeholderLabel.textAlignment = .natural
        placeholderLabel.translatesAutoresizingMaskIntoConstraints = false
        placeholderLabel.font = font
        NSLayoutConstraint.activate([
            placeholderLabel.leadingAnchor.constraint(equalTo: leadingAnchor, constant: contentInset.left + textContainerInset.left + textContainer.lineFragmentPadding),
            placeholderLabel.topAnchor.constraint(equalTo: topAnchor, constant: contentInset.top + textContainerInset.top)
            ])
    }

    // MARK - View Height: Match to content height
    
    override func layoutSubviews() {
        super.layoutSubviews()
        updateContentSizeInRN()
    }

    func updateContentSizeInRN() {
        let newSize = sizeThatFits(frame.size)
        
        guard previousContentSize != newSize,
            let onContentSizeChange = onContentSizeChange else {
                return
        }
        
        previousContentSize = newSize
        
        let body = packForRN(newSize, withName: "contentSize")
        onContentSizeChange(body)
    }
    
    // MARK: - Edits
    
    open override func insertText(_ text: String) {
        guard !interceptEnter(text) else {
            return
        }

        super.insertText(text)
        updatePlaceholderVisibility()
    }
    
    open override func deleteBackward() {
        guard !interceptBackspace() else {
            return
        }
        
        super.deleteBackward()
        updatePlaceholderVisibility()
    }
    
    // MARK: - Custom Edit Intercepts
    
    private func interceptEnter(_ text: String) -> Bool {
        guard text == "\n",
            let onEnter = onEnter else {
                return false
        }
        
        let caretData = packCaretDataForRN()
        onEnter(caretData)
        return true
    }
    
    private func interceptBackspace() -> Bool {
        guard selectedRange.location == 0 && selectedRange.length == 0,
            let onBackspace = onBackspace else {
                return false
        }
        
        let caretData = packCaretDataForRN()
        onBackspace(caretData)
        return true
    }
    
    // MARK: - Native-to-RN Value Packing Logic
    
    func packForRN(_ text: String, withName name: String) -> [AnyHashable: Any] {
        return [name: text,
                "eventCount": 1]
    }
    
    func packForRN(_ size: CGSize, withName name: String) -> [AnyHashable: Any] {
        
        let size = ["width": size.width,
                    "height": size.height]
        
        return [name: size]
    }
    
    func packCaretDataForRN() -> [AnyHashable: Any] {
        var start = selectedRange.location
        var end = selectedRange.location + selectedRange.length
        if selectionAffinity == .backward {
            (start, end) = (end, start)
        }
        
        var result: [String : Any] = [
            "text": getHTML(),
            "selectionStart": start,
            "selectionEnd": end
        ]
        
        if let selectedTextRange = selectedTextRange {
            let caretEndRect = caretRect(for: selectedTextRange.end)
            result["selectionEndCaretX"] = caretEndRect.origin.x
            result["selectionEndCaretY"] = caretEndRect.origin.y
        }

        return result
    }

    // MARK: - RN Properties
    
    @objc
    func setContents(_ contents: NSDictionary) {
        guard contents["eventCount"] == nil else {
            return
        }
        
        let html = contents["text"] as? String ?? ""

        setHTML(html)
        updatePlaceholderVisibility()
    }

    // MARK: - Placeholder

    @objc var placeholder: String {
        set {
            placeholderLabel.text = newValue
        }

        get {
            return placeholderLabel.text ?? ""
        }
    }

    @objc var placeholderTextColor: UIColor {
        set {
            placeholderLabel.textColor = newValue
        }
        get {
            return placeholderLabel.textColor
        }
    }

    func updatePlaceholderVisibility() {
        placeholderLabel.isHidden = !self.text.isEmpty
    }

    // MARK: - Formatting interface

    @objc func toggleFormat(format: String) {
        let emptyRange = NSRange(location: selectedRange.location, length: 0)
        switch format {
        case "bold": toggleBold(range: emptyRange)
        case "italic": toggleItalic(range: emptyRange)
        case "strikethrough": toggleStrikethrough(range: emptyRange)
        default: print("Format not recognized")
        }
    }

    func forceTypingAttributesIfNeeded() {
        if let formatHandler = HeadingBlockFormatHandler(block: blockModel) {
            formatHandler.forceTypingFormat(on: self)
        }
    }
    
    // MARK: - Event Propagation
    
    func propagateContentChanges() {
        if let onChange = onChange {
            let text = packForRN(getHTML(), withName: "text")
            onChange(text)
        }
    }

    func propagateSelectionChanges() {
        guard let onSelectionChange = onSelectionChange else {
            return
        }
        let caretData = packCaretDataForRN()
        onSelectionChange(caretData)
    }
}

// MARK: UITextView Delegate Methods
extension RCTAztecView: UITextViewDelegate {

    func textViewDidChangeSelection(_ textView: UITextView) {
        propagateSelectionChanges()
    }

    func textViewDidChange(_ textView: UITextView) {
        forceTypingAttributesIfNeeded()
        propagateContentChanges()
        //Necessary to send height information to JS after pasting text.
        textView.setNeedsLayout()
    }

    func textViewDidBeginEditing(_ textView: UITextView) {
        onFocus?([:])
    }

    func textViewDidEndEditing(_ textView: UITextView) {
        onBlur?([:])
    }
}
