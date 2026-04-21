
import Foundation
import UIKit
import Gutenberg
import CoreServices

class MediaPickCoordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
  
  private let presenter: UIViewController
  private let callback: (URL?) -> Void
  private let filter: Gutenberg.MediaType
  
  init(presenter: UIViewController,
       filter: Gutenberg.MediaType,
       callback: @escaping (URL?) -> Void) {
      self.presenter = presenter
      self.callback = callback
      self.filter = filter
  }
  
  private var mediaTypes: [ String ]? {
    switch filter {
    case .image:
      return [ kUTTypeImage as String ]
    case .video:
      return [ kUTTypeVideo as String, kUTTypeMovie as String ]
    default:
      return nil
    }
  }
  
  func pick(from source: UIImagePickerController.SourceType) {
    guard UIImagePickerController.isSourceTypeAvailable(source) else {
        // Camera not available, bound to happen in the simulator
        callback(nil)
        return
    }
    let pickerController = UIImagePickerController()
    pickerController.sourceType = source
    if let mediaTypes = mediaTypes {
      pickerController.mediaTypes = mediaTypes
    }
    pickerController.delegate = self
    presenter.show(pickerController, sender: nil)
  }
  
  func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
    presenter.dismiss(animated: true, completion: nil)
    callback(nil)
  }

  func save(image: UIImage, toTemporaryDirectoryUsingName name: String) -> URL? {
    let url = URL(fileURLWithPath: NSTemporaryDirectory() + name + ".jpg")
    guard let data = image.jpegData(compressionQuality: 1.0) else {
      return nil
    }
    do {
      try data.write(to: url)
      return url
    } catch {
      return nil
    }
  }

  func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
    presenter.dismiss(animated: true, completion: nil)
    let mediaID = UUID().uuidString
    switch filter {
    case .image:
      guard
        let image = info[UIImagePickerController.InfoKey.originalImage] as? UIImage,
        let url = save(image: image, toTemporaryDirectoryUsingName: mediaID)
        else {
          callback(nil)
          return
      }
      callback(url)
    case .video:
      guard let url = info[UIImagePickerController.InfoKey.mediaURL] as? URL else {
        callback(nil)
        return
      }
      callback(url)
    default:
      callback(nil)
    }
  }

}
