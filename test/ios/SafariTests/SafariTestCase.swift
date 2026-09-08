import XCTest

/// Shared plumbing for the suites that drive the editor in Safari on a
/// simulator: attaching to the browser, opening a page in it, and reading
/// the software keyboard and the field it types into.
class SafariTestCase: XCTestCase {
	let safari = XCUIApplication( bundleIdentifier: "com.apple.mobilesafari" )

	var web: XCUIElement { safari.webViews.firstMatch }
	var keyboard: XCUIElement { safari.keyboards.firstMatch }

	/// Whichever editable field has the keyboard right now. Elements are
	/// live queries, so this follows the focus.
	var focusedField: XCUIElement {
		web.textViews.matching( NSPredicate( format: "hasKeyboardFocus == true" ) ).firstMatch
	}

	override func setUpWithError() throws {
		continueAfterFailure = false
	}

	var baseURL: String {
		ProcessInfo.processInfo.environment[ "WP_BASE_URL" ] ?? "http://127.0.0.1:9400"
	}

	/// Opens the path and waits for the editor to come up, asking again if
	/// it does not. The development server sometimes stops answering for a
	/// while, and Safari then sits on its start page, which has a web view
	/// of its own and so cannot be told apart by waiting for one.
	func open(
		_ path: String,
		waitingFor element: XCUIElement,
		timeout: TimeInterval = 150,
		attempts: Int = 3
	) {
		for attempt in 1...attempts {
			// Opened by the system, not through the app: XCUITest cannot
			// launch Safari itself, only attach to it.
			XCUIDevice.shared.system.open( URL( string: baseURL + path )! )
			safari.activate()
			XCTAssertTrue( safari.wait( for: .runningForeground, timeout: 30 ) )

			// A post whose edits were never saved asks before it goes. These
			// tests never keep what they type, so leave.
			let leave = safari.buttons
				.matching( NSPredicate( format: "label BEGINSWITH 'Leave'" ) )
				.firstMatch
			if leave.waitForExistence( timeout: 3 ) {
				leave.tap()
			}

			if element.waitForExistence( timeout: timeout ) {
				return
			}
			XCTContext.runActivity(
				named: "\( path ) did not open on attempt \( attempt ), asking again"
			) { _ in }
		}
		XCTFail( "The editor did not load at \( path )" )
	}

	func openNewPost() {
		// The first load on a runner is slow: PHP runs in WebAssembly and
		// nothing is cached yet.
		open( "/wp-admin/post-new.php", waitingFor: web.textViews[ "Add title" ], timeout: 240 )
	}

	/// Letters are keys, labelled in the case the keyboard currently shows;
	/// shift and return are buttons.
	func key( _ label: String ) -> XCUIElement {
		keyboard.descendants( matching: .any )
			.matching( NSPredicate( format: "label ==[c] %@", label ) )
			.firstMatch
	}

	/// Taps the letters as given, without touching shift: the keyboard's own
	/// state decides the case that lands in the field.
	func type( _ word: String ) {
		if key( "letters" ).exists {
			key( "letters" ).tap()
		}
		for letter in word {
			key( String( letter ) ).tap()
		}
	}

	/// Waits until the field with the keyboard is an empty one with this
	/// aria-label.
	func waitForFocus( on label: String, _ message: String ) {
		// An empty field holds nothing or the padding character.
		let matches = NSPredicate( format: "label == %@ AND value.length < 2", label )
		let done = XCTNSPredicateExpectation( predicate: matches, object: focusedField )
		XCTAssertEqual( XCTWaiter.wait( for: [ done ], timeout: 10 ), .completed, message )
	}
}
