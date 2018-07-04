//import Aztec
import Foundation

@objc (RCTAztecView)
class RCTAztecView: RCTViewManager {
    @objc override func view() -> UIView {
        /*
        let view = Aztec.TextView.init(
        defaultFont: .systemFont(ofSize: 12),
        defaultParagraphStyle: .default,
        defaultMissingImage: UIImage())
 */
        let view = UITextView()

        view.backgroundColor = .blue
        view.text = "Hello world!"

        return view
    }
}
