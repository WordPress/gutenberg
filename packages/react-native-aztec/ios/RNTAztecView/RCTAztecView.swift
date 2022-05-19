import Aztec
import CoreServices
import Foundation
import UIKit

class RCTAztecView: Aztec.TextView {
    @objc var onBackspace: RCTBubblingEventBlock? = nil
    @objc var onChange: RCTBubblingEventBlock? = nil
    @objc var onKeyDown: RCTBubblingEventBlock? = nil
    @objc var onEnter: RCTBubblingEventBlock? = nil
    @objc var onFocus: RCTBubblingEventBlock? = nil
    @objc var onBlur: RCTBubblingEventBlock? = nil
    @objc var onPaste: RCTBubblingEventBlock? = nil
    @objc var onContentSizeChange: RCTBubblingEventBlock? = nil
    @objc var onSelectionChange: RCTBubblingEventBlock? = nil
    @objc var minWidth: CGFloat = 0
    @objc var maxWidth: CGFloat = 0
    @objc var triggerKeyCodes: NSArray?

    @objc var activeFormats: NSSet? = nil {
        didSet {
            let currentTypingAttributes = formattingIdentifiersForTypingAttributes()
            for (key, value) in formatStringMap where currentTypingAttributes.contains(key) != activeFormats?.contains(value) {
                toggleFormat(format: value)
            }
        }
    }
    @objc var disableEditingMenu: Bool = false {
        didSet {
            allowsEditingTextAttributes = !disableEditingMenu
        }
    }

    override var textAlignment: NSTextAlignment {
        set {
            super.textAlignment = newValue
            defaultParagraphStyle.alignment = newValue
            placeholderLabel.textAlignment = newValue
        }

        get {
            return super.textAlignment
        }
    }

    private var previousContentSize: CGSize = .zero

    var leftTextInset: CGFloat {
        return contentInset.left + textContainerInset.left + textContainer.lineFragmentPadding
    }

    var leftTextInsetInRTLLayout: CGFloat {
        return bounds.width - leftTextInset
    }

    var hasRTLLayout: Bool {
        return reactLayoutDirection == .rightToLeft
    }

    private(set) lazy var placeholderLabel: UILabel = {
        let label = UILabel(frame: .zero)
        label.translatesAutoresizingMaskIntoConstraints = false
        label.textAlignment = .natural
        label.font = font

        return label
    }()

    // RCTScrollViews are flipped horizontally on RTL. This messes up competelly horizontal layout contraints
    // on views inserted after the transformation.
    var placeholderPreferedHorizontalAnchor: NSLayoutXAxisAnchor {
        return hasRTLLayout ? placeholderLabel.rightAnchor : placeholderLabel.leftAnchor
    }

    // This constraint is created from the prefered horizontal anchor (analog to "leading")
    // but appending it always to left of its super view (Aztec).
    // This partially fixes the position issue originated from fliping the scroll view.
    // fixLabelPositionForRTLLayout() fixes the rest.
    private lazy var placeholderHorizontalConstraint: NSLayoutConstraint = {
        return placeholderPreferedHorizontalAnchor.constraint(
            equalTo: leftAnchor,
            constant: leftTextInset
        )
    }()

    private lazy var placeholderWidthConstraint: NSLayoutConstraint = {
        // width needs to be shrunk on both the left and the right by the textInset in order for
        // the placeholder to be appropriately positioned with right alignment.
        let placeholderWidthInset = 2 * leftTextInset
        return placeholderLabel.widthAnchor.constraint(equalTo: widthAnchor, constant: -placeholderWidthInset)
    }()

    /// If a dictation start with an empty UITextView,
    /// the dictation engine refreshes the TextView with an empty string when the dictation finishes.
    /// This helps to avoid propagating that unwanted empty string to RN. (Solving #606)
    /// on `textViewDidChange` and `textViewDidChangeSelection`
    private var isInsertingDictationResult = false

    // MARK: - Font

    /// Flag to enable using the defaultFont in Aztec for specific blocks
    /// Like the Preformatted and Heading blocks.
    private var blockUseDefaultFont: Bool = false

    /// Font family for all contents  Once this is set, it will always override the font family for all of its
    /// contents, regardless of what HTML is provided to Aztec.
    private var fontFamily: String? = nil

    /// Font size for all contents.  Once this is set, it will always override the font size for all of its
    /// contents, regardless of what HTML is provided to Aztec.
    private var fontSize: CGFloat? = nil

    /// Font weight for all contents.  Once this is set, it will always override the font weight for all of its
    /// contents, regardless of what HTML is provided to Aztec.
    private var fontWeight: String? = nil
    
    /// Line height for all contents.  Once this is set, it will always override the font size for all of its
    /// contents, regardless of what HTML is provided to Aztec.
    private var lineHeight: CGFloat? = nil

    // MARK: - Formats

    private let formatStringMap: [FormattingIdentifier: String] = [
        .bold: "bold",
        .italic: "italic",
        .strikethrough: "strikethrough",
        .link: "link",
        .mark: "mark"
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
        Configuration.headersWithBoldTrait = true
        delegate = self
        textContainerInset = .zero
        contentInset = .zero
        textContainer.lineFragmentPadding = 0
        frame.size = .zero
        addPlaceholder()
        textDragInteraction?.isEnabled = false
        storage.htmlConverter.characterToReplaceLastEmptyLine = Character(.zeroWidthSpace)
        storage.htmlConverter.shouldCollapseSpaces = false
        shouldNotifyOfNonUserChanges = false
        // Typing attributes are controlled by RichText component so we have to prevent Aztec to recalculate them when deleting backward.
        shouldRecalculateTypingAttributesOnDeleteBackward = false
        disableLinkTapRecognizer()
        preBackgroundColor = .clear
    }

    func addPlaceholder() {
        addSubview(placeholderLabel)
        let topConstant = contentInset.top + textContainerInset.top
        NSLayoutConstraint.activate([
            placeholderHorizontalConstraint,
            placeholderWidthConstraint,
            placeholderLabel.topAnchor.constraint(equalTo: topAnchor, constant: topConstant)
        ])
    }

    /**
     This handles a bug introduced by iOS 13.0 (tested up to 13.2) where link interactions don't respect what the documentation says.

     The documenatation for textView(_:shouldInteractWith:in:interaction:) says:

     > Links in text views are interactive only if the text view is selectable but noneditable.

     Our Aztec Text views are selectable and editable, and yet iOS was opening links on Safari when tapped.
     */
    func disableLinkTapRecognizer() {
        guard let recognizer = gestureRecognizers?.first(where: { $0.name == "UITextInteractionNameLinkTap" }) else {
            return
        }
        recognizer.isEnabled = false
    }

    // MARK: - View height and width: Match to the content

    override func layoutSubviews() {
        super.layoutSubviews()
        adjustWidth()
        fixLabelPositionForRTLLayout()
        updateContentSizeInRN()
    }

    private func adjustWidth() {
        if (maxWidth > 0 && minWidth > 0) {
            let maxSize = CGSize(width: maxWidth, height: CGFloat.greatestFiniteMagnitude)
            let newWidth = sizeThatFits(maxSize).width
            if (newWidth != frame.size.width) {
                frame.size.width = max(newWidth, minWidth)
            }
        }
    }

    private func fixLabelPositionForRTLLayout() {
        if hasRTLLayout {
            // RCTScrollViews are flipped horizontally on RTL layout.
            // This fixes the position of the label after "fixing" (partially) the constraints.
            placeholderHorizontalConstraint.constant = leftTextInsetInRTLLayout
        }
    }

    override func sizeThatFits(_ size: CGSize) -> CGSize {
        // Set the Placeholder height as the minimum TextView height.
        let minimumHeight = placeholderLabel.frame.height
        let fittingSize = super.sizeThatFits(size)
        let height = max(fittingSize.height, minimumHeight)
        return CGSize(width: fittingSize.width, height: height)
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

    // MARK: - Paste handling
    private func read(from pasteboard: UIPasteboard, uti: CFString, documentType: DocumentType) -> String? {
        guard let data = pasteboard.data(forPasteboardType: uti as String),
            let attributedString = try? NSAttributedString(data: data, options: [.documentType: documentType], documentAttributes: nil),
            let storage = self.textStorage as? TextStorage else {
                return nil
        }
        return  storage.getHTML(from: attributedString)
    }

    private func readHTML(from pasteboard: UIPasteboard) -> String? {

        if let data = pasteboard.data(forPasteboardType: kUTTypeHTML as String), let html = String(data: data, encoding: .utf8) {
            // Make sure we are not getting a full HTML DOC. We only want inner content
            if !html.hasPrefix("<!DOCTYPE html") {
                return html
            }
        }

        if let flatRTFDString = read(from: pasteboard, uti: kUTTypeFlatRTFD, documentType: DocumentType.rtfd) {
            return  flatRTFDString
        }

        if let rtfString = read(from: pasteboard, uti: kUTTypeRTF, documentType: DocumentType.rtf) {
            return  rtfString
        }

        if let rtfdString = read(from: pasteboard, uti: kUTTypeRTFD, documentType: DocumentType.rtfd) {
            return  rtfdString
        }

        return nil
    }

    private func readText(from pasteboard: UIPasteboard) -> String? {
        var text = pasteboard.string
        // Text that comes from Aztec will have paragraphSeparator instead of line feed AKA as \n. The paste methods in GB are expecting \n so this line will fix that.
        text = text?.replacingOccurrences(of: String(.paragraphSeparator), with: String(.lineFeed))
        return text
    }

    func saveToDisk(image: UIImage) -> URL? {
        let fileName = "\(ProcessInfo.processInfo.globallyUniqueString)_file.jpg"

        guard let data = image.jpegData(compressionQuality: 0.9) else {
            return nil
        }

        let fileURL = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(fileName)

        guard (try? data.write(to: fileURL, options: [.atomic])) != nil else {
            return nil
        }

        return fileURL
    }

    private func readImages(from pasteboard: UIPasteboard) -> [String] {
        guard let images = pasteboard.images else {
            return []
        }
        let imagesURLs = images.compactMap({ saveToDisk(image: $0)?.absoluteString })
        return imagesURLs
    }

    override func paste(_ sender: Any?) {
        let pasteboard = UIPasteboard.general
        let text = readText(from: pasteboard) ?? ""
        let html = readHTML(from: pasteboard) ?? ""
        let imagesURLs = readImages(from: pasteboard)
        sendPasteCallback(text: text, html: html, imagesURLs: imagesURLs);
    }

    override func pasteWithoutFormatting(_ sender: Any?) {
        let pasteboard = UIPasteboard.general
        let text = readText(from: pasteboard) ?? ""
        let imagesURLs = readImages(from: pasteboard)
        sendPasteCallback(text: text, html: "", imagesURLs: imagesURLs);
    }

    private func sendPasteCallback(text: String, html: String, imagesURLs: [String]) {
        let start = selectedRange.location
        let end = selectedRange.location + selectedRange.length
        onPaste?([
            "currentContent": cleanHTML(),
            "selectionStart": start,
            "selectionEnd": end,
            "pastedText": text,
            "pastedHtml": html,
            "files": imagesURLs] )
    }

    // MARK: - Edits

    open override func insertText(_ text: String) {
        guard !interceptEnter(text) else {
            return
        }

        interceptTriggersKeyCodes(text)

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

    // MARK: - Dictation

    override func dictationRecordingDidEnd() {
        isInsertingDictationResult = true
    }

    public override func insertDictationResult(_ dictationResult: [UIDictationPhrase]) {
        let objectPlaceholder = "\u{FFFC}"
        let dictationText = dictationResult.reduce("") { $0 + $1.text }
        isInsertingDictationResult = false
        self.text = self.text?.replacingOccurrences(of: objectPlaceholder, with: dictationText)
    }

    // MARK: - Custom Edit Intercepts

    private func interceptEnter(_ text: String) -> Bool {
        if text == "\t" {
            return true
        }

        guard text == "\n",
            let onKeyDown = onKeyDown else {
                return false
        }

        var eventData = packCaretDataForRN()
        eventData = add(keyTrigger: "\r", to: eventData)
        onKeyDown(eventData)
        return true
    }

    private func interceptBackspace() -> Bool {
        guard (isNewLineBeforeSelectionAndNotEndOfContent() && selectedRange.length == 0)
            || (selectedRange.location == 0 && selectedRange.length == 0)
            || text.count == 1 // send backspace event when cleaning all characters
            || selectedRange == NSRange(location: 0, length: textStorage.length), // send backspace event when deleting all the text
            let onKeyDown = onKeyDown else {
                return false
        }
        var range = selectedRange
        if text.count == 1 {
            range = NSRange(location: 0, length: textStorage.length)
        }
        var caretData = packCaretDataForRN(overrideRange: range)
        onSelectionChange?(caretData)
        let backSpaceKeyCode:UInt8 = 8
        caretData = add(keyCode: backSpaceKeyCode, to: caretData)
        onKeyDown(caretData)
        return true
    }

    private func interceptTriggersKeyCodes(_ text: String) {
        guard let keyCodes = triggerKeyCodes,
            keyCodes.count > 0,
            let onKeyDown = onKeyDown,
            text.count == 1
        else {
            return
        }
        for value in keyCodes {
            guard let keyString = value as? String,
                let keyCode = keyString.first?.asciiValue,
                text.contains(keyString)
            else {
                continue
            }

            var eventData = [AnyHashable:Any]()
            eventData = add(keyCode: keyCode, to: eventData)
            onKeyDown(eventData)
            return
        }
    }

    private func isNewLineBeforeSelectionAndNotEndOfContent() -> Bool {
        guard let currentLocation = text.indexFromLocation(selectedRange.location) else {
            return false
        }

        return text.isStartOfParagraph(at: currentLocation) && !(text.endIndex == currentLocation)
    }
    override var keyCommands: [UIKeyCommand]? {
        // Remove defautls Tab and Shift+Tab commands, leaving just Shift+Enter command.
        return [carriageReturnKeyCommand]
    }

    // MARK: - Native-to-RN Value Packing Logic

    private func cleanHTML() -> String {
        let html = getHTML(prettify: false).replacingOccurrences(of: String(.paragraphSeparator), with: String(.lineFeed)).replacingOccurrences(of: String(.zeroWidthSpace), with: "")
        return html
    }

    func packForRN(_ text: String, withName name: String) -> [AnyHashable: Any] {
        return [name: text,
                "eventCount": 1]
    }

    func packForRN(_ size: CGSize, withName name: String) -> [AnyHashable: Any] {

        let size = ["width": size.width,
                    "height": size.height]

        return [name: size]
    }
    
    func packCaretDataForRN(overrideRange: NSRange? = nil) -> [AnyHashable: Any] {
        var range = selectedRange
        if let overrideRange = overrideRange {
            range = overrideRange
        }
        var start = range.location
        var end = range.location + range.length
        if selectionAffinity == .backward {
            (start, end) = (end, start)
        }

        var result: [AnyHashable : Any] = packForRN(cleanHTML(), withName: "text")

        result["selectionStart"] = start
        result["selectionEnd"] = end
        
        if let range = selectedTextRange {
            let caretEndRect = caretRect(for: range.end)
            // Sergio Estevao: Sometimes the carectRect can be invalid so we need to check before sending this to JS.
            if !(caretEndRect.isInfinite || caretEndRect.isNull) {
                result["selectionEndCaretX"] = caretEndRect.origin.x
                result["selectionEndCaretY"] = caretEndRect.origin.y
            }
        }

        return result
    }

    func add(keyTrigger: String, to pack:[AnyHashable: Any]) -> [AnyHashable: Any] {
        guard let keyCode = keyTrigger.first?.asciiValue else {
            return pack
        }
        return add(keyCode: keyCode, to: pack)
    }

    func add(keyCode: UInt8, to pack:[AnyHashable: Any]) -> [AnyHashable: Any] {
        var result = pack
        result["keyCode"] = keyCode
        return result
    }

    // MARK: - RN Properties

    @objc func setBlockUseDefaultFont(_ useDefaultFont: Bool) {
        guard blockUseDefaultFont != useDefaultFont else {
            return
        }

        if useDefaultFont {
            // Enable using the defaultFont in Aztec
            // For the PreFormatter and HeadingFormatter
            Configuration.useDefaultFont = true
        }

        blockUseDefaultFont = useDefaultFont
        refreshFont()
    }

    @objc
    func setContents(_ contents: NSDictionary) {

        if let hexString = contents["linkTextColor"] as? String, let linkColor = UIColor(hexString: hexString), linkTextColor != linkColor {
            linkTextColor = linkColor
        }

        guard contents["eventCount"] == nil else {
            return
        }

        let html = contents["text"] as? String ?? ""

        let tag = contents["tag"] as? String ?? ""
        checkDefaultFontFamily(tag: tag)

        setHTML(html)
        updatePlaceholderVisibility()
        refreshTypingAttributesAndPlaceholderFont()
        if let selection = contents["selection"] as? NSDictionary,
            let start = selection["start"] as? NSNumber,
            let end = selection["end"]  as? NSNumber {
            setSelection(start: start, end: end)
        }
        // This signals the RN/JS system that the component needs to relayout
        setNeedsLayout()
    }

    override var textColor: UIColor? {
        didSet {
            typingAttributes[NSAttributedString.Key.foregroundColor] = self.textColor
            self.defaultTextColor = self.textColor
        }
    }

    override var typingAttributes: [NSAttributedString.Key : Any] {
        didSet {
            // Keep placeholder attributes in sync with typing attributes.
            placeholderLabel.attributedText = NSAttributedString(string: placeholderLabel.text ?? "", attributes: placeholderAttributes)
        }
    }

    // MARK: - Placeholder

    @objc var placeholder: String {
        set {
            placeholderLabel.attributedText = NSAttributedString(string: newValue, attributes: placeholderAttributes)
        }

        get {
            return placeholderLabel.text ?? ""
        }
    }

    /// Attributes to use on the placeholder.
    var placeholderAttributes: [NSAttributedString.Key: Any] {
        var placeholderAttributes = typingAttributes
        placeholderAttributes[.foregroundColor] = placeholderTextColor
        return placeholderAttributes
    }

    @objc var placeholderTextColor: UIColor {
        set {
            placeholderLabel.textColor = newValue
        }
        get {
            return placeholderLabel.textColor
        }
    }

    var linkTextColor: UIColor {
        set {
            let shadow = NSShadow()
            shadow.shadowColor = newValue
            linkTextAttributes = [.foregroundColor: newValue, .underlineStyle: NSNumber(value: NSUnderlineStyle.single.rawValue), .shadow: shadow]
        }
        get {
            return linkTextAttributes[.foregroundColor] as? UIColor ?? UIColor.blue
        }
    }

    func setSelection(start: NSNumber, end: NSNumber) {
        if let startPosition = position(from: beginningOfDocument, offset: start.intValue),
            let endPosition = position(from: beginningOfDocument, offset: end.intValue) {
            selectedTextRange = textRange(from: startPosition, to: endPosition)
        }
    }

    func updatePlaceholderVisibility() {
        placeholderLabel.isHidden = !self.text.replacingOccurrences(of: String(.zeroWidthSpace), with: "").isEmpty
    }

    // MARK: - Font Setters

    @objc func setFontFamily(_ family: String) {
        guard fontFamily != family else {
            return
        }
        fontFamily = family
        refreshFont()
    }

    @objc func setFontSize(_ size: CGFloat) {
        guard fontSize != size else {
            return
        }
        fontSize = size
        refreshFont()
        refreshLineHeight()
    }

    @objc func setFontWeight(_ weight: String) {
        guard fontWeight != weight else {
            return
        }
        fontWeight = weight
        refreshFont()
    }
    
    @objc func setLineHeight(_ newLineHeight: CGFloat) {
        guard lineHeight != newLineHeight else {
            return
        }
        lineHeight = newLineHeight
        refreshLineHeight()
    }

    // MARK: - Font Refreshing

    /// Applies the family, size and weight constraints to the provided font.
    ///
    private func applyFontConstraints(to baseFont: UIFont) -> UIFont {
        let oldDescriptor = baseFont.fontDescriptor
        let newFontSize: CGFloat

        if let fontSize = fontSize {
            newFontSize = fontSize
        } else {
            newFontSize = baseFont.pointSize
        }

        var newTraits = oldDescriptor.symbolicTraits

        if let fontWeight = fontWeight {
            if (fontWeight == "bold") {
                newTraits.update(with: .traitBold)
            }
        }

        var newDescriptor: UIFontDescriptor

        if let fontFamily = fontFamily {
            newDescriptor = UIFontDescriptor(name: fontFamily, size: newFontSize)
            newDescriptor = newDescriptor.withSymbolicTraits(newTraits) ?? newDescriptor
        } else {
            newDescriptor = oldDescriptor
        }

        return UIFont(descriptor: newDescriptor, size: newFontSize)
    }

    /// Returns the font from the specified attributes, or the default font if no specific one is set.
    ///
    private func font(from attributes: [NSAttributedString.Key: Any]) -> UIFont {
        return attributes[.font] as? UIFont ?? defaultFont
    }

    /// This method refreshes the font for the whole view if the font-family, the font-size or the font-weight
    /// were ever set.
    ///
    private func refreshFont() {
        let newFont = applyFontConstraints(to: defaultFont)
        defaultFont = newFont
    }

    /// This method refreshes the font for the palceholder field and typing attributes.
    /// This method should not be called directly.  Call `refreshFont()` instead.
    ///
    private func refreshTypingAttributesAndPlaceholderFont() {
        let currentFont = font(from: typingAttributes)
        placeholderLabel.font = currentFont
    }
    
    /// This method refreshes the line height.
    private func refreshLineHeight() {
        if let lineHeight = lineHeight {
            let attributeString = NSMutableAttributedString(string: self.text)
            let style = NSMutableParagraphStyle()
            let currentFontSize = fontSize ?? defaultFont.pointSize
            let lineSpacing = ((currentFontSize * lineHeight) / UIScreen.main.scale) - (currentFontSize / lineHeight) / 2

            style.lineSpacing = lineSpacing
            defaultParagraphStyle.regularLineSpacing = lineSpacing
            textStorage.addAttribute(NSAttributedString.Key.paragraphStyle, value: style, range: NSMakeRange(0, textStorage.length))
        }
    }
    
    /// This method sets the desired font family
    /// for specific tags.
    private func checkDefaultFontFamily(tag: String) {
        // Since we are using the defaultFont to customize
        // the font size, we need to set the monospace font.
        if (blockUseDefaultFont && tag == "pre") {
            setFontFamily(FontProvider.shared.monospaceFont.fontName)
        }
    }

    // MARK: - Formatting interface

    @objc func toggleFormat(format: String) {
        let emptyRange = NSRange(location: selectedRange.location, length: 0)
        switch format {
        case "bold": toggleBold(range: emptyRange)
        case "italic": toggleItalic(range: emptyRange)
        case "strikethrough": toggleStrikethrough(range: emptyRange)
        case "mark": toggleMark(range: emptyRange)
        default: print("Format not recognized")
        }
    }

    // MARK: - Event Propagation

    func propagateContentChanges() {
        if let onChange = onChange {
            let text = packForRN(cleanHTML(), withName: "text")
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

    // MARK: - Selection
    private func correctSelectionAfterLastEmptyLine() {
        guard selectedTextRange?.start == endOfDocument,
            let characterToReplaceLastEmptyLine = storage.htmlConverter.characterToReplaceLastEmptyLine,
            text == String(characterToReplaceLastEmptyLine) else {
            return
        }
        selectedTextRange = self.textRange(from: beginningOfDocument, to: beginningOfDocument)
    }
}

// MARK: UITextView Delegate Methods
extension RCTAztecView: UITextViewDelegate {

    func textViewDidChangeSelection(_ textView: UITextView) {
        guard isFirstResponder, isInsertingDictationResult == false else {
            return
        }

        correctSelectionAfterLastEmptyLine()
        propagateSelectionChanges()
    }

    func textViewDidBeginEditing(_ textView: UITextView) {
        correctSelectionAfterLastEmptyLine()
    }

    func textViewDidChange(_ textView: UITextView) {
        guard isInsertingDictationResult == false else {
            return
        }
        
        propagateContentChanges()
        updatePlaceholderVisibility()
        //Necessary to send height information to JS after pasting text.
        textView.setNeedsLayout()
    }

    override func becomeFirstResponder() -> Bool {
        if !isFirstResponder && canBecomeFirstResponder {
            onFocus?([:])
        }
        return super.becomeFirstResponder()
    }

    func textViewDidEndEditing(_ textView: UITextView) {
        let text = packForRN(cleanHTML(), withName: "text")
        onBlur?(text)
    }
}
