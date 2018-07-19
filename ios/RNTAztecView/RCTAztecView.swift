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
        let newSize = sizeThatFits(frame.size)
        
        guard previousContentSize != newSize,
            let onContentSizeChange = onContentSizeChange else {
                return
        }
        
        previousContentSize = newSize
        
        let body = packForRN(newSize, withName: "contentSize")
        onContentSizeChange(body)
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

