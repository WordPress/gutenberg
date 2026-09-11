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

	/// Each test leaves its post open and unsaved. Ending Safari keeps the
	/// next test from inheriting that page, its keyboard and its focus, and
	/// skips the unsaved changes prompt a navigation would raise. The login
	/// cookie is on disk and survives.
	override func tearDownWithError() throws {
		safari.terminate()
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

	/// The keyboard updates shortly after focus moves.
	func assertCapitalized( _ message: String ) {
		let upperCase = NSPredicate( format: "label == 'A'" )
		XCTAssertTrue( keyboard.keys.matching( upperCase ).firstMatch.waitForExistence( timeout: 5 ), message )
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
		// The keyboard element exists even when a hardware keyboard keeps
		// it off screen; a key that can be tapped shows it is on screen.
		let shown = XCTNSPredicateExpectation( predicate: NSPredicate( format: "hittable == true" ), object: key( "return" ) )
		XCTAssertEqual( XCTWaiter.wait( for: [ shown ], timeout: 10 ), .completed, "No software keyboard" )
		assertCapitalized( "An empty title should start capitalized" )

		type( "title" )
		XCTAssertEqual( focusedField.value as? String, "Title", "The keyboard should have capitalized the first letter" )
		XCTAssertFalse( key( "shift" ).isSelected, "After a word the keyboard should be lowercase" )

		key( "return" ).tap()
		waitForFocus(
			on: "Empty block; start writing or type forward slash to choose a block",
			"Return in the title did not focus an empty paragraph"
		)
		assertCapitalized( "The paragraph after the title should start capitalized" )

		type( "hello" )
		XCTAssertEqual( focusedField.value as? String, "Hello", "The keyboard should have capitalized the first letter" )
		XCTAssertEqual( focusedField.label, "Block: Paragraph" )
		XCTAssertFalse( key( "shift" ).isSelected, "After a word the keyboard should be lowercase" )

		key( "return" ).tap()
		waitForFocus(
			on: "Empty block; start writing or type forward slash to choose a block",
			"Return did not focus a new empty paragraph"
		)
		assertCapitalized( "The paragraph after Return should start capitalized" )

		// A list item splits differently from a paragraph. Turn this paragraph
		// into a list with the "- " prefix; the dash is on the numbers layout.
		key( "numbers" ).tap()
		key( "-" ).tap()
		key( " " ).tap()
		waitForFocus( on: "List text", "The prefix did not turn the paragraph into a list" )
		type( "one" )
		XCTAssertEqual( focusedField.value as? String, "One", "The keyboard should have capitalized the first letter" )

		key( "return" ).tap()
		waitForFocus( on: "List text", "Return did not focus a new list item" )
		assertCapitalized( "The list item after Return should start capitalized" )

		// Return on an empty list item ends the list with a paragraph, a
		// separate handler in the list item block.
		key( "return" ).tap()
		waitForFocus(
			on: "Empty block; start writing or type forward slash to choose a block",
			"Return on the empty list item did not focus a paragraph after the list"
		)
		assertCapitalized( "The paragraph after the list should start capitalized" )

		// The earlier fields kept their text.
		XCTAssertEqual( web.textViews[ "Add title" ].value as? String, "Title" )
		XCTAssertEqual( web.textViews[ "Block: Paragraph" ].value as? String, "Hello" )
	}
}
