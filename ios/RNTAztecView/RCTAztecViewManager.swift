import Aztec
import Foundation

@objc (RCTAztecViewManager)
public class RCTAztecViewManager: RCTViewManager {

    public var attachmentDelegate: Aztec.TextViewAttachmentDelegate?
    public var imageProvider: Aztec.TextViewAttachmentImageProvider?

    public override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    @objc
    func applyFormat(_ node: NSNumber, format: String) {
        executeBlock({ (aztecView) in
            aztecView.apply(format: format)
        }, onNode: node)
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

    func executeBlock(_ block: @escaping (RCTAztecView) -> Void, onNode node: NSNumber) {
        self.bridge.uiManager.addUIBlock { (manager, viewRegistry) in
            let view = viewRegistry?[node]
            guard let aztecView = view as? RCTAztecView else {
                return
            }
            block(aztecView)
        }
    }
}
