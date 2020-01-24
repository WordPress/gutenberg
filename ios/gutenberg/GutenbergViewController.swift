
import UIKit
import Gutenberg
import Aztec

class GutenbergViewController: UIViewController {

    fileprivate lazy var gutenberg = Gutenberg(dataSource: self, extraModules: [CustomImageLoader()])
    fileprivate var htmlMode = false
    fileprivate var mediaPickCoordinator: MediaPickCoordinator?
    fileprivate lazy var mediaUploadCoordinator: MediaUploadCoordinator = {
        let mediaUploadCoordinator = MediaUploadCoordinator(gutenberg: self.gutenberg)
        return mediaUploadCoordinator
    }()
    fileprivate var longPressGesture: UILongPressGestureRecognizer!
    
    override func loadView() {
        view = gutenberg.rootView
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        configureNavigationBar()
        gutenberg.delegate = self
        navigationController?.navigationBar.isTranslucent = false
        registerLongPressGestureRecognizer()
    }

    @objc func moreButtonPressed(sender: UIBarButtonItem) {
        showMoreSheet()
    }

    @objc func saveButtonPressed(sender: UIBarButtonItem) {
        gutenberg.requestHTML()
    }
    
    func registerLongPressGestureRecognizer() {
        longPressGesture = UILongPressGestureRecognizer(target: self, action: #selector(handleLongPress))
        view.addGestureRecognizer(longPressGesture)
    }
    
    @objc func handleLongPress() {
        NotificationCenter.default.post(Notification(name: MediaUploadCoordinator.failUpload ))
    }
}

extension GutenbergViewController: GutenbergBridgeDelegate {
    func gutenbergDidRequestFetch(path: String, completion: @escaping (Result<Any, NSError>) -> Void) {
        completion(Result.success([:]))
    }

    func editorDidAutosave() {
        print("➡️ Editor Did Autosave")
    }

    func gutenbergDidLoad() {
        gutenberg.setFocusOnTitle()
    }

    func gutenbergDidMount(unsupportedBlockNames: [String]) {
        print("gutenbergDidMount(unsupportedBlockNames: \(unsupportedBlockNames))")
    }

    func gutenbergDidProvideHTML(title: String, html: String, changed: Bool) {
        print("didProvideHTML:")
        print("↳ Content changed: \(changed)")
        print("↳ Title: \(title)")
        print("↳ HTML: \(html)")
    }

    func gutenbergDidRequestMedia(from source: Gutenberg.MediaSource, filter: [Gutenberg.MediaType], allowMultipleSelection: Bool, with callback: @escaping MediaPickerDidPickMediaCallback) {
        guard let currentFilter = filter.first else {
            return
        }
        switch source {
        case .mediaLibrary:
            print("Gutenberg did request media picker, passing a sample url in callback")
            switch currentFilter {
            case .image:
                if(allowMultipleSelection) {
                    callback([MediaInfo(id: 1, url: "https://cldup.com/cXyG__fTLN.jpg", type: "image"),
                              MediaInfo(id: 3, url: "https://cldup.com/cXyG__fTLN.jpg", type: "image")])
                } else {
                    callback([MediaInfo(id: 1, url: "https://cldup.com/cXyG__fTLN.jpg", type: "image")])
                }
            case .video:
                if(allowMultipleSelection) {
                    callback([MediaInfo(id: 2, url: "https://i.cloudup.com/YtZFJbuQCE.mov", type: "video"),
                              MediaInfo(id: 4, url: "https://i.cloudup.com/YtZFJbuQCE.mov", type: "video")])
                } else {
                    callback([MediaInfo(id: 2, url: "https://i.cloudup.com/YtZFJbuQCE.mov", type: "video")])
                }
            default:
                break
            }
        case .deviceLibrary:
            print("Gutenberg did request a device media picker, opening the device picker")
            pickAndUpload(from: .savedPhotosAlbum, filter: currentFilter, callback: callback)
        case .deviceCamera:
            print("Gutenberg did request a device media picker, opening the camera picker")
            pickAndUpload(from: .camera, filter: currentFilter, callback: callback)
        default: break
        }
    }

    func gutenbergDidRequestImport(from url: URL, with callback: @escaping MediaImportCallback) {
        let id = mediaUploadCoordinator.upload(url: url)
        callback(MediaInfo(id: id, url: url.absoluteString, type: "image"))
    }

    func pickAndUpload(from source: UIImagePickerController.SourceType, filter: Gutenberg.MediaType, callback: @escaping MediaPickerDidPickMediaCallback) {
        mediaPickCoordinator = MediaPickCoordinator(presenter: self, filter: filter, callback: { (url) in
            guard let url = url, let mediaID = self.mediaUploadCoordinator.upload(url: url) else {
                callback([MediaInfo(id: nil, url: nil, type: nil)])
                return
            }
            callback([MediaInfo(id: mediaID, url: url.absoluteString, type: "image")])
            self.mediaPickCoordinator = nil
        } )
        mediaPickCoordinator?.pick(from: source)
    }

    func gutenbergDidRequestMediaUploadSync() {
        print("Gutenberg request for media uploads to be resync")
    }

    func gutenbergDidRequestMediaUploadActionDialog(for mediaID: Int32) {
        guard let progress = mediaUploadCoordinator.progressForUpload(mediaID: mediaID) else {
            return
        }

        let title: String = "Media Options"
        var message: String? = ""
        let alertController = UIAlertController(title: title, message: nil, preferredStyle: .actionSheet)
        let dismissAction = UIAlertAction(title: "Dismiss", style: .cancel) { (action) in

        }
        alertController.addAction(dismissAction)

        if progress.fractionCompleted < 1 && mediaUploadCoordinator.successfullUpload {
            let cancelUploadAction = UIAlertAction(title: "Cancel upload", style: .destructive) { (action) in
                self.mediaUploadCoordinator.cancelUpload(with: mediaID)
            }
            alertController.addAction(cancelUploadAction)
        } else if let error = progress.userInfo[.mediaError] as? String {
            message = error
            let retryUploadAction = UIAlertAction(title: "Retry upload", style: .default) { (action) in
                self.mediaUploadCoordinator.retryUpload(with: mediaID)
            }
            alertController.addAction(retryUploadAction)
        }

        alertController.title = title
        alertController.message = message
        alertController.popoverPresentationController?.sourceView = view
        alertController.popoverPresentationController?.sourceRect = view.frame
        alertController.popoverPresentationController?.permittedArrowDirections = .any
        present(alertController, animated: true, completion: nil)
    }

    /// Tells the delegate that an image block requested for the upload cancelation.
    ///
    func gutenbergDidRequestMediaUploadCancelation(for mediaID: Int32) {
        guard let progress = mediaUploadCoordinator.progressForUpload(mediaID: mediaID) else {
            return
        }
        progress.cancel()
    }

    func gutenbergDidEmitLog(message: String, logLevel: LogLevel) {
        switch logLevel {
        case .trace:
            print("Debug: \(message)")
        case .info:
            print("Info: \(message)")
        case .warn:
            print("Warn: \(message)")
        case .error:
            print("Error: \(message)")
        case .fatal:
            print("Fatal: \(message)")
        }
    }

    func gutenbergDidRequestImagePreview(with fullSizeUrl: URL, thumbUrl: URL?) {
        print("Gutenberg requested fullscreen image preview for " + fullSizeUrl.absoluteString)
    }
}

extension GutenbergViewController: GutenbergBridgeDataSource {
    func gutenbergLocale() -> String? {
        return Locale.preferredLanguages.first ?? "en"
    }
    
    func gutenbergTranslations() -> [String : [String]]? {
        return nil
    }
    
    func gutenbergInitialContent() -> String? {
        return nil
    }
    
    func gutenbergInitialTitle() -> String? {
        return nil
    }

    func aztecAttachmentDelegate() -> TextViewAttachmentDelegate {
        return ExampleAttachmentDelegate()
    }
}

//MARK: - Navigation bar

extension GutenbergViewController {

    func configureNavigationBar() {
        addSaveButton()
        addMoreButton()
    }

    func addSaveButton() {
        navigationItem.leftBarButtonItem = UIBarButtonItem(barButtonSystemItem: .save,
                                                           target: self,
                                                           action: #selector(saveButtonPressed(sender:)))
    }

    func addMoreButton() {
        navigationItem.rightBarButtonItem = UIBarButtonItem(title: "...",
                                                            style: .plain,
                                                            target: self,
                                                            action: #selector(moreButtonPressed(sender:)))
    }
}

//MARK: - More actions

extension GutenbergViewController {

    func showMoreSheet() {
        let alert = UIAlertController(title: nil, message: nil, preferredStyle: .actionSheet)
        alert.popoverPresentationController?.barButtonItem = navigationItem.rightBarButtonItem

        let cancelAction = UIAlertAction(title: "Keep Editing", style: .cancel)
        alert.addAction(toggleHTMLModeAction)
        alert.addAction(updateHtmlAction)
        alert.addAction(cancelAction)

        present(alert, animated: true)
    }
    
    var toggleHTMLModeAction: UIAlertAction {
        return UIAlertAction(
            title: htmlMode ? "Switch To Visual" : "Switch to HTML",
            style: .default,
            handler: { [unowned self] action in
                self.toggleHTMLMode(action)
        })
    }
    
    var updateHtmlAction: UIAlertAction {
        return UIAlertAction(
            title: "Update HTML",
            style: .default,
            handler: { [unowned self] action in
                let alert = self.alertWithTextInput(using: { [unowned self] (htmlInput) in
                    if let input = htmlInput {
                        self.gutenberg.updateHtml(input)
                    }
                })
                self.present(alert, animated: true, completion: nil)
        })
    }
    
    func alertWithTextInput(using handler: ((String?) -> Void)?) -> UIAlertController {
        let alert = UIAlertController(title: "Enter HTML", message: nil, preferredStyle: .alert)
        alert.addTextField()
        let submitAction = UIAlertAction(title: "Submit", style: .default) { [unowned alert] (action) in
            handler?(alert.textFields?.first?.text)
        }
        alert.addAction(submitAction)
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))
        return alert
    }
    
    func toggleHTMLMode(_ action: UIAlertAction) {
        htmlMode = !htmlMode
        gutenberg.toggleHTMLMode()
    }
}
