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

		// The first synthesized touch of a run can lose its lift inside the
		// simulator: backboardd registers the virtual digitizer after its
		// first event arrives. Spend that touch on the status bar of the home
		// screen, before Safari is up, where it changes nothing.
		let springboard = XCUIApplication( bundleIdentifier: "com.apple.springboard" )
		springboard.coordinate( withNormalizedOffset: CGVector( dx: 0.5, dy: 0.01 ) ).tap()
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
	func waitForFocus( on label: String, _ message: String, timeout: TimeInterval = 10 ) {
		// An empty field holds nothing or the padding character.
		let matches = NSPredicate( format: "label == %@ AND value.length < 2", label )
		let done = XCTNSPredicateExpectation( predicate: matches, object: focusedField )
		XCTAssertEqual( XCTWaiter.wait( for: [ done ], timeout: timeout ), .completed, message )
	}

	/// The line the caret is on: the focused field's text, or its last line
	/// once the canvas is the editing host and the focused field holds the
	/// text of every block. Padding characters do not count.
	var caretLine: String {
		let value = ( focusedField.value as? String ?? "" )
			.replacingOccurrences( of: "\u{FEFF}", with: "" )
		return value.split( separator: "\n", omittingEmptySubsequences: false )
			.last.map( String.init ) ?? ""
	}

	/// Waits until the caret is in a new empty field with this aria-label:
	/// a focused empty field of its own, or, once the canvas is the editing
	/// host, the focused canvas whose last line is empty (a list item's
	/// line starts with its bullet).
	func waitForEmptyField( _ label: String, _ message: String ) {
		let matches = NSPredicate { _, _ in
			let field = self.focusedField
			guard field.exists, let value = field.value as? String else {
				return false
			}
			if field.label == "Editor canvas" {
				return self.caretLine.trimmingCharacters( in: CharacterSet( charactersIn: "•· " ) ).isEmpty
			}
			return field.label == label && value.count < 2
		}
		let done = XCTNSPredicateExpectation( predicate: matches, object: nil )
		XCTAssertEqual( XCTWaiter.wait( for: [ done ], timeout: 10 ), .completed, message )
	}

	func waitForEmptyParagraph( _ message: String ) {
		waitForEmptyField( "Empty block; start writing or type forward slash to choose a block", message )
	}

	/// Waits for the keyboard to finish sliding in. XCUITest waits for
	/// Safari to go idle before a tap, not for the keyboard, which runs in
	/// its own process; a tap during its animation is dropped.
	func waitForKeyboard() {
		let shown = XCTNSPredicateExpectation( predicate: NSPredicate( format: "hittable == true" ), object: key( "return" ) )
		XCTAssertEqual( XCTWaiter.wait( for: [ shown ], timeout: 10 ), .completed, "No software keyboard" )
		var previous = CGRect.null
		for _ in 0 ..< 50 {
			let frame = keyboard.frame
			if frame == previous {
				return
			}
			previous = frame
			usleep( 100_000 )
		}
		XCTFail( "The keyboard kept moving" )
	}

	/// The keyboard updates shortly after focus moves.
	func assertCapitalized( _ message: String ) {
		let upperCase = NSPredicate( format: "label == 'A'" )
		XCTAssertTrue( keyboard.keys.matching( upperCase ).firstMatch.waitForExistence( timeout: 5 ), message )
		XCTAssertTrue( key( "shift" ).isSelected, message )
	}

	func testReturnStartsTheNextFieldCapitalized() throws {
		openNewPost()

		// A new post focuses its title once the editor has loaded, which on
		// a runner takes a minute or more.
		waitForFocus( on: "Add title", "The new post did not focus its title", timeout: 240 )
		waitForKeyboard()
		assertCapitalized( "An empty title should start capitalized" )

		type( "title" )
		XCTAssertEqual( focusedField.value as? String, "Title", "The keyboard should have capitalized the first letter" )
		XCTAssertFalse( key( "shift" ).isSelected, "After a word the keyboard should be lowercase" )

		key( "return" ).tap()
		waitForEmptyParagraph( "Return in the title did not focus an empty paragraph" )
		assertCapitalized( "The paragraph after the title should start capitalized" )

		type( "hello" )
		XCTAssertEqual( caretLine, "Hello", "The keyboard should have capitalized the first letter" )
		XCTAssertFalse( key( "shift" ).isSelected, "After a word the keyboard should be lowercase" )

		// With a second paragraph the canvas becomes the editing host: one
		// field holding every block, with the caret on its last line.
		key( "return" ).tap()
		waitForEmptyParagraph( "Return did not start a new empty paragraph" )
		assertCapitalized( "The paragraph after Return should start capitalized" )

		// Return inside the editing host, from an empty paragraph.
		key( "return" ).tap()
		waitForEmptyParagraph( "Return on the empty paragraph did not start another one" )
		assertCapitalized( "The paragraph after Return in the editing host should start capitalized" )

		// A list item splits differently from a paragraph. Turn this paragraph
		// into a list with the "- " prefix; the dash is on the numbers layout.
		key( "numbers" ).tap()
		key( "-" ).tap()
		key( " " ).tap()
		waitForFocus( on: "List text", "The prefix did not turn the paragraph into a list" )
		type( "one" )
		XCTAssertEqual( caretLine.trimmingCharacters( in: CharacterSet( charactersIn: "•· " ) ), "One", "The keyboard should have capitalized the first letter" )

		key( "return" ).tap()
		waitForEmptyField( "List text", "Return did not start a new list item" )
		assertCapitalized( "The list item after Return should start capitalized" )

		// Return on an empty list item ends the list with a paragraph, a
		// separate handler in the list item block.
		key( "return" ).tap()
		waitForEmptyParagraph( "Return on the empty list item did not start a paragraph after the list" )
		assertCapitalized( "The paragraph after the list should start capitalized" )

		// The earlier fields kept their text.
		XCTAssertEqual( web.textViews[ "Add title" ].value as? String, "Title" )
		XCTAssertTrue( web.textViews.matching( NSPredicate( format: "value CONTAINS 'Hello'" ) ).firstMatch.exists )
	}
}
