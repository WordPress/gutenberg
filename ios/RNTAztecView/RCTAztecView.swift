import Aztec
import Foundation

class RCTAztecView: Aztec.TextView {
    @objc var onContentSizeChange: RCTBubblingEventBlock? = nil
    
    private var previousContentSize: CGSize = .zero
    
    // MARK - View Height: Match to content height

    override func layoutSubviews() {
        super.layoutSubviews()
        
        updateContentSizeInRN()
    }

    func updateContentSizeInRN() {
        let newSize = contentSize
        
        guard previousContentSize != newSize else {
            return
        }
        
        previousContentSize = newSize
        updateHeightToMatch(newSize.height)
        
        guard let onContentSizeChange = onContentSizeChange else {
            return
        }
        
        let body = packForRN(newSize, withName: "contentSize")
        onContentSizeChange(body)
    }
    
    func updateHeightToMatch(_ newHeight: CGFloat) {
        bounds = CGRect(origin: .zero, size: CGSize(width: frame.width, height: newHeight))
    }
    
    // MARK: - Native-to-RN Value Packing Logic
    
    func packForRN(_ size: CGSize, withName name: String) -> [AnyHashable: Any] {
        
        let size = ["width": size.width,
                    "height": size.height]
        
        return [name: size]
    }

    // MARK: - RN Properties
    
    @objc
    func setContents(_ contents: NSDictionary) {
        let html = contents["text"] as? String ?? ""
        
        setHTML(html)
    }
}

