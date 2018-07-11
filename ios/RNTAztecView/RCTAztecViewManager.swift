import Aztec
import Foundation

@objc (RCTAztecViewManager)
public class RCTAztecViewManager: RCTViewManager {
    
    let attachmentDelegate: Aztec.TextViewAttachmentDelegate
    
    /// Customize the initializer to set up the Aztec delegate methods.
    /// Then the example app should implement RCTBridgeDelegate
    /// Then the example app should initialize this class and pass it to the bridge (since this class inherits from RCTBridgeModule
    public required init(attachmentDelegate: Aztec.TextViewAttachmentDelegate) {
        self.attachmentDelegate = attachmentDelegate
        
        super.init()
    }
    
    @objc
    public override func view() -> UIView {
        let view = RCTAztecView(
            defaultFont: .systemFont(ofSize: 12),
            defaultParagraphStyle: .default,
            defaultMissingImage: UIImage())

        view.backgroundColor = .cyan
        view.text = "Hello world!"
        
        bridge.uiManager.rootView(forReactTag: view.reactTag) { (view) in
            print(view ?? "nil")
        }
        
        return view
    }
}
