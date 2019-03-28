
import Foundation
import UIKit
import RNReactNativeGutenbergBridge

class MediaPickCoordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
  
  private let presenter: UIViewController
  private let callback: (URL?) -> Void
  
  init(presenter: UIViewController,
       callback: @escaping (URL?) -> Void) {
      self.presenter = presenter
      self.callback = callback
  }
  
  func pick(from source: UIImagePickerController.SourceType) {
    guard UIImagePickerController.isSourceTypeAvailable(source) else {
        // Camera not available, bound to happen in the simulator
        callback(nil)
        return
    }
    let pickerController = UIImagePickerController()
    pickerController.sourceType = source
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
    guard
      let image = info[UIImagePickerController.InfoKey.originalImage] as? UIImage,
      let url = save(image: image, toTemporaryDirectoryUsingName: mediaID)
    else {
        callback(nil)
        return
    }
    callback(url)
  }

}
