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
	/// already has text, as in the reports. Each test takes its own: the
	/// editor autosaves a draft straight into the post, so tests sharing one
	/// would type into each other's text.
	let seededPosts = [ 424242, 424243 ]

	/// The bug is intermittent: one report needed twenty or thirty taps
	/// beside the text before the caret stopped following them.
	let attempts = 25

	var paragraphs: XCUIElementQuery {
		web.textViews.matching( NSPredicate( format: "label == 'Block: Paragraph'" ) )
	}

	var paragraph: XCUIElement { paragraphs.element( boundBy: 0 ) }

	func openSeededPost( _ post: Int ) {
		// The report is from a tablet held either way; landscape leaves the
		// widest canvas beside the text to tap in.
		XCUIDevice.shared.orientation = .landscapeLeft
		open( "/wp-admin/post.php?post=\( post )&action=edit" )

		// The first load on a runner is slow: PHP runs in WebAssembly and
		// nothing is cached yet.
		XCTAssertTrue(
			paragraph.waitForExistence( timeout: 240 ),
			"The seeded post has no paragraphs"
		)
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
		openSeededPost( seededPosts[ 0 ] )

		for attempt in 1...attempts {
			besideTheText().tap()
			assertTheParagraphTakesTheCaret( attempt )
		}
	}

	/// The other way the reports get there: holding and dragging from the
	/// text out to the side, as when scrolling from the edge of the text
	/// container. That gesture is what starts a cross-block selection, which
	/// makes the whole writing flow the editing host until it ends.
	func testDraggingFromTheTextToTheSideKeepsTapsInTheParagraphWorking() throws {
		openSeededPost( seededPosts[ 1 ] )

		for attempt in 1...attempts {
			paragraph.coordinate( withNormalizedOffset: CGVector( dx: 0.5, dy: 0.5 ) )
				.press( forDuration: 0.3, thenDragTo: besideTheText() )
			assertTheParagraphTakesTheCaret( attempt )
		}
	}
}
