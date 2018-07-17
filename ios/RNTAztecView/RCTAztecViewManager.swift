import Aztec
import Foundation

@objc (RCTAztecViewManager)
public class RCTAztecViewManager: RCTViewManager {
    
    let attachmentDelegate: Aztec.TextViewAttachmentDelegate
    let imageProvider: Aztec.TextViewAttachmentImageProvider
    
    /// Customize the initializer to set up the Aztec delegate methods.
    /// Then the example app should implement RCTBridgeDelegate
    /// Then the example app should initialize this class and pass it to the bridge (since this class inherits from RCTBridgeModule
    public required init(attachmentDelegate: Aztec.TextViewAttachmentDelegate, imageProvider: TextViewAttachmentImageProvider) {
        self.attachmentDelegate = attachmentDelegate
        self.imageProvider = imageProvider
        
        super.init()
    }
    
    @objc
    public override func view() -> UIView {
        let view = RCTAztecView(
            defaultFont: .systemFont(ofSize: 12),
            defaultParagraphStyle: .default,
            defaultMissingImage: UIImage())
        
        view.isScrollEnabled = true
        
        view.backgroundColor = .yellow
        view.text = "Hello world!"
        
        view.textAttachmentDelegate = attachmentDelegate
        view.registerAttachmentImageProvider(imageProvider)
        
        return view
    }
}
