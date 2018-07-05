import Foundation

@objc (RCTAztecViewManager)
class RCTAztecViewManager: RCTViewManager {
    
    @objc override func view() -> UIView {
        let view = RCTAztecView(
            defaultFont: .systemFont(ofSize: 12),
            defaultParagraphStyle: .default,
            defaultMissingImage: UIImage())

        view.backgroundColor = .cyan
        view.text = "Hello world!"
        
        return view
    }
}
