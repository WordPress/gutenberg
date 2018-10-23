import Aztec
import Foundation

class MediaProvider: Aztec.TextViewAttachmentDelegate {

    var post: Post?
    
    func textView(_ textView: TextView, attachment: NSTextAttachment, imageAt url: URL, onSuccess success: @escaping (UIImage) -> Void, onFailure failure: @escaping () -> Void) {

        downloadImage(from: url, success: success, onFailure: failure)
    }
    
    func textView(_ textView: TextView, urlFor imageAttachment: ImageAttachment) -> URL? {
        return URL(string: "www.google.com")
    }
    
    func textView(_ textView: TextView, placeholderFor attachment: NSTextAttachment) -> UIImage {
        return UIImage(named: "media-no-results")!
    }
    
    func textView(_ textView: TextView, deletedAttachment attachment: MediaAttachment) {
        textView.setNeedsDisplay()
    }
    
    func textView(_ textView: TextView, selected attachment: NSTextAttachment, atPosition position: CGPoint) {
    }
    
    func textView(_ textView: TextView, deselected attachment: NSTextAttachment, atPosition position: CGPoint) {
    }


    func downloadImage(from url: URL, success: @escaping (UIImage) -> Void, onFailure failure: @escaping () -> Void) {
        guard let post = post else {
            return
        }

        var requestURL = url
        let imageMaxDimension = max(UIScreen.main.bounds.size.width, UIScreen.main.bounds.size.height)
        //use height zero to maintain the aspect ratio when fetching
        var size = CGSize(width: imageMaxDimension, height: 0)
        let request: URLRequest
        if url.isFileURL {
            request = URLRequest(url: url)
        } else if post.blog.isPrivate() {
            // private wpcom image needs special handling.
            // the size that WPImageHelper expects is pixel size
            size.width = size.width * UIScreen.main.scale
            requestURL = WPImageURLHelper.imageURLWithSize(size, forImageURL: requestURL)
            request = PrivateSiteURLProtocol.requestForPrivateSite(from: requestURL)
        } else if !post.blog.isHostedAtWPcom && post.blog.isBasicAuthCredentialStored() {
            size.width = size.width * UIScreen.main.scale
            requestURL = WPImageURLHelper.imageURLWithSize(size, forImageURL: requestURL)
            request = URLRequest(url: requestURL)
        } else {
            // the size that PhotonImageURLHelper expects is points size
            requestURL = PhotonImageURLHelper.photonURL(with: size, forImageURL: requestURL)
            request = URLRequest(url: requestURL)
        }

        ImageDownloader.shared.downloadImage(for: request) { [weak self] (image, error) in
            guard let _ = self else {
                return
            }

            DispatchQueue.main.async {
                guard let image = image else {
                    DDLogError("Unable to download image for attachment with url = \(url). Details: \(String(describing: error?.localizedDescription))")
                    failure()
                    return
                }

                success(image)
            }
        }
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
        
        return imageWithImage(image: image, scaledToSize: size)
    }
    
    func imageWithImage(image:UIImage, scaledToSize newSize:CGSize) -> UIImage{
        UIGraphicsBeginImageContextWithOptions(newSize, false, 0.0);
        image.draw(in: CGRect(origin: CGPoint.zero, size: CGSize(width: newSize.width, height: newSize.height)))
        let newImage:UIImage = UIGraphicsGetImageFromCurrentImageContext()!
        UIGraphicsEndImageContext()
        return newImage
    }
    
}
