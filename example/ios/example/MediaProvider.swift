import Aztec
import Foundation

class MediaProvider: Aztec.TextViewAttachmentDelegate {
    
    func textView(_ textView: TextView, attachment: NSTextAttachment, imageAt url: URL, onSuccess success: @escaping (UIImage) -> Void, onFailure failure: @escaping () -> Void) {
        
        let image = UIImage(named: "aztec")!
        
        success(image)
    }
    
    func textView(_ textView: TextView, urlFor imageAttachment: ImageAttachment) -> URL? {
        return URL(string: "")
    }
    
    func textView(_ textView: TextView, placeholderFor attachment: NSTextAttachment) -> UIImage {
        return UIImage()
    }
    
    func textView(_ textView: TextView, deletedAttachment attachment: MediaAttachment) {
    }
    
    func textView(_ textView: TextView, selected attachment: NSTextAttachment, atPosition position: CGPoint) {
    }
    
    func textView(_ textView: TextView, deselected attachment: NSTextAttachment, atPosition position: CGPoint) {
    }
    
    
}

extension MediaProvider: Aztec.TextViewAttachmentImageProvider {
    func textView(_ textView: TextView, shouldRender attachment: NSTextAttachment) -> Bool {
        return true
    }
    
    func textView(_ textView: TextView, boundsFor attachment: NSTextAttachment, with lineFragment: CGRect) -> CGRect {
        return CGRect(x: 0, y: 0, width: 20, height: 20)
    }
    
    func textView(_ textView: TextView, imageFor attachment: NSTextAttachment, with size: CGSize) -> UIImage? {
        let image = UIImage(named: "aztec")!
        
        return image
    }
    
    
}
