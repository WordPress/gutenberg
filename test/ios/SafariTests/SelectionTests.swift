import XCTest

/// Selecting text across blocks with the native gestures: a double tap
/// selects a word, then dragging a selection handle extends it into the
/// next block. Only touch gestures go through the selection handles, so
/// desktop end-to-end tests cannot cover this.
final class SelectionTests: XCTestCase {
	let app = XCUIApplication()

	var web: XCUIElement { app.webViews.firstMatch }
	var editor: Editor { Editor( app: app ) }

	override func setUpWithError() throws {
		continueAfterFailure = false

		// The first synthesized touch of a run can lose its lift inside the
		// simulator. Spend it on the status bar of the home screen.
		let springboard = XCUIApplication( bundleIdentifier: "com.apple.springboard" )
		springboard.coordinate( withNormalizedOffset: CGVector( dx: 0.5, dy: 0.01 ) ).tap()
	}

	override func tearDownWithError() throws {
		app.terminate()
	}

	func point( _ x: CGFloat, _ y: CGFloat ) -> XCUICoordinate {
		app.coordinate( withNormalizedOffset: .zero ).withOffset( CGVector( dx: x, dy: y ) )
	}

	func testHandleExtendsSelectionIntoPreviousParagraph() throws {
		// A new post starting with this content: run.sh passes the content
		// argument of post-new.php through unescaped.
		let base = ProcessInfo.processInfo.environment[ "WP_BASE_URL" ] ?? "http://127.0.0.1:9400"
		var url = URLComponents( string: base + "/wp-admin/post-new.php" )!
		url.queryItems = [ URLQueryItem(
			name: "content",
			value: "<!-- wp:paragraph --><p>Alpha <em>bravo</em> charlie</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Delta echo foxtrot</p><!-- /wp:paragraph -->"
		) ]
		app.launchEnvironment[ "START_URL" ] = url.url!.absoluteString
		app.launch()

		let second = editor.block( title: "Paragraph", content: "Delta echo foxtrot" )
		XCTAssertTrue( second.waitForExistence( timeout: 240 ), "The post did not load" )

		// Select the second paragraph, with the caret at the end of its line:
		// a tap on the caret opens the edit menu instead of selecting a word.
		second.coordinate( withNormalizedOffset: CGVector( dx: 0.9, dy: 0.5 ) ).tap()
		let focused = web.textViews.matching( NSPredicate( format: "hasKeyboardFocus == true" ) ).firstMatch
		XCTAssertTrue( focused.waitForExistence( timeout: 10 ), "The tap did not focus the paragraph" )

		// The emphasis makes "bravo" a text element of its own, with its
		// own frame.
		let bravo = web.staticTexts[ "bravo" ].frame
		let target = second.frame

		// Double tap the first word, "Delta".
		point( target.minX + 15, target.midY ).doubleTap()
		let cut = app.menuItems[ "Cut" ]
		XCTAssertTrue( cut.waitForExistence( timeout: 5 ), "The double tap did not select a word" )

		// The start handle's knob sits above the line, at the start of the
		// word. The selection moves by as much as the finger does, so drag
		// the knob by the distance from the start of "Delta" to the start of
		// "bravo".
		let knob = target.minY - 6
		point( target.minX + 1, knob ).press(
			forDuration: 0.5,
			thenDragTo: point( bravo.minX + 1, knob - ( target.minY - bravo.minY ) ),
			withVelocity: 60,
			thenHoldForDuration: 1
		)
		XCTAssertTrue( cut.waitForExistence( timeout: 5 ), "The drag lost the selection" )

		cut.tap()

		// Cutting a selection across the two paragraphs joins what is left
		// of them into one.
		editor.expectBlocks( [ Block( title: "Paragraph", content: "Alpha  echo foxtrot" ) ] )
	}
}
