import Aztec
import Foundation

class RCTAztecView: Aztec.TextView {
    @objc var onChange: RCTBubblingEventBlock? = nil
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
    
    // MARK: - Edits
    
    open override func insertText(_ text: String) {
        super.insertText(text)
        
        if let onChange = onChange {
            let text = packForRN(getHTML(), withName: "text")
            onChange(text)
        }
    }
    
    open override func deleteBackward() {
        super.deleteBackward()
        
        if let onChange = onChange {
            let text = packForRN(getHTML(), withName: "text")
            onChange(text)
        }
    }
    
    // MARK: - Native-to-RN Value Packing Logic
    
    func packForRN(_ text: String, withName name: String) -> [AnyHashable: Any] {
        return [name: text]
    }
    
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

