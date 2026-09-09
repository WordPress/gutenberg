import XCTest

/// The iOS keyboard capitalizes the first letter of a sentence only when
/// the caret is at the start of an empty field, and only when the field
/// was focused once the key that got it there has been handled. Desktop
/// browsers have no such keyboard, so these tests read the shift key of
/// the software keyboard in Safari on a simulator.
final class AutoCapitalizationTests: SafariTestCase {
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
		XCTAssertTrue( keyboard.waitForExistence( timeout: 10 ), "No software keyboard" )
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
		XCTAssertEqual( ( focusedField.value as? String )?.lowercased(), "one" )

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
