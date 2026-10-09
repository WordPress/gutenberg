import XCTest

/// Selecting text across blocks with the native gestures: a double tap
/// selects a word, then dragging a selection handle extends it into the
/// next block. Only touch gestures in Safari go through the selection
/// handles, so desktop end-to-end tests cannot cover this.
final class SelectionTests: XCTestCase {
	let safari = XCUIApplication( bundleIdentifier: "com.apple.mobilesafari" )

	var web: XCUIElement { safari.webViews.firstMatch }

	override func setUpWithError() throws {
		continueAfterFailure = false

		// The first synthesized touch of a run can lose its lift inside the
		// simulator. Spend it on the status bar of the home screen.
		let springboard = XCUIApplication( bundleIdentifier: "com.apple.springboard" )
		springboard.coordinate( withNormalizedOffset: CGVector( dx: 0.5, dy: 0.01 ) ).tap()
	}

	override func tearDownWithError() throws {
		// Temporary diagnostics.
		let pageLog = web.descendants( matching: .any ).matching( NSPredicate( format: "label BEGINSWITH 'PLOG'" ) ).firstMatch
		print( "PLOG\n  " + ( pageLog.exists ? pageLog.label : "missing" ).split( separator: "|" ).joined( separator: "\n  " ) )
		safari.terminate()
	}

	/// Opens the post the blueprint seeds with paragraphs.
	func openPost() {
		let base = ProcessInfo.processInfo.environment[ "WP_BASE_URL" ] ?? "http://127.0.0.1:9400"
		XCUIDevice.shared.system.open( URL( string: base + "/wp-admin/post.php?post=100&action=edit" )! )
		safari.activate()
		XCTAssertTrue( safari.wait( for: .runningForeground, timeout: 30 ) )
	}

	func paragraphs() -> [ String ] {
		web.textViews.matching( NSPredicate( format: "label == 'Block: Paragraph'" ) )
			.allElementsBoundByIndex
			.map { $0.value as? String ?? "" }
	}

	func paragraph( startingWith text: String ) -> XCUIElement {
		web.textViews.matching( NSPredicate( format: "value BEGINSWITH %@", text ) ).firstMatch
	}

	func point( _ x: CGFloat, _ y: CGFloat ) -> XCUICoordinate {
		safari.coordinate( withNormalizedOffset: .zero ).withOffset( CGVector( dx: x, dy: y ) )
	}

	func testHandleExtendsSelectionIntoPreviousParagraph() throws {
		openPost()

		let second = paragraph( startingWith: "Delta echo" )
		XCTAssertTrue( second.waitForExistence( timeout: 240 ), "The post did not load" )

		// Select the second paragraph.
		second.tap()
		let focused = web.textViews.matching( NSPredicate( format: "hasKeyboardFocus == true" ) ).firstMatch
		XCTAssertTrue( focused.waitForExistence( timeout: 10 ), "The tap did not focus the paragraph" )

		let first = paragraph( startingWith: "Alpha bravo" ).frame
		let target = second.frame

		// Double tap the first word, "Delta".
		point( target.minX + 15, target.midY ).doubleTap()
		let cut = safari.menuItems[ "Cut" ]
		XCTAssertTrue( cut.waitForExistence( timeout: 5 ), "The double tap did not select a word" )

		// The start handle's knob sits above the line, at the start of the
		// word. The selection moves by as much as the finger does, so drag
		// the knob up by the distance between the two paragraphs, into
		// "bravo".
		let knob = target.minY - 6
		point( target.minX + 1, knob ).press(
			forDuration: 0.5,
			thenDragTo: point( first.minX + 60, knob - ( target.minY - first.minY ) ),
			withVelocity: 60,
			thenHoldForDuration: 1
		)

		XCTAssertTrue( cut.waitForExistence( timeout: 5 ), "The drag lost the selection" )
		cut.tap()

		// Cutting a selection across the two paragraphs joins what is left
		// of them into one.
		let joined = NSPredicate( format: "value BEGINSWITH 'Alpha b' AND value ENDSWITH 'echo foxtrot'" )
		XCTAssertTrue(
			web.textViews.matching( joined ).firstMatch.waitForExistence( timeout: 5 ),
			"The selection did not extend into the previous paragraph: \( paragraphs() )"
		)
		XCTAssertFalse( paragraphs().contains { $0.contains( "Delta" ) }, "The selected word is still there" )
		XCTAssertEqual( paragraphs().count, 6, "The two paragraphs did not join" )
	}
}
