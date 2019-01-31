
import Foundation
import UIKit
import RNReactNativeGutenbergBridge

class MediaUploadCoordinator: NSObject {
  
  private let gutenberg: Gutenberg

  private var activeUploads: [Int: Progress] = [:]
  
  init(gutenberg: Gutenberg) {
      self.gutenberg = gutenberg
  }

  func upload(url: URL) -> Int? {
    let mediaID = UUID().uuidString.hash
    let progress = Progress(parent: nil, userInfo: [ProgressUserInfoKey.mediaID: mediaID, ProgressUserInfoKey.mediaURL: url])
    progress.totalUnitCount = 100
    activeUploads[mediaID] = progress
    let timer = Timer.scheduledTimer(timeInterval: 0.1, target: self, selector: #selector(timerFireMethod(_:)), userInfo: progress, repeats: true)
    progress.cancellationHandler = { () in
      timer.invalidate()
    }
    return mediaID
  }

  func retryUpload(with mediaID: Int) {
    guard let progress = activeUploads[mediaID] else {
      return
    }
    Timer.scheduledTimer(timeInterval: 0.1, target: self, selector: #selector(timerFireMethod(_:)), userInfo: progress, repeats: true)
  }

  func cancelUpload(with mediaID: Int) {
    guard let progress = activeUploads[mediaID] else {
      return
    }
    progress.cancel()
  }
  
  @objc func timerFireMethod(_ timer: Timer) {
    guard let progress = timer.userInfo as? Progress,
      let mediaID = progress.userInfo[.mediaID] as? Int,
      let mediaURL = progress.userInfo[.mediaURL] as? URL
      else {
        timer.invalidate()
        return
    }
    progress.completedUnitCount += 1
    
    if progress.fractionCompleted < 1 {
      gutenberg.mediaUploadUpdate(id: mediaID, state: .uploading, progress: Float(progress.fractionCompleted), url: nil, serverID: nil)
    } else if progress.fractionCompleted >= 1 {
      timer.invalidate()
      activeUploads[mediaID] = nil
      gutenberg.mediaUploadUpdate(id: mediaID, state: .failed, progress: 1, url: nil, serverID: nil)
    }
  }
}

extension ProgressUserInfoKey {
  static let mediaID = ProgressUserInfoKey("mediaID")
  static let mediaURL = ProgressUserInfoKey("mediaURL")
}
