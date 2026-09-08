import XCTest

/// Tapping a paragraph should place the caret in it, every time. On touch
/// devices the caret stops following taps after the canvas beside the text
/// has been touched: the block stays selected but no cursor appears and
/// typing does not reach it, until the editor is reloaded. It is reported
/// from tablets, where the editor lays out as it does on a desktop, so
/// these tests run on an iPad simulator.
///
/// https://github.com/WordPress/gutenberg/issues/72230
/// https://github.com/WordPress/gutenberg/issues/67986
final class CaretPlacementTests: SafariTestCase {
	/// The drafts the blueprint seeds, so the editor opens on a post that
	/// already has text, as in the reports. One per test, because a test
	/// leaves the post it used full of typed characters.
	let tapPost = ( id: 424242, firstParagraph: "First paragraph." )
	let scrollPost = ( id: 424243, firstParagraph: "Alpha paragraph." )

	/// The bug is intermittent: one report needed twenty or thirty taps
	/// beside the text before the caret stopped following them. Kept low
	/// because Safari stops reporting itself idle on this page, after which
	/// every interaction costs XCUITest a sixty second wait.
	let attempts = 10

	var paragraphs: XCUIElementQuery {
		web.textViews.matching( NSPredicate( format: "label == 'Block: Paragraph'" ) )
	}

	var paragraph: XCUIElement { paragraphs.element( boundBy: 0 ) }

	func openSeededPost( _ post: ( id: Int, firstParagraph: String ) ) {
		// The report is from a tablet held either way; landscape leaves the
		// widest canvas beside the text to tap in.
		XCUIDevice.shared.orientation = .landscapeLeft
		open( "/wp-admin/post.php?post=\( post.id )&action=edit", waitingFor: paragraph )

		// The drafts differ only in their text, so this is also what catches
		// a navigation that never happened and left the previous post up.
		let loaded = NSPredicate( format: "value == %@", post.firstParagraph )
		let done = XCTNSPredicateExpectation( predicate: loaded, object: paragraph )
		XCTAssertEqual(
			XCTWaiter.wait( for: [ done ], timeout: 30 ), .completed,
			"""
			Post \( post.id ) did not load. The first paragraph holds \
			"\( paragraph.value as? String ?? "" )".
			"""
		)
	}

	/// Scrolls the canvas with a touch that starts beside the text instead
	/// of on it, the "hold to scroll but from the side of the text
	/// container" of #67986. The press is short: a long one starts a text
	/// selection rather than a scroll. Scrolling back up returns to the top,
	/// where it clamps, so the paragraph stays put over many attempts.
	func scrollBesideTheText() {
		let start = besideTheText()
		start.press( forDuration: 0.05, thenDragTo: start.withOffset( CGVector( dx: 0, dy: -120 ) ) )
		start.press( forDuration: 0.05, thenDragTo: start.withOffset( CGVector( dx: 0, dy: 120 ) ) )
	}

	/// A point level with the first paragraph but just outside its text
	/// container: what the reports call outside the block area. Measured
	/// from the paragraph rather than from the web view, which also spans
	/// the editor's chrome around the canvas.
	func besideTheText() -> XCUICoordinate {
		paragraph.coordinate( withNormalizedOffset: .zero )
			.withOffset( CGVector( dx: -24, dy: paragraph.frame.height / 2 ) )
	}

	/// Taps the first paragraph and checks the two things the issue reports
	/// losing: a caret in that paragraph, and typing that reaches it.
	func assertTheParagraphTakesTheCaret( _ attempt: Int ) {
		// The gesture before this one can leave the editor redrawing, and
		// reading an element that is not in the tree right now raises rather
		// than failing the check that is meant to catch it.
		XCTAssertTrue(
			paragraph.waitForExistence( timeout: 30 ),
			"The paragraphs went missing from the editor on attempt \( attempt )"
		)
		let before = paragraph.value as? String ?? ""
		paragraph.tap()

		// Matched on the text as well as the label, so that the keyboard
		// landing in one of the other paragraphs does not pass for the
		// tapped one and then read as typing that went nowhere.
		let inTheParagraph = NSPredicate(
			format: "label == 'Block: Paragraph' AND value == %@", before
		)
		let landed = XCTNSPredicateExpectation( predicate: inTheParagraph, object: focusedField )
		XCTAssertEqual(
			XCTWaiter.wait( for: [ landed ], timeout: 10 ), .completed,
			"""
			The caret did not land in the tapped paragraph on attempt \( attempt ). \
			The keyboard is in "\( focusedField.label )" holding \
			"\( focusedField.value as? String ?? "" )".
			"""
		)
		XCTAssertTrue(
			keyboard.waitForExistence( timeout: 5 ),
			"No software keyboard on attempt \( attempt )"
		)

		// Where the caret sits within the paragraph depends on where the tap
		// landed, so check that the text grew rather than what it says.
		type( "x" )
		let longer = NSPredicate( format: "value.length == %d", before.count + 1 )
		let typed = XCTNSPredicateExpectation( predicate: longer, object: focusedField )
		XCTAssertEqual(
			XCTWaiter.wait( for: [ typed ], timeout: 5 ), .completed,
			"""
			Typing did not reach the paragraph on attempt \( attempt ). \
			It holds "\( focusedField.value as? String ?? "" )".
			"""
		)
	}

	func testTappingBesideTheTextKeepsTapsInTheParagraphWorking() throws {
		openSeededPost( tapPost )

		for attempt in 1...attempts {
			besideTheText().tap()
			assertTheParagraphTakesTheCaret( attempt )
		}
	}

	func testScrollingBesideTheTextKeepsTapsInTheParagraphWorking() throws {
		openSeededPost( scrollPost )

		for attempt in 1...attempts {
			scrollBesideTheText()
			assertTheParagraphTakesTheCaret( attempt )
		}
	}
}
