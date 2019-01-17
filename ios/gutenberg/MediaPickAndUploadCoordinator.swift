
import Foundation
import UIKit
import RNReactNativeGutenbergBridge

class MediaPickAndUploadCoordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
  
  private let presenter: UIViewController
  private let mediaCallback: MediaPickerDidPickMediaToUploadCallback
  private let gutenberg: Gutenberg
  
  init(presenter: UIViewController,
       gutenberg: Gutenberg,
       mediaCallback: @escaping MediaPickerDidPickMediaToUploadCallback,
       finishCallback: @escaping () -> Void) {
      self.presenter = presenter
      self.gutenberg = gutenberg
      self.mediaCallback = mediaCallback
  }
  
  func pickAndUpload() {
    let pickerController = UIImagePickerController()
    pickerController.delegate = self
    presenter.show(pickerController, sender: nil)
  }
  
  func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
    presenter.dismiss(animated: true, completion: nil)
    mediaCallback(nil, nil)
  }
  
  func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [String : Any]) {
    presenter.dismiss(animated: true, completion: nil)
    let mediaID = UUID().uuidString
    let url = URL(fileURLWithPath: NSTemporaryDirectory() + mediaID + ".jpg")
    guard
      let image = info[UIImagePickerControllerOriginalImage] as? UIImage,
      let data = UIImageJPEGRepresentation(image, 1.0)
      else {
        return
    }
    do {
      try data.write(to: url)
      mediaCallback(url.absoluteString, mediaID)
      let progress = Progress(parent: nil, userInfo: [ProgressUserInfoKey.mediaID: mediaID, ProgressUserInfoKey.mediaURL: url])
      progress.totalUnitCount = 100
      
      Timer.scheduledTimer(timeInterval: 0.1, target: self, selector: #selector(timerFireMethod(_:)), userInfo: progress, repeats: true)
    } catch {
      mediaCallback(nil, nil)
    }
  }
  
  @objc func timerFireMethod(_ timer: Timer) {
    guard let progress = timer.userInfo as? Progress,
      let mediaID = progress.userInfo[.mediaID] as? String,
      let mediaURL = progress.userInfo[.mediaURL] as? URL
      //let otherURL = URL(string: "https://cldup.com/cXyG__fTLN.jpg")
      else {
        timer.invalidate()
        return
    }
    progress.completedUnitCount += 1
    
    if progress.fractionCompleted < 1 {
      gutenberg.mediaUploadUpdate(id: mediaID, state: .uploading, progress: Float(progress.fractionCompleted), url: nil)
    } else if progress.fractionCompleted >= 1 {
      timer.invalidate()
      gutenberg.mediaUploadUpdate(id: mediaID, state: .succeeded, progress: 1, url: mediaURL)
    }
  }
}

extension ProgressUserInfoKey {
  static let mediaID = ProgressUserInfoKey("mediaID")
  static let mediaURL = ProgressUserInfoKey("mediaURL")
}
