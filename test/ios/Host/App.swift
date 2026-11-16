import SwiftUI
import WebKit
import notify

/// A full screen web view set up like Safari on an iPhone, which loads the
/// page in the `START_URL` launch environment variable.
@main
struct HostApp: App {
	var body: some Scene {
		WindowGroup {
			if let url = ProcessInfo.processInfo.environment[ "START_URL" ].flatMap( URL.init( string: ) ) {
				// Like Safari, the keyboard covers the page instead of
				// resizing it: only the visual viewport shrinks, so the page
				// can scroll under the keyboard.
				WebView( url: url ).ignoresSafeArea( .keyboard )
			} else {
				Text( "Gutenberg iOS tests" )
			}
		}
	}
}

struct WebView: UIViewRepresentable {
	/// The Darwin notification posted once the page has loaded.
	static let loadedNotification = "org.wordpress.gutenberg.tests.Host.loaded"

	let url: URL

	/// Tells the tests when the page has loaded. While the simulator is
	/// still launching WebKit's processes, the tests' accessibility queries
	/// for the app time out, so the tests wait for this instead of querying.
	final class Coordinator: NSObject, WKNavigationDelegate {
		func webView( _ webView: WKWebView, didFinish navigation: WKNavigation! ) {
			notify_post( WebView.loadedNotification )
		}
	}

	func makeCoordinator() -> Coordinator {
		Coordinator()
	}

	func makeUIView( context: Context ) -> WKWebView {
		let configuration = WKWebViewConfiguration()
		// Every launch starts without cookies or storage from an earlier one.
		configuration.websiteDataStore = .nonPersistent()
		configuration.defaultWebpagePreferences.preferredContentMode = .mobile
		configuration.allowsInlineMediaPlayback = true
		// Safari's user agent: the web view's own leaves out the Safari
		// version, and sites can tell the two apart by it.
		let version = UIDevice.current.systemVersion.split( separator: "." ).prefix( 2 ).joined( separator: "." )
		configuration.applicationNameForUserAgent = "Version/\( version ) Mobile/15E148 Safari/604.1"

		let view = WKWebView( frame: .zero, configuration: configuration )
		view.allowsBackForwardNavigationGestures = true
		view.isInspectable = true
		view.navigationDelegate = context.coordinator
		view.load( URLRequest( url: url ) )
		return view
	}

	func updateUIView( _ view: WKWebView, context: Context ) {}
}
