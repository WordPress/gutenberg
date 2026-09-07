import XCTest

/// The iOS keyboard capitalizes the first letter of a sentence only when
/// the caret is at the start of an empty field, and only when the field
/// was focused once the key that got it there has been handled. Desktop
/// browsers have no such keyboard, so these tests read the shift key of
/// the software keyboard in Safari on a simulator.
final class AutoCapitalizationTests: XCTestCase {
	let safari = XCUIApplication( bundleIdentifier: "com.apple.mobilesafari" )

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

	/// A tap while another field has the keyboard does not always move it,
	/// so tap until the field has the keyboard focus.
	func focus( _ field: XCUIElement ) {
		for _ in 1...3 {
			field.tap()
			let focused = NSPredicate( format: "hasKeyboardFocus == true" )
			let done = XCTNSPredicateExpectation( predicate: focused, object: field )
			if XCTWaiter.wait( for: [ done ], timeout: 2 ) == .completed {
				return
			}
		}
		XCTFail( "The field did not receive focus" )
	}

	/// Letters are keys, labelled in the case the keyboard currently shows;
	/// shift and return are buttons.
	func key( _ label: String ) -> XCUIElement {
		keyboard.descendants( matching: .any )
			.matching( NSPredicate( format: "label ==[c] %@", label ) )
			.firstMatch
	}

	func shiftIsOn() -> Bool {
		key( "shift" ).isSelected
	}

	func testReturnStartsTheNextParagraphCapitalized() throws {
		let web = openNewPost()
		// A new post has no blocks yet: the appender inserts the paragraph.
		let appender = web.textViews[ "Add default block" ]
		XCTAssertTrue( appender.waitForExistence( timeout: 60 ), "The new post did not show the appender" )
		appender.tap()
		// Fields in document order: the title, then the paragraphs.
		let paragraph = web.textViews.element( boundBy: 1 )
		XCTAssertTrue( paragraph.waitForExistence( timeout: 10 ), "No paragraph was inserted" )

		focus( paragraph )
		XCTAssertTrue( keyboard.waitForExistence( timeout: 10 ), "No software keyboard" )
		XCTAssertTrue( shiftIsOn(), "An empty paragraph should start capitalized" )

		for letter in "Hello" {
			key( String( letter ) ).tap()
		}
		XCTAssertEqual( paragraph.value as? String, "Hello" )
		XCTAssertFalse( shiftIsOn(), "After a word the keyboard should be lowercase" )

		key( "return" ).tap()
		let next = web.textViews.element( boundBy: 2 )
		XCTAssertTrue( next.waitForExistence( timeout: 10 ), "Return did not create a paragraph" )
		// The keyboard updates shortly after focus moves.
		XCTAssertTrue(
			keyboard.keys.matching( NSPredicate( format: "label == 'A'" ) ).firstMatch.waitForExistence( timeout: 5 ),
			"The paragraph after Return should start capitalized"
		)
		XCTAssertTrue( shiftIsOn() )
	}
}
