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

		// Select the second paragraph.
		second.tap()
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

	/// Opens the block editor that is not in an iframe, like GutenbergKit's,
	/// with these blocks.
	func openStandaloneEditor( content: String ) {
		let base = ProcessInfo.processInfo.environment[ "WP_BASE_URL" ] ?? "http://127.0.0.1:9400"
		var url = URLComponents( string: base + "/wp-admin/admin.php" )!
		url.queryItems = [
			URLQueryItem( name: "page", value: "standalone-editor" ),
			URLQueryItem( name: "content", value: content ),
		]
		app.launchEnvironment[ "START_URL" ] = url.url!.absoluteString
		app.launch()
	}

	func testTapFromHeadingIntoQuoteWithoutIframePlacesCaret() throws {
		openStandaloneEditor( content: "<!-- wp:quote --><blockquote class=\"wp-block-quote\"><!-- wp:paragraph --><p>Quote here</p><!-- /wp:paragraph --></blockquote><!-- /wp:quote --><!-- wp:heading --><h2 class=\"wp-block-heading\">Heading here</h2><!-- /wp:heading --><!-- wp:paragraph --><p>Paragraph here</p><!-- /wp:paragraph -->" )

		let quote = editor.block( title: "Paragraph", content: "Quote here" )
		let heading = editor.block( title: "Heading 2", content: "Heading here" )
		XCTAssertTrue( heading.waitForExistence( timeout: 240 ), "The editor did not load" )

		// The heading has siblings, so it is edited through the canvas
		// wrapper. The paragraph in the quote has none and is edited on
		// its own.
		heading.coordinate( withNormalizedOffset: CGVector( dx: 0.9, dy: 0.5 ) ).tap()
		let keyboard = app.keyboards.firstMatch
		XCTAssertTrue( keyboard.waitForExistence( timeout: 10 ), "The tap did not open the keyboard" )
		quote.coordinate( withNormalizedOffset: CGVector( dx: 0.02, dy: 0.5 ) ).tap()
		app.typeText( "X" )

		XCTAssertTrue( editor.block( title: "Paragraph", content: "XQuote here" ).waitForExistence( timeout: 5 ), "The quote did not get the X" )
		XCTAssertTrue( editor.block( title: "Heading 2", content: "Heading here" ).exists, "The heading changed" )
		XCTAssertTrue( editor.block( title: "Paragraph", content: "Paragraph here" ).exists )
	}

	func testScrollFromQuoteKeepsSelectionAcrossBlocks() throws {
		// Enough paragraphs after the heading for the canvas to scroll.
		let filler = ( 1...20 ).map { "<!-- wp:paragraph --><p>Filler \( $0 )</p><!-- /wp:paragraph -->" }.joined()
		openStandaloneEditor( content: "<!-- wp:quote --><blockquote class=\"wp-block-quote\"><!-- wp:paragraph --><p>Quote here</p><!-- /wp:paragraph --></blockquote><!-- /wp:quote --><!-- wp:paragraph --><p>Alpha bravo</p><!-- /wp:paragraph --><!-- wp:heading --><h2 class=\"wp-block-heading\">Delta echo</h2><!-- /wp:heading -->" + filler )

		let quote = editor.block( title: "Paragraph", content: "Quote here" )
		let paragraph = editor.block( title: "Paragraph", content: "Alpha bravo" )
		let heading = editor.block( title: "Heading 2", content: "Delta echo" )
		XCTAssertTrue( heading.waitForExistence( timeout: 240 ), "The editor did not load" )

		heading.coordinate( withNormalizedOffset: CGVector( dx: 0.9, dy: 0.5 ) ).tap()
		let keyboard = app.keyboards.firstMatch
		XCTAssertTrue( keyboard.waitForExistence( timeout: 10 ), "The tap did not open the keyboard" )

		// A touch that starts on the quote and scrolls the canvas. Slowly,
		// and held at the end, so the canvas doesn't keep scrolling.
		let start = quote.coordinate( withNormalizedOffset: CGVector( dx: 0.5, dy: 0.5 ) )
		let top = stableFrame( of: heading ).minY
		start.press( forDuration: 0.05, thenDragTo: start.withOffset( CGVector( dx: 0, dy: -30 ) ), withVelocity: 100, thenHoldForDuration: 0.5 )
		let target = stableFrame( of: heading )
		XCTAssertNotEqual( target.minY, top, "The touch did not scroll" )

		// Select the first word of the heading and drag the start handle to
		// the start of the paragraph above, as in
		// testHandleExtendsSelectionIntoPreviousParagraph.
		point( target.minX + 15, target.midY ).doubleTap()
		let cut = app.menuItems[ "Cut" ]
		let select = app.menuItems[ "Select" ]
		if !cut.waitForExistence( timeout: 5 ) && select.exists {
			select.tap()
		}
		XCTAssertTrue( cut.waitForExistence( timeout: 5 ), "The double tap did not select a word" )
		let alpha = paragraph.frame
		let knob = target.minY - 6
		point( target.minX + 1, knob ).press(
			forDuration: 0.5,
			thenDragTo: point( alpha.minX + 1, knob - ( target.minY - alpha.minY ) ),
			withVelocity: 60,
			thenHoldForDuration: 1
		)
		XCTAssertTrue( cut.waitForExistence( timeout: 5 ), "The drag lost the selection" )

		cut.tap()

		XCTAssertTrue( editor.block( title: "Paragraph", content: " echo" ).waitForExistence( timeout: 5 ), "The cut did not join the paragraph and the heading" )
	}
}
