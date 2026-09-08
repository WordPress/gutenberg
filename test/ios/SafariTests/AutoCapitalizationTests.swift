import XCTest

/// The iOS keyboard capitalizes the first letter of a sentence only when
/// the caret is at the start of an empty field, and only when the field
/// was focused once the key that got it there has been handled. Desktop
/// browsers have no such keyboard, so these tests read the shift key of
/// the software keyboard in Safari on a simulator.
final class AutoCapitalizationTests: XCTestCase {
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

	func openNewPost() {
		let base = ProcessInfo.processInfo.environment[ "WP_BASE_URL" ] ?? "http://127.0.0.1:9400"
		// Opened by the system, not through the app: XCUITest cannot launch
		// Safari itself, only attach to it.
		XCUIDevice.shared.system.open( URL( string: base + "/wp-admin/post-new.php" )! )
		safari.activate()
		XCTAssertTrue( safari.wait( for: .runningForeground, timeout: 30 ) )
		XCTAssertTrue( web.waitForExistence( timeout: 60 ), "The editor did not load" )
	}

	/// Letters are keys, labelled in the case the keyboard currently shows;
	/// shift and return are buttons.
	func key( _ label: String ) -> XCUIElement {
		keyboard.descendants( matching: .any )
			.matching( NSPredicate( format: "label ==[c] %@", label ) )
			.firstMatch
	}

	func type( _ word: String ) {
		for letter in word {
			key( String( letter ) ).tap()
		}
	}

	/// Waits until the field with the keyboard is the one with this
	/// aria-label.
	func waitForFocus( on label: String, _ message: String ) {
		let matches = NSPredicate( format: "label == %@", label )
		let done = XCTNSPredicateExpectation( predicate: matches, object: focusedField )
		XCTAssertEqual( XCTWaiter.wait( for: [ done ], timeout: 10 ), .completed, message )
	}

	/// The keyboard updates shortly after focus moves.
	func assertCapitalized( _ message: String ) {
		let upperCase = NSPredicate( format: "label == 'A'" )
		if !keyboard.keys.matching( upperCase ).firstMatch.waitForExistence( timeout: 5 ) {
			// Everything Safari shows at this point, for triage.
			let tree = XCTAttachment( string: safari.debugDescription )
			tree.name = "Safari accessibility tree"
			tree.lifetime = .keepAlways
			add( tree )
			XCTFail( message )
		}
		XCTAssertTrue( key( "shift" ).isSelected, message )
	}

	func testReturnStartsTheNextFieldCapitalized() throws {
		openNewPost()

		// A new post focuses the title. The first load on a runner is slow:
		// PHP runs in WebAssembly and nothing is cached yet.
		XCTAssertTrue(
			web.textViews[ "Add title" ].waitForExistence( timeout: 240 ),
			"The new post has no title field"
		)
		waitForFocus( on: "Add title", "The title is not focused" )
		XCTAssertTrue( keyboard.waitForExistence( timeout: 10 ), "No software keyboard" )
		assertCapitalized( "An empty title should start capitalized" )

		type( "Title" )
		XCTAssertEqual( focusedField.value as? String, "Title" )
		XCTAssertFalse( key( "shift" ).isSelected, "After a word the keyboard should be lowercase" )

		key( "return" ).tap()
		waitForFocus(
			on: "Empty block; start writing or type forward slash to choose a block",
			"Return in the title did not focus an empty paragraph"
		)
		assertCapitalized( "The paragraph after the title should start capitalized" )

		type( "Hello" )
		XCTAssertEqual( focusedField.value as? String, "Hello" )
		XCTAssertEqual( focusedField.label, "Block: Paragraph" )
		XCTAssertFalse( key( "shift" ).isSelected, "After a word the keyboard should be lowercase" )

		key( "return" ).tap()
		waitForFocus(
			on: "Empty block; start writing or type forward slash to choose a block",
			"Return did not focus a new empty paragraph"
		)
		assertCapitalized( "The paragraph after Return should start capitalized" )

		// The earlier fields kept their text.
		XCTAssertEqual( web.textViews[ "Add title" ].value as? String, "Title" )
		XCTAssertEqual( web.textViews[ "Block: Paragraph" ].value as? String, "Hello" )
	}
}
