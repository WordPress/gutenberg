import Aztec
import Foundation

@objc (RCTAztecViewManager)
public class RCTAztecViewManager: RCTViewManager {

// NOTE:
// Removing temporarily images and attachment handling in favour of a simpler Bridge implementation.

    public var attachmentDelegate: Aztec.TextViewAttachmentDelegate?
    public var imageProvider: Aztec.TextViewAttachmentImageProvider?

    public override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    @objc
    public override func view() -> UIView {
        let view = RCTAztecView(
            defaultFont: .systemFont(ofSize: 12),
            defaultParagraphStyle: .default,
            defaultMissingImage: UIImage())

        view.isScrollEnabled = false

        view.textAttachmentDelegate = attachmentDelegate
        if let imageProvider = imageProvider {
            view.registerAttachmentImageProvider(imageProvider)
        }

        return view
    }
}
