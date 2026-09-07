import XCTest

/// The iOS keyboard capitalizes the first letter of a sentence only when
/// the caret is at the start of an empty field, and only when the field
/// was focused once the key that got it there has been handled. Desktop
/// browsers have no such keyboard, so these tests read the shift key of
/// the software keyboard in Safari on a simulator.
final class AutoCapitalizationTests: XCTestCase {
	let safari = XCUIApplication( bundleIdentifier: "com.apple.mobilesafari" )

	// The fields' aria-labels, which tell a paragraph block from any other
	// editable element.
	let emptyParagraphLabel = "Empty block; start writing or type forward slash to choose a block"
	let paragraphLabel = "Block: Paragraph"

	var keyboard: XCUIElement { safari.keyboards.firstMatch }

	override func setUpWithError() throws {
		continueAfterFailure = false
	}

	func openNewPost() -> XCUIElement {
		let base = ProcessInfo.processInfo.environment[ "WP_BASE_URL" ] ?? "http://127.0.0.1:9400"
		// Opened by the system, not through the app: XCUITest cannot launch
		// Safari itself, only attach to it.
		XCUIDevice.shared.system.open( URL( string: base + "/wp-admin/post-new.php" )! )
		safari.activate()
		XCTAssertTrue( safari.wait( for: .runningForeground, timeout: 30 ) )
		let web = safari.webViews.firstMatch
		XCTAssertTrue( web.waitForExistence( timeout: 60 ), "The editor did not load" )
		return web
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

	func waitForFocus( _ field: XCUIElement, _ message: String ) {
		let focused = NSPredicate( format: "hasKeyboardFocus == true" )
		let done = XCTNSPredicateExpectation( predicate: focused, object: field )
		XCTAssertEqual( XCTWaiter.wait( for: [ done ], timeout: 10 ), .completed, message )
	}

	/// The keyboard updates shortly after focus moves.
	func assertCapitalized( _ message: String ) {
		let upperCase = NSPredicate( format: "label == 'A'" )
		XCTAssertTrue( keyboard.keys.matching( upperCase ).firstMatch.waitForExistence( timeout: 5 ), message )
		XCTAssertTrue( key( "shift" ).isSelected, message )
	}

	func testReturnStartsTheNextFieldCapitalized() throws {
		let web = openNewPost()
		// Fields in document order: the title, then the paragraphs.
		let title = web.textViews.element( boundBy: 0 )
		let firstParagraph = web.textViews.element( boundBy: 1 )
		let secondParagraph = web.textViews.element( boundBy: 2 )

		// A new post focuses the title. The first load on a runner is slow:
		// PHP runs in WebAssembly and nothing is cached yet.
		XCTAssertTrue( title.waitForExistence( timeout: 240 ), "The new post has no title field" )
		waitForFocus( title, "The title is not focused" )
		XCTAssertEqual( title.label, "Add title" )
		XCTAssertTrue( keyboard.waitForExistence( timeout: 10 ), "No software keyboard" )
		assertCapitalized( "An empty title should start capitalized" )

		type( "Title" )
		XCTAssertEqual( title.value as? String, "Title" )
		XCTAssertFalse( key( "shift" ).isSelected, "After a word the keyboard should be lowercase" )

		key( "return" ).tap()
		XCTAssertTrue( firstParagraph.waitForExistence( timeout: 10 ), "Return in the title did not create a paragraph" )
		waitForFocus( firstParagraph, "The paragraph after the title is not focused" )
		XCTAssertEqual( firstParagraph.label, emptyParagraphLabel )
		assertCapitalized( "The paragraph after the title should start capitalized" )

		type( "Hello" )
		XCTAssertEqual( firstParagraph.value as? String, "Hello" )
		XCTAssertEqual( firstParagraph.label, paragraphLabel )
		XCTAssertFalse( key( "shift" ).isSelected, "After a word the keyboard should be lowercase" )

		key( "return" ).tap()
		XCTAssertTrue( secondParagraph.waitForExistence( timeout: 10 ), "Return did not create a paragraph" )
		waitForFocus( secondParagraph, "The new paragraph is not focused" )
		XCTAssertEqual( secondParagraph.label, emptyParagraphLabel )
		assertCapitalized( "The paragraph after Return should start capitalized" )

		// The earlier fields kept their text.
		XCTAssertEqual( title.value as? String, "Title" )
		XCTAssertEqual( firstParagraph.value as? String, "Hello" )
	}
}
