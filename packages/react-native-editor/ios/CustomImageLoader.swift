import Foundation

class CustomImageLoader: NSObject, RCTImageURLLoader {

  static func moduleName() -> String! {
    return "CustomImageLoader"
  }

  func canLoadImageURL(_ requestURL: URL!) -> Bool {
    return !requestURL.isFileURL
  }

  func loadImage(for imageURL: URL!, size: CGSize, scale: CGFloat, resizeMode: RCTResizeMode, progressHandler: RCTImageLoaderProgressBlock!, partialLoadHandler: RCTImageLoaderPartialLoadBlock!, completionHandler: RCTImageLoaderCompletionBlock!) -> RCTImageLoaderCancellationBlock! {
    let task = URLSession.shared.dataTask(with: imageURL) { (data, response, error) in
      if let error = error {
        completionHandler(error, nil)
        return
      }
      guard let data = data,
        let image = UIImage.init(data: data) else {
        completionHandler?(NSError(domain: NSURLErrorDomain, code: NSURLErrorCancelled, userInfo: nil), nil)
        return;
      }
      completionHandler?(nil, image)
    }
    task.resume()
    return { () in
      task.cancel()
    }
  }

  func loaderPriority() -> Float {
    return 100
  }
  
}
