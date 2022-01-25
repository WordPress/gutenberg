import UIKit
import Gutenberg
import Aztec

class GutenbergViewController: UIViewController {
    private lazy var filesAppMediaPicker: DocumentsMediaSource = {
        return DocumentsMediaSource(gutenberg: gutenberg, coordinator: mediaUploadCoordinator)
    }()

    fileprivate lazy var gutenberg = Gutenberg(dataSource: self, extraModules: [CustomImageLoader()])
    fileprivate var htmlMode = false
    fileprivate var mediaPickCoordinator: MediaPickCoordinator?
    fileprivate lazy var mediaUploadCoordinator: MediaUploadCoordinator = {
        let mediaUploadCoordinator = MediaUploadCoordinator(gutenberg: self.gutenberg)
        return mediaUploadCoordinator
    }()
    fileprivate var longPressGesture: UILongPressGestureRecognizer!
    fileprivate var contentInfo: ContentInfo?
    private var unsupportedBlockCanBeActivated = false
    private var unsupportedBlockEnabled = true

    override func loadView() {
        view = gutenberg.rootView
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        configureNavigationBar()
        gutenberg.delegate = self
        registerLongPressGestureRecognizer()

        _ = try! FallbackJavascriptInjection(blockHTML: "Hello", userId: "1")
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
        gutenberg.requestHTML()
    }

    func gutenbergDidProvideHTML(title: String, html: String, changed: Bool, contentInfo: ContentInfo?) {
        print("didProvideHTML:")
        print("↳ Content changed: \(changed)")
        print("↳ Title: \(title)")
        print("↳ HTML: \(html)")
        print("↳ Content Info: \(String(describing: contentInfo))")
        self.contentInfo = contentInfo
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
                              MediaInfo(id: 3, url: "https://cldup.com/cXyG__fTLN.jpg", type: "image", caption: "Mountain")])
                } else {
                    callback([MediaInfo(id: 1, url: "https://cldup.com/cXyG__fTLN.jpg", type: "image", caption: "Mountain")])
                }
            case .video:
                if(allowMultipleSelection) {
                    callback([MediaInfo(id: 2, url: "https://i.cloudup.com/YtZFJbuQCE.mov", type: "video"),
                              MediaInfo(id: 4, url: "https://i.cloudup.com/YtZFJbuQCE.mov", type: "video")])
                } else {
                    callback([MediaInfo(id: 2, url: "https://i.cloudup.com/YtZFJbuQCE.mov", type: "video", caption: "Cloudup")])
                }
            case .other, .any:
                 callback([MediaInfo(id: 3, url: "https://wordpress.org/latest.zip", type: "zip", caption: "WordPress latest version", title: "WordPress.zip")])
            case .audio:
                callback([MediaInfo(id: 5, url: "https://cldup.com/59IrU0WJtq.mp3", type: "audio", caption: "Summer presto")])
            }
        case .deviceLibrary:
            print("Gutenberg did request a device media picker, opening the device picker")
            pickAndUpload(from: .savedPhotosAlbum, filter: currentFilter, callback: callback)
        case .deviceCamera:
            print("Gutenberg did request a device media picker, opening the camera picker")
            pickAndUpload(from: .camera, filter: currentFilter, callback: callback)

        case .filesApp, .otherApps:
            pickAndUploadFromFilesApp(filter: currentFilter, callback: callback)
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

    private func pickAndUploadFromFilesApp(filter: Gutenberg.MediaType, callback: @escaping MediaPickerDidPickMediaCallback) {
        filesAppMediaPicker.presentPicker(origin: self, filters: [filter], multipleSelection: false, callback: callback)
    }

    func gutenbergDidRequestMediaUploadSync() {
        print("Gutenberg request for media uploads to be resync")
    }

    func gutenbergDidRequestToSetFeaturedImage(for mediaID: Int32) {
        print("Gutenberg request to set featured image")
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

    func gutenbergDidRequestMediaEditor(with mediaUrl: URL, callback: @escaping MediaPickerDidPickMediaCallback) {
        print("Gutenberg requested media editor for " + mediaUrl.absoluteString)
        callback([MediaInfo(id: 1, url: "https://cldup.com/Fz-ASbo2s3.jpg", type: "image")])
    }

    func gutenbergDidRequestUnsupportedBlockFallback(for block: Block) {
        print("Requesting Fallback for \(block)")
        let controller = try! WebViewController(block: block, userId: "0")
        controller.delegate = self
        present(UINavigationController(rootViewController: controller), animated: true)
    }

    func gutenbergDidRequestMention(callback: @escaping (Result<String, NSError>) -> Void) {
        callback(.success("matt"))
    }

    func gutenbergDidRequestXpost(callback: @escaping (Result<String, NSError>) -> Void) {
        callback(.success("ma.tt"))
    }

    func gutenbergDidRequestMediaSaveSync() {
        print(#function)
    }

    func gutenbergDidRequestMediaFilesBlockReplaceSync(_ mediaFiles: [[String: Any]], clientId: String) {
        print(#function)
    }

    func gutenbergDidRequestFocalPointPickerTooltipShown() -> Bool {
        return false;
    }

    func gutenbergDidRequestSetFocalPointPickerTooltipShown(_ tooltipShown: Bool) {
        print("Gutenberg requested setting tooltip flag")
    }

    func gutenbergDidRequestPreview() {
        print(#function)
    }

    func gutenbergDidRequestBlockTypeImpressions() -> [String: Int] {
        return [:]
    }

    func gutenbergDidRequestSetBlockTypeImpressions(_ impressions: [String: Int]) -> Void {
        print("Gutenberg requested setting block type impressions to \(impressions).")
    }

    func gutenbergDidRequestContactCustomerSupport() {
        print(#function)
    }

    func gutenbergDidRequestGotoCustomerSupportOptions() {
        print(#function)
    }

    func gutenbergDidRequestSendEventToHost(_ eventName: String, properties: [AnyHashable: Any]) -> Void {
        print("Gutenberg requested sending '\(eventName)' event to host with propreties: \(properties).")
    }
}

extension GutenbergViewController: GutenbergWebDelegate {
    func webController(controller: GutenbergWebSingleBlockViewController, didPressSave block: Block) {
        gutenberg.replace(block: block)
        dismiss(webController: controller)
    }

    func webControllerDidPressClose(controller: GutenbergWebSingleBlockViewController) {
        dismiss(webController: controller)
    }

    func webController(controller: GutenbergWebSingleBlockViewController, didLog log: String) {
        print("WebView: \(log)")
    }

    private func dismiss(webController: GutenbergWebSingleBlockViewController) {
        webController.cleanUp()
        dismiss(animated: true)
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

    func gutenbergFeaturedImageId() -> NSNumber? {
        return nil
    }

    func gutenbergCapabilities() -> [Capabilities : Bool] {
        return [
            .mentions: true,
            .xposts: true,
            .unsupportedBlockEditor: unsupportedBlockEnabled,
            .canEnableUnsupportedBlockEditor: unsupportedBlockCanBeActivated,
            .mediaFilesCollectionBlock: true,
            .tiledGalleryBlock: true,
            .isAudioBlockMediaUploadEnabled: true,
            .reusableBlock: false,
            .facebookEmbed: true,
            .instagramEmbed: true,
            .loomEmbed: true,
            .smartframeEmbed: true,
        ]
    }

    func aztecAttachmentDelegate() -> TextViewAttachmentDelegate {
        return ExampleAttachmentDelegate()
    }

    func gutenbergEditorSettings() -> GutenbergEditorSettings? {
        return nil
    }

    func gutenbergMediaSources() -> [Gutenberg.MediaSource] {
        return [.filesApp, .otherApps]
    }
}

extension Gutenberg.MediaSource {
    static let filesApp = Gutenberg.MediaSource(id: "files-app", label: "Choose from device", types: [.any])
    static let otherApps = Gutenberg.MediaSource(id: "other-apps", label: "Other Apps", types: [.image, .video, .audio, .other])
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
        if let contentInfo = contentInfo {
            alert.title = "Content Structure\nBlocks: \(contentInfo.blockCount), Words: \(contentInfo.wordCount), Characters: \(contentInfo.characterCount)"
        }
        let cancelAction = UIAlertAction(title: "Keep Editing", style: .cancel)
        alert.addAction(toggleHTMLModeAction)
        alert.addAction(updateHtmlAction)
        alert.addAction(unsupportedBlockUIAction)
        alert.addAction(showEditorHelpAction)
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
    
    var showEditorHelpAction: UIAlertAction {
        return UIAlertAction(
            title: "Help & Support",
            style: .default,
            handler: { [unowned self] action in
                self.showEditorHelp()
            }
        )
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

    var unsupportedBlockUIAction: UIAlertAction {
        return UIAlertAction(
            title: "Toggle Missing Block Alert UI",
            style: .default,
            handler: { [unowned self] action in
                if self.unsupportedBlockEnabled || (self.unsupportedBlockEnabled == self.unsupportedBlockCanBeActivated) {
                    self.unsupportedBlockEnabled.toggle()
                }
                if !self.unsupportedBlockEnabled || self.unsupportedBlockCanBeActivated {
                    self.unsupportedBlockCanBeActivated.toggle()
                }
                self.gutenberg.updateCapabilities()
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
    
    func showEditorHelp() {
        gutenberg.showEditorHelp()
    }
}
