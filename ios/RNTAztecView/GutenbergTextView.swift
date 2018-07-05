import Aztec
import Foundation

class GutenbergTextView: Aztec.TextView {
    @objc var onContentSizeChange: RCTBubblingEventBlock? = nil
    
    override var contentSize: CGSize {
        get {
            return super.contentSize
        }
        
        set {
            super.contentSize = newValue
            contentSizeChanged()
        }
    }
    
    func contentSizeChanged() {
        let newSize = contentSize
        
        updateHeightToMatch(newSize.height)
        
        let body = packForRN(newSize, withName: "contentSize")
        onContentSizeChange?(body)
    }
    
    func updateHeightToMatch(_ newHeight: CGFloat) {
        
        frame = CGRect(origin: frame.origin,
                       size: CGSize(width: frame.width, height: newHeight))
    }
    
    func packForRN(_ size: CGSize, withName name: String) -> [AnyHashable: Any] {
        
        let size = ["width": size.width,
                    "height": size.height]
        
        return [name: size]
    }
}

