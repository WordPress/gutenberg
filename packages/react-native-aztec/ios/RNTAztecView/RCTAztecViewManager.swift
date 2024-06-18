import Aztec
import Foundation

@objc (RCTAztecViewManager)
public class RCTAztecViewManager: RCTViewManager {

    public var attachmentDelegate: Aztec.TextViewAttachmentDelegate?
    public var imageProvider: Aztec.TextViewAttachmentImageProvider?
    public lazy var unsupportedHTMLImageProvider = {
        Aztec.HTMLAttachmentRenderer(font: defaultFont)
    }()

    public override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    @objc
    public override func view() -> UIView {
        let view = RCTAztecView(
            defaultFont: defaultFont,
            defaultParagraphStyle: defaultParagrahStyle,
            defaultMissingImage: UIImage())

        view.isScrollEnabled = false

        view.textAttachmentDelegate = attachmentDelegate
        
        if let imageProvider = imageProvider {
            view.registerAttachmentImageProvider(imageProvider)
        }
        
        view.registerAttachmentImageProvider(unsupportedHTMLImageProvider)

        return view
    }

    /// This method is similar to `executeBlock` but prepends the block to execute it before other pending blocks.
    func executeBlockBeforeOthers(viewTag: NSNumber, block: @escaping (RCTAztecView) -> Void) {
        self.bridge.uiManager.prependUIBlock { (uiManager, viewRegistry) in
            let view = viewRegistry?[viewTag]
            guard let aztecView = view as? RCTAztecView else {
                return
            }
            block(aztecView)
        }
    }
    
    func executeBlock(viewTag: NSNumber, block: @escaping (RCTAztecView) -> Void) {
        self.bridge.uiManager.addUIBlock { (uiManager, viewRegistry) in
            let view = viewRegistry?[viewTag]
            guard let aztecView = view as? RCTAztecView else {
                return
            }
            block(aztecView)
        }
    }

    private var defaultFont: UIFont {        
        if let font = UIFont(name: "NotoSerif", size: 16) {
            return font
        }

        let defaultFont = UIFont.systemFont(ofSize: 16)
        guard let url = Bundle.main.url(forResource: "NotoSerif-Regular", withExtension: "ttf") else {
            return defaultFont
        }
        CTFontManagerRegisterFontsForURL(url as CFURL, CTFontManagerScope.process, nil)
        if let font = UIFont(name: "NotoSerif", size: 16) {
            return font
        }

        return defaultFont
    }
    private var defaultParagrahStyle: ParagraphStyle {
        let defaultStyle = ParagraphStyle.default
        defaultStyle.textListParagraphSpacing = 5
        defaultStyle.textListParagraphSpacingBefore = 5
        return defaultStyle
    }
    
    @objc
    func focus(_ viewTag: NSNumber) -> Void {
        self.executeBlockBeforeOthers(viewTag: viewTag) { (aztecView) in
            aztecView.reactFocus()
        }
    }
    
    @objc
    func blur(_ viewTag: NSNumber) -> Void {
        self.executeBlock(viewTag: viewTag) { (aztecView) in
            aztecView.reactBlur()
        }
    }

    @objc
    func onMarkFormatting(_ viewTag: NSNumber, _ color: String) {
        self.executeBlock(viewTag: viewTag) { (aztecView) in
            let range = NSRange(location: aztecView.selectedRange.location, length: 0)
            aztecView.toggleMark(range: range, color: color, resetColor: false)
        }
    }

    @objc
    func onRemoveMarkFormatting(_ viewTag: NSNumber) {
        self.executeBlock(viewTag: viewTag) { (aztecView) in
            let range = NSRange(location: aztecView.selectedRange.location, length: 0)
            aztecView.toggleMark(range: range, color: nil, resetColor: true)
        }
    }
}

