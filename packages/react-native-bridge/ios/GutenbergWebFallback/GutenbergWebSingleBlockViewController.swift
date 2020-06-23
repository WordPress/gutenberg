import UIKit
import WebKit

public protocol GutenbergWebDelegate: class {
    func webController(controller: GutenbergWebSingleBlockViewController, didPressSave block: Block)
    func webControllerDidPressClose(controller: GutenbergWebSingleBlockViewController)
    func webController(controller: GutenbergWebSingleBlockViewController, didLog log: String)
}

open class GutenbergWebSingleBlockViewController: UIViewController {
    public weak var delegate: GutenbergWebDelegate?

    private let isWPOrg: Bool
    private let block: Block
    private let jsInjection: FallbackJavascriptInjection
    private let coverView = UIView()

    public lazy var webView: WKWebView = {
        let configuration = WKWebViewConfiguration()
        configuration.userContentController = jsInjection.userContent(messageHandler: self, blockHTML: block.content)
        configuration.suppressesIncrementalRendering = true
        return WKWebView(frame: .zero, configuration: configuration)
    }()

    public init(block: Block, userId: String, isWPOrg: Bool = true) throws {
        self.block = block
        self.isWPOrg = isWPOrg
        jsInjection = try FallbackJavascriptInjection(blockHTML: block.content, userId: userId)

        super.init(nibName: nil, bundle: nil)
    }

    required public init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    public override func loadView() {
        view = webView
    }

    open override func viewDidLoad() {
        super.viewDidLoad()
        webView.navigationDelegate = self
        if #available(iOS 13.0, *) {
            isModalInPresentation = true
        }
        addNavigationBarElements()
        addCoverView()
        loadWebView()
    }

    open func getRequest(for webView: WKWebView, completion: @escaping (URLRequest) -> Void) {
        let request = URLRequest(url: URL(string: "https://wordpress.org/gutenberg/")!)
        completion(request)
    }

    public func cleanUp() {
         webView.configuration.userContentController.removeAllUserScripts()
         FallbackJavascriptInjection.JSMessage.allCases.forEach {
             webView.configuration.userContentController.removeScriptMessageHandler(forName: $0.rawValue)
         }
     }

    private func loadWebView() {
        getRequest(for: webView) { [weak self] (request) in
            self?.webView.load(request)
        }
    }

    @objc public func onSaveButtonPressed() {
        evaluateJavascript(jsInjection.getHtmlContentScript)
    }

    @objc public func onCloseButtonPressed() {
        delegate?.webControllerDidPressClose(controller: self)
    }

    private func addNavigationBarElements() {
        let saveButton = UIBarButtonItem(barButtonSystemItem: .save, target: self, action: #selector(onSaveButtonPressed))
        let cancelButton = UIBarButtonItem(barButtonSystemItem: .cancel, target: self, action: #selector(onCloseButtonPressed))

        navigationItem.rightBarButtonItem = saveButton
        navigationItem.leftBarButtonItem = cancelButton
        let localizedTitle = NSLocalizedString("Edit %@ block", comment: "Title of Gutenberg WEB editor running on a Web View. %@ is the localized block name.")
        title = String(format: localizedTitle, block.name)
    }

    func addCoverView() {
        webView.addSubview(coverView)
        if #available(iOS 13.0, *) {
            coverView.backgroundColor = UIColor.systemBackground
        } else {
            coverView.backgroundColor = .white
        }
        coverView.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            coverView.leadingAnchor.constraint(equalTo: webView.leadingAnchor),
            coverView.trailingAnchor.constraint(equalTo: webView.trailingAnchor),
            coverView.topAnchor.constraint(equalTo: webView.topAnchor),
            coverView.bottomAnchor.constraint(equalTo: webView.bottomAnchor),
        ])
    }

    func removeCoverViewAnimated() {
        UIView.animate(withDuration: 1, animations: {
            self.coverView.alpha = 0
        }) { _ in
            self.coverView.removeFromSuperview()
            self.coverView.alpha = 1
        }
    }

    private func evaluateJavascript(_ script: WKUserScript) {
        webView.evaluateJavaScript(script.source) { (response, error) in
            if let response = response {
                print("\(response)")
            }
            if let error = error {
                print("\(error)")
            }
        }
    }

    private func save(_ newContent: String) {
        delegate?.webController(controller: self, didPressSave: block.replacingContent(with: newContent))
    }
}

extension GutenbergWebSingleBlockViewController: WKNavigationDelegate {
    public func webView(_ webView: WKWebView, decidePolicyFor navigationResponse: WKNavigationResponse, decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void) {
        if !isWPOrg && navigationResponse.response.url?.absoluteString.contains("/wp-admin/post-new.php") ?? false {
            evaluateJavascript(jsInjection.insertBlockScript)
        }
        decisionHandler(.allow)
    }

    public func webView(_ webView: WKWebView, didCommit navigation: WKNavigation!) {
        // At this point, user scripts are not loaded yet, so we need to inject the
        // script that inject css manually before actually injecting the css.
        evaluateJavascript(jsInjection.injectCssScript)
        evaluateJavascript(jsInjection.injectEditorCssScript)
        evaluateJavascript(jsInjection.injectWPBarsCssScript)
        evaluateJavascript(jsInjection.injectLocalStorageScript)
    }

    public func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        // Sometimes the editor takes longer loading and its CSS can override what
        // Injectic Editor specific CSS when everything is loaded to avoid overwritting parameters if gutenberg CSS load later.
        evaluateJavascript(jsInjection.preventAutosavesScript)
        evaluateJavascript(jsInjection.injectEditorCssScript)
        if isWPOrg {
            evaluateJavascript(jsInjection.insertBlockScript)
        }
        removeCoverViewAnimated()
    }
}

extension GutenbergWebSingleBlockViewController: WKScriptMessageHandler {
    public func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard
            let messageType = FallbackJavascriptInjection.JSMessage(rawValue: message.name),
            let body = message.body as? String
        else {
            return
        }

        handle(messageType, body: body)
    }

    private func handle(_ message: FallbackJavascriptInjection.JSMessage, body: String) {
        switch message {
        case .log:
            delegate?.webController(controller: self, didLog: body)
        case .htmlPostContent:
            save(body)
        }
    }
}
