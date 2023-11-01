
import Foundation
import UIKit
import Gutenberg

class MediaUploadCoordinator: NSObject {
  
  static let failUpload: Notification.Name = Notification.Name(rawValue: "Notification.FailUpload")
  
  private let gutenberg: Gutenberg

  private var activeUploads: [Int32: Progress] = [:]
  private(set) var successfullUpload = true
  
  init(gutenberg: Gutenberg) {
    self.gutenberg = gutenberg
    super.init()
    NotificationCenter.default.addObserver(self, selector: #selector(failUpload), name: MediaUploadCoordinator.failUpload, object: nil)
  }

  func upload(url: URL) -> Int32? {
    //Make sure the media is not larger than a 32 bits to number to avoid problems when bridging to JS
    successfullUpload = true
    let mediaID = Int32(truncatingIfNeeded:UUID().uuidString.hash)
    let progress = Progress(parent: nil, userInfo: [ProgressUserInfoKey.mediaID: mediaID, ProgressUserInfoKey.mediaURL: url])
    progress.totalUnitCount = 100
    activeUploads[mediaID] = progress
    let timer = Timer.scheduledTimer(timeInterval: 0.1, target: self, selector: #selector(timerFireMethod(_:)), userInfo: progress, repeats: true)
    progress.cancellationHandler = { () in
      timer.invalidate()
      self.gutenberg.mediaUploadUpdate(id: mediaID, state: .reset, progress: 0, url: nil, serverID: nil)
    }
    return mediaID
  }

  func progressForUpload(mediaID: Int32) -> Progress? {
    return activeUploads[mediaID]
  }

  func retryUpload(with mediaID: Int32) {
    guard let progress = activeUploads[mediaID] else {
      return
    }
    progress.completedUnitCount = 0
    successfullUpload = true
    Timer.scheduledTimer(timeInterval: 0.1, target: self, selector: #selector(timerFireMethod(_:)), userInfo: progress, repeats: true)
  }

  func cancelUpload(with mediaID: Int32) {
    guard let progress = activeUploads[mediaID] else {
      return
    }
    progress.cancel()
  }
  
  @objc func failUpload() {
      successfullUpload = false
  }
  
  @objc func timerFireMethod(_ timer: Timer) {
    guard let progress = timer.userInfo as? Progress,
      let mediaID = progress.userInfo[.mediaID] as? Int32,
      let mediaURL = progress.userInfo[.mediaURL] as? URL
      else {
        timer.invalidate()
        return
    }
    progress.completedUnitCount += 1
    
    if !successfullUpload {
      timer.invalidate()
      progress.setUserInfoObject("Network upload failed", forKey: .mediaError)
      gutenberg.mediaUploadUpdate(id: mediaID, state: .failed, progress: 1, url: nil, serverID: nil, metadata: ["demoApp" : true, "failReason" : "Network upload failed"])
      successfullUpload = true
      return
    }
    
    //Variable to switch upload final state from success to failure.
    if progress.fractionCompleted < 1 {
      gutenberg.mediaUploadUpdate(id: mediaID, state: .uploading, progress: Float(progress.fractionCompleted), url: nil, serverID: nil)
    } else if progress.fractionCompleted >= 1 {
      timer.invalidate()
      gutenberg.mediaUploadUpdate(id: mediaID, state: .succeeded, progress: 1, url: mediaURL, serverID: mediaID, metadata: ["demoApp" : true])
      activeUploads[mediaID] = nil
    }
  }
  
}

extension ProgressUserInfoKey {
  static let mediaID = ProgressUserInfoKey("mediaID")
  static let mediaURL = ProgressUserInfoKey("mediaURL")
  static let mediaError = ProgressUserInfoKey("mediaError")
}
