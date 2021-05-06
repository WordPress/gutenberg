import UIKit
import Gutenberg
import MobileCoreServices

class DocumentsMediaSource: NSObject {
    private var mediaPickerCallback: MediaPickerDidPickMediaCallback?
    private unowned var gutenberg: Gutenberg
    private unowned var uploadCoordinator: MediaUploadCoordinator

    init(gutenberg: Gutenberg, coordinator: MediaUploadCoordinator) {
        self.gutenberg = gutenberg
        self.uploadCoordinator = coordinator
    }

    func presentPicker(origin: UIViewController, filters: [Gutenberg.MediaType], multipleSelection: Bool, callback: @escaping MediaPickerDidPickMediaCallback) {
        let uttypeFilters = filters.compactMap { $0.typeIdentifier }
        mediaPickerCallback = callback
        let docPicker = UIDocumentPickerViewController(documentTypes: uttypeFilters, in: .import)
        docPicker.delegate = self
        docPicker.allowsMultipleSelection = multipleSelection
        origin.present(docPicker, animated: true)
    }
}



extension DocumentsMediaSource: UIDocumentPickerDelegate {
    func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        defer {
            mediaPickerCallback = nil
        }
        if urls.count == 0 {
            mediaPickerCallback?(nil)
        } else {
            insertOnBlock(with: urls)
        }
    }

    func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
        mediaPickerCallback?(nil)
        mediaPickerCallback = nil
    }

    func insertOnBlock(with urls: [URL]) {
        guard let callback = mediaPickerCallback else {
            return assertionFailure("Image picked without callback")
        }

        let mediaInfo = urls.compactMap({ (url) -> MediaInfo? in
            let title = url.lastPathComponent
            let id = self.uploadCoordinator.upload(url: url)
            return MediaInfo(id: id, url: url.absoluteString, type: "file", title: title)
        })

        callback(mediaInfo)
    }
}

extension Gutenberg.MediaType {
    var typeIdentifier: String? {
        switch self {
        case .image:
            return String(kUTTypeImage)
        case .video:
            return String(kUTTypeMovie)
        case .audio:
            return String(kUTTypeAudio)
         case .any:
             return String(kUTTypeItem)
         case .other:
             return nil
         }
    }
}
