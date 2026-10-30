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

	func testTapFromQuoteIntoHeadingPlacesCaret() throws {
		let base = ProcessInfo.processInfo.environment[ "WP_BASE_URL" ] ?? "http://127.0.0.1:9400"
		var url = URLComponents( string: base + "/wp-admin/post-new.php" )!
		url.queryItems = [ URLQueryItem(
			name: "content",
			value: "<!-- wp:quote --><blockquote class=\"wp-block-quote\"><!-- wp:paragraph --><p>Quote here</p><!-- /wp:paragraph --></blockquote><!-- /wp:quote --><!-- wp:heading --><h2 class=\"wp-block-heading\">Heading here</h2><!-- /wp:heading --><!-- wp:paragraph --><p>Paragraph here</p><!-- /wp:paragraph -->"
		) ]
		app.launchEnvironment[ "START_URL" ] = url.url!.absoluteString
		app.launch()

		let quote = editor.block( title: "Paragraph", content: "Quote here" )
		let heading = editor.block( title: "Heading 2", content: "Heading here" )
		XCTAssertTrue( heading.waitForExistence( timeout: 240 ), "The post did not load" )

		// The heading has siblings, so it is edited through the canvas
		// wrapper. The paragraph in the quote has none and is edited on
		// its own.
		heading.coordinate( withNormalizedOffset: CGVector( dx: 0.9, dy: 0.5 ) ).tap()
		let keyboard = app.keyboards.firstMatch
		XCTAssertTrue( keyboard.waitForExistence( timeout: 10 ), "The tap did not open the keyboard" )
		quote.coordinate( withNormalizedOffset: CGVector( dx: 0.9, dy: 0.5 ) ).tap()
		app.typeText( "Y" )

		// Tapping the heading moves the caret there.
		heading.coordinate( withNormalizedOffset: CGVector( dx: 0.02, dy: 0.5 ) ).tap()
		app.typeText( "X" )

		// Accessibility lists the blocks in a varying order, so check each.
		XCTAssertTrue( editor.block( title: "Heading 2", content: "XHeading here" ).waitForExistence( timeout: 5 ), "The heading did not get the X" )
		XCTAssertTrue( editor.block( title: "Paragraph", content: "Quote hereY" ).exists, "The quote did not keep only the Y" )
		XCTAssertTrue( editor.block( title: "Paragraph", content: "Paragraph here" ).exists )
		XCTAssertEqual( editor.getBlocks().count, 4 )
	}

	func testTapAfterHidingKeyboardPlacesCaret() throws {
		let base = ProcessInfo.processInfo.environment[ "WP_BASE_URL" ] ?? "http://127.0.0.1:9400"
		var url = URLComponents( string: base + "/wp-admin/post-new.php" )!
		url.queryItems = [ URLQueryItem(
			name: "content",
			value: "<!-- wp:paragraph --><p>First here</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Second here</p><!-- /wp:paragraph -->"
		) ]
		app.launchEnvironment[ "START_URL" ] = url.url!.absoluteString
		app.launch()

		let second = editor.block( title: "Paragraph", content: "Second here" )
		XCTAssertTrue( second.waitForExistence( timeout: 240 ), "The post did not load" )

		second.coordinate( withNormalizedOffset: CGVector( dx: 0.9, dy: 0.5 ) ).tap()
		let keyboard = app.keyboards.firstMatch
		XCTAssertTrue( keyboard.waitForExistence( timeout: 10 ), "The tap did not open the keyboard" )
		app.toolbars[ "Toolbar" ].buttons[ "Done" ].tap()
		XCTAssertTrue( keyboard.waitForNonExistence( timeout: 5 ), "Done did not hide the keyboard" )

		// The block is still selected, but nothing has focus.
		second.coordinate( withNormalizedOffset: CGVector( dx: 0.02, dy: 0.5 ) ).tap()
		XCTAssertTrue( keyboard.waitForExistence( timeout: 10 ), "The tap did not open the keyboard again" )
		app.typeText( "X" )

		XCTAssertTrue( editor.block( title: "Paragraph", content: "XSecond here" ).waitForExistence( timeout: 5 ), "The paragraph did not get the X at its start" )
		XCTAssertTrue( editor.block( title: "Paragraph", content: "First here" ).exists )
		XCTAssertEqual( editor.getBlocks().count, 2 )
	}
}
