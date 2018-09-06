import Aztec
import Foundation
import UIKit

class RCTAztecView: Aztec.TextView {
    @objc var onChange: RCTBubblingEventBlock? = nil
    @objc var onEnter: RCTBubblingEventBlock? = nil
    @objc var onContentSizeChange: RCTBubblingEventBlock? = nil

    @objc var onActiveFormatsChange: RCTBubblingEventBlock? = nil
    
    private var previousContentSize: CGSize = .zero

    private lazy var placeholderLabel: UILabel = {
        let label = UILabel(frame: .zero)
        return label
    }()

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
        guard text != "\n" else {            
            onEnter?([:])
            return
        }
        
        super.insertText(text)
        updatePlaceholderVisibility()
        
        if let onChange = onChange {
            let text = packForRN(getHTML(), withName: "text")
            onChange(text)
        }
    }
    
    open override func deleteBackward() {
        super.deleteBackward()
        updatePlaceholderVisibility()
        
        if let onChange = onChange {
            let text = packForRN(getHTML(), withName: "text")
            onChange(text)
        }
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

    // MARK: Format interface

    @objc func apply(format: String) {
        switch format {
        case "bold": toggleBold(range: selectedRange)
        case "italic": toggleItalic(range: selectedRange)
        case "strikethrough": toggleStrikethrough(range: selectedRange)
        default: print("Format not recognized")
        }
        propagateFormatChanges()
    }

    func propagateFormatChanges() {
        guard let onActiveFormatsChange = onActiveFormatsChange else {
            return
        }
        let identifiers: Set<FormattingIdentifier>
        if selectedRange.length > 0 {
            identifiers = formatIdentifiersSpanningRange(selectedRange)
        } else {
            identifiers = formatIdentifiersForTypingAttributes()
        }
        let formats = identifiers.compactMap( { (identifier) -> String? in
            switch identifier {
            case .bold: return "bold"
            case .italic: return "italic"
            case .strikethrough: return "strikethrough"
            default: return nil
            }
        })
        onActiveFormatsChange(["formats": formats])
    }
}

// MARK: UITextView Delegate Methods
extension RCTAztecView: UITextViewDelegate {

    func textViewDidChangeSelection(_ textView: UITextView) {
        propagateFormatChanges()
    }

}

