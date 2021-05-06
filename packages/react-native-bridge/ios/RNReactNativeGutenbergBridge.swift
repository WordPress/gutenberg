struct GutenbergEvent {
    let name: String
    let body: Any?
}

@objc (RNReactNativeGutenbergBridge)
public class RNReactNativeGutenbergBridge: RCTEventEmitter {
    weak var delegate: GutenbergBridgeDelegate?
    weak var dataSource: GutenbergBridgeDataSource?
    private var isJSLoading = true
    private var hasObservers = false
    private var queuedEvents = [GutenbergEvent]()

    public override init() {
        super.init()
        NotificationCenter.default.addObserver(forName: .RCTContentDidAppear, object: nil, queue: nil) { (_) in
            DispatchQueue.main.async {
                self.connectionEstablished()
            }
        }
    }
    // MARK: - Messaging methods

    @objc
    func provideToNative_Html(_ html: String, title: String, changed: Bool, contentInfo: [String:Int]) {
        DispatchQueue.main.async {
            let info = ContentInfo.decode(from: contentInfo)
            self.delegate?.gutenbergDidProvideHTML(title: title, html: html, changed: changed, contentInfo: info)
        }
    }

    @objc
    func requestMediaPickFrom(_ source: String, filter: [String]?, allowMultipleSelection: Bool, callback: @escaping RCTResponseSenderBlock) {
        let mediaSource = getMediaSource(withId: source)
        let mediaFilter = getMediaTypes(from: filter)

        DispatchQueue.main.async {
            self.delegate?.gutenbergDidRequestMedia(from: mediaSource, filter: mediaFilter, allowMultipleSelection: allowMultipleSelection, with: { media in
                guard let media = media else {
                    callback(nil)
                    return
                }
                let mediaToReturn: [MediaInfo]
                if allowMultipleSelection {
                    mediaToReturn = media
                } else {
                    mediaToReturn = Array(media.prefix(1))
                }

                let jsFormattedMedia = mediaToReturn.map { mediaInfo in
                    return mediaInfo.encodeForJS()
                }
                if allowMultipleSelection {
                    callback([jsFormattedMedia])
                } else {
                    callback(jsFormattedMedia)
                }
            })
        }
    }

    @objc
    func requestUnsupportedBlockFallback(_ content: String, blockId: String, blockName: String, blockTitle: String) {
        DispatchQueue.main.async {
            let block = Block(id: blockId, name: blockName, title: blockTitle, content: content)
            self.delegate?.gutenbergDidRequestUnsupportedBlockFallback(for: block)
        }
    }

    @objc
    func getOtherMediaOptions(_ filter: [String]?, callback: @escaping RCTResponseSenderBlock) {
        guard let dataSource = dataSource else {
            return callback([])
        }

        let mediaSources = dataSource.gutenbergMediaSources()
        let allowedTypes = getMediaTypes(from: filter)
        let filteredSources = mediaSources.filter {
            return $0.types.intersection(allowedTypes).isEmpty == false
        }
        let jsMediaSources = filteredSources.map { $0.jsRepresentation }
        callback([jsMediaSources])
    }

    @objc
    func requestMediaImport(_ urlString: String, callback: @escaping RCTResponseSenderBlock) {
        guard let url = URL(string: urlString) else {
            callback(nil)
            return
        }
        DispatchQueue.main.async {
            self.delegate?.gutenbergDidRequestImport(from: url, with: { mediaInfo in
                guard let mediaInfo = mediaInfo else {
                    callback(nil)
                    return
                }
                callback([mediaInfo.id as Any, mediaInfo.url as Any])
            })
        }
    }

    @objc
    func mediaUploadSync() {
        DispatchQueue.main.async {
            if self.hasObservers {
                self.delegate?.gutenbergDidRequestMediaUploadSync()
            }
        }
    }

    @objc
    func requestImageFailedRetryDialog(_ mediaID: Int32) {
        DispatchQueue.main.async {
            self.delegate?.gutenbergDidRequestMediaUploadActionDialog(for: mediaID)
        }
    }

    @objc
    func requestImageUploadCancelDialog(_ mediaID: Int32) {
        DispatchQueue.main.async {
            self.delegate?.gutenbergDidRequestMediaUploadActionDialog(for: mediaID)
        }
    }

    @objc
    func requestImageUploadCancel(_ mediaID: Int32) {
        DispatchQueue.main.async {
            self.delegate?.gutenbergDidRequestMediaUploadCancelation(for: mediaID)
        }
    }

    @objc
    func editorDidLayout() {
        DispatchQueue.main.async {
            self.delegate?.gutenbergDidLayout()
        }
    }

    @objc
    func editorDidMount(_ unsupportedBlockNames: [AnyObject]) {
        let unsupportedNames = unsupportedBlockNames.compactMap { $0 as? String }
        DispatchQueue.main.async {
            self.delegate?.gutenbergDidMount(unsupportedBlockNames: unsupportedNames)
        }
    }

    @objc
    func editorDidEmitLog(_ message: String, logLevel: Int) {
        guard
            shouldLog(with: logLevel),
            let logLevel = LogLevel(rawValue: logLevel)
        else {
            return
        }

        delegate?.gutenbergDidEmitLog(message: message, logLevel: logLevel)
    }

    @objc
    func requestImageFullscreenPreview(_ currentImageUrlString: String, originalImageUrlString: String?) {
        guard let currentImageUrl = URL(string: currentImageUrlString) else {
            assertionFailure("Given String is not a URL")
            return
        }

        let originalUrl: URL
        let currentUrl: URL?

        if let originalImageUrlString = originalImageUrlString, let original = URL(string: originalImageUrlString) {
            originalUrl = original
            currentUrl = currentImageUrl
        } else {
            // The current image url is the only one available.
            originalUrl = currentImageUrl
            currentUrl = nil
        }

        DispatchQueue.main.async {
            self.delegate?.gutenbergDidRequestImagePreview(with: originalUrl, thumbUrl: currentUrl)
        }
    }

    @objc
    func requestMediaEditor(_ urlString: String, callback: @escaping RCTResponseSenderBlock) {
        guard let url = URL(string: urlString) else {
            assertionFailure("Given String is not a URL")
            return
        }

        DispatchQueue.main.async {
            self.delegate?.gutenbergDidRequestMediaEditor(with: url) { media in
                guard let media = media else {
                    callback(nil)
                    return
                }

                let mediaToReturn = media

                let jsFormattedMedia = mediaToReturn.map { mediaInfo in
                    return mediaInfo.encodeForJS()
                }

                callback(jsFormattedMedia)
            }
        }
    }

    public func connectionEstablished() {
        guard !hasObservers else { return } // We have an established connection no need to continue.
        hasObservers = true
        while (self.queuedEvents.count > 0) {
            let event = self.queuedEvents.removeFirst()
            super.sendEvent(withName: event.name, body: event.body) // execute this on super as we want to avoid logic in self.
        }
    }

    public override func sendEvent(withName name: String, body: Any?) {
        DispatchQueue.main.async {
            if self.hasObservers && self.queuedEvents.count == 0 {
                super.sendEvent(withName: name, body: body)
            } else {
                let event = GutenbergEvent(name: name, body: body)
                self.queuedEvents.append(event)
            }
        }
    }

    private func shouldLog(with level: Int) -> Bool {
        return level >= RCTGetLogThreshold().rawValue
    }

    @objc
    func editorDidAutosave() {
        DispatchQueue.main.async {
            self.delegate?.editorDidAutosave()
        }
    }

    @objc
    func fetchRequest(_ path: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        self.delegate?.gutenbergDidRequestFetch(path: path, completion: { (result) in
            switch result {
            case .success(let response):
                resolver(response)
            case .failure(let error):
                rejecter("\(error.code)", error.description, error)
            }
        })
    }


    /// Sends events to the JS side only if there is observers listening
    ///
    /// - Parameters:
    ///   - name: name of the event
    ///   - body: data for the event
    func sendEventIfNeeded(_ event: EventName, body: Any? = nil) {
        if ( hasObservers ) {
            sendEvent(withName: event.rawValue, body: body)
        }
    }

    @objc
    func showUserSuggestions(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        self.delegate?.gutenbergDidRequestMention(callback: { (result) in
            switch result {
            case .success(let mention):
                resolver([mention])
            case .failure(let error):
                rejecter(error.domain, "\(error.code)", error)
            }
        })
    }

	@objc
	func showXpostSuggestions(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
		self.delegate?.gutenbergDidRequestXpost(callback: { (result) in
			switch result {
			case .success(let mention):
				resolver([mention])
			case .failure(let error):
				rejecter(error.domain, "\(error.code)", error)
			}
		})
	}

    @objc
    func requestMediaFilesEditorLoad(_ mediaFiles: [[String: Any]], blockId: String) {
        DispatchQueue.main.async {
            self.delegate?.gutenbergDidRequestMediaFilesEditorLoad(mediaFiles, blockId: blockId)
        }
    }

    @objc
    func requestMediaFilesFailedRetryDialog(_ mediaFiles: [[String: Any]]) {
        DispatchQueue.main.async {
            self.delegate?.gutenbergDidRequestMediaFilesFailedRetryDialog(mediaFiles)
        }
    }

    @objc
    func requestMediaFilesUploadCancelDialog(_ mediaFiles: [[String: Any]]) {
        DispatchQueue.main.async {
            self.delegate?.gutenbergDidRequestMediaFilesUploadCancelDialog(mediaFiles)
        }
    }

    @objc
    func requestMediaFilesSaveCancelDialog(_ mediaFiles: [[String: Any]]) {
        DispatchQueue.main.async {
            self.delegate?.gutenbergDidRequestMediaFilesSaveCancelDialog(mediaFiles)
        }
    }

    @objc
    func mediaSaveSync() {
        DispatchQueue.main.async {
            if self.hasObservers {
                self.delegate?.gutenbergDidRequestMediaSaveSync()
            }
        }
	}

    @objc
    func requestFocalPointPickerTooltipShown(_ callback: @escaping RCTResponseSenderBlock) {
        callback([self.delegate?.gutenbergDidRequestFocalPointPickerTooltipShown() ?? false])
    }

    @objc
    func setFocalPointPickerTooltipShown(_ tooltipShown: Bool) {
        self.delegate?.gutenbergDidRequestSetFocalPointPickerTooltipShown(tooltipShown)
    }

    @objc
    func mediaFilesBlockReplaceSync(_ mediaFiles: [[String: Any]], clientId: String) {
        DispatchQueue.main.async {
            if self.hasObservers {
                self.delegate?.gutenbergDidRequestMediaFilesBlockReplaceSync(mediaFiles, clientId: clientId)
            }
        }
    }

    @objc
    func actionButtonPressed(_ buttonType: String) {
        guard let button = Gutenberg.ActionButtonType(rawValue: buttonType) else {
            return
        }
        DispatchQueue.main.async {
            self.delegate?.gutenbergDidSendButtonPressedAction(button)
        }
    }

}

// MARK: - RCTBridgeModule delegate

public extension Gutenberg {
    public enum ActionButtonType: String {
        case missingBlockAlertActionButton = "missing_block_alert_action_button"
    }
}

extension RNReactNativeGutenbergBridge {
    enum EventName: String, CaseIterable {
        case requestGetHtml
        case setTitle
        case toggleHTMLMode
        case updateHtml
        case mediaUpload
        case setFocusOnTitle
        case mediaAppend
        case updateTheme
        case replaceBlock
        case updateCapabilities
        case showNotice
        case mediaSave
    }

    public override func supportedEvents() -> [String]! {
        return EventName.allCases.compactMap { $0.rawValue }
    }

    public override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    public override func batchDidComplete() {
        if isJSLoading {
            isJSLoading = false
            DispatchQueue.main.async {
                self.delegate?.gutenbergDidLoad()
            }
        }
    }
}

// MARK: - Helpers

extension RNReactNativeGutenbergBridge {
    func optionalArray(from optionalString: String?) -> [String]? {
        guard let string = optionalString else {
            return nil
        }
        return [string]
    }

    private func getMediaSource(withId mediaSourceID: String) -> Gutenberg.MediaSource {
        let allMediaSources = Gutenberg.MediaSource.registeredInternalSources + (dataSource?.gutenbergMediaSources() ?? [])
        return allMediaSources.first{ $0.id == mediaSourceID } ?? .deviceLibrary
    }

    private func getMediaTypes(from jsMediaTypes: [String]?) -> [Gutenberg.MediaType] {
        return (jsMediaTypes ?? []).map { Gutenberg.MediaType(fromJSString: $0) }
    }
}

extension MediaInfo {
    /// Dynamically wraps up all properties into a Json Object to be sent to JS Side.
    func encodeForJS() -> [String: Any] {
        guard
            let data = try? JSONEncoder().encode(self),
            let jsonObject = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any] else
        {
            assertionFailure("Encoding of MediaInfo failed")
            return [String: Any]()
        }

        return jsonObject
    }
}
