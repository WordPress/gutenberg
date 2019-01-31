
import Foundation
import UIKit
import RNReactNativeGutenbergBridge

class MediaPickAndUploadCoordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
  
  private let presenter: UIViewController
  private let mediaCallback: MediaPickerDidPickMediaCallback
  private let gutenberg: Gutenberg

  private var activeUploads: [String: Progress] = [:]
  
  init(presenter: UIViewController,
       gutenberg: Gutenberg,
       mediaCallback: @escaping MediaPickerDidPickMediaCallback,
       finishCallback: @escaping () -> Void) {
      self.presenter = presenter
      self.gutenberg = gutenberg
      self.mediaCallback = mediaCallback
  }
  
  func pickAndUpload(from source: UIImagePickerController.SourceType) {
    guard UIImagePickerController.isSourceTypeAvailable(source) else {
        // Camera not available, bound to happen in the simulator
        mediaCallback(nil, nil)
        return
    }
    let pickerController = UIImagePickerController()
    pickerController.sourceType = source
    pickerController.delegate = self
    presenter.show(pickerController, sender: nil)
  }
  
  func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
    presenter.dismiss(animated: true, completion: nil)
    mediaCallback(nil, nil)
  }

  func save(image: UIImage, toTemporaryDirectoryUsingName name: String) -> URL? {
    let url = URL(fileURLWithPath: NSTemporaryDirectory() + name + ".jpg")
    guard let data = UIImageJPEGRepresentation(image, 1.0) else {
      return nil
    }
    do {
      try data.write(to: url)
      return url
    } catch {
      return nil
    }
  }

  func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [String : Any]) {
    presenter.dismiss(animated: true, completion: nil)
    let mediaID = UUID().uuidString
    guard
      let image = info[UIImagePickerControllerOriginalImage] as? UIImage,
      let url = save(image: image, toTemporaryDirectoryUsingName: mediaID)
    else {
        mediaCallback(nil, nil)
        return
    }

    mediaCallback(mediaID.hashValue, url.absoluteString)
    let progress = Progress(parent: nil, userInfo: [ProgressUserInfoKey.mediaID: mediaID, ProgressUserInfoKey.mediaURL: url])
    progress.totalUnitCount = 100
    activeUploads[mediaID] = progress
    let timer = Timer.scheduledTimer(timeInterval: 0.1, target: self, selector: #selector(timerFireMethod(_:)), userInfo: progress, repeats: true)
    progress.cancellationHandler = { () in
      timer.invalidate()
    }
  }

  func retryUpload(with mediaID: String) {
    guard let progress = activeUploads[mediaID] else {
      return
    }
    Timer.scheduledTimer(timeInterval: 0.1, target: self, selector: #selector(timerFireMethod(_:)), userInfo: progress, repeats: true)
  }

  func cancelUpload(with mediaID: String) {
    guard let progress = activeUploads[mediaID] else {
      return
    }
    progress.cancel()
  }
  
  @objc func timerFireMethod(_ timer: Timer) {
    guard let progress = timer.userInfo as? Progress,
      let mediaID = progress.userInfo[.mediaID] as? String,
      let mediaURL = progress.userInfo[.mediaURL] as? URL
      else {
        timer.invalidate()
        return
    }
    progress.completedUnitCount += 1
    
    if progress.fractionCompleted < 1 {
      gutenberg.mediaUploadUpdate(id: mediaID.hashValue, state: .uploading, progress: Float(progress.fractionCompleted), url: nil, serverID: nil)
    } else if progress.fractionCompleted >= 1 {
      timer.invalidate()
      activeUploads[mediaID] = nil
      gutenberg.mediaUploadUpdate(id: mediaID.hashValue, state: .failed, progress: 1, url: nil, serverID: nil)
    }
  }
}

extension ProgressUserInfoKey {
  static let mediaID = ProgressUserInfoKey("mediaID")
  static let mediaURL = ProgressUserInfoKey("mediaURL")
}
