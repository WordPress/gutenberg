import XCTest

/// Selecting text across blocks with the native gestures: a double tap
/// selects a word, then dragging a selection handle extends it into the
/// next block. Only touch gestures go through the selection handles, so
/// desktop end-to-end tests cannot cover this.
final class SelectionTests: XCTestCase {
	let app = XCUIApplication()

	/// How long the first tap gets to focus the paragraph before a retry.
	/// Focus can take over 3 seconds to show when the tap lands, and a
	/// retry on a paragraph that is about to focus opens the edit menu, so
	/// retry only once the tap has clearly been dropped.
	static let focusRetryTimeout: TimeInterval = 10
	/// How long the keyboard and the canvas get to settle after focus.
	static let settleTimeout: TimeInterval = 5
	/// The pause between two reads of a frame while it settles.
	static let settleInterval: useconds_t = 250_000

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

	/// The element's frame once two reads in a row agree. The keyboard and
	/// its accessory bar slide in after focus and move the canvas, so an
	/// early read points at where the element was, e.g. on the accessory bar.
	func stableFrame( of element: XCUIElement ) -> CGRect {
		let deadline = Date( timeIntervalSinceNow: Self.settleTimeout )
		var previous = element.frame
		usleep( Self.settleInterval )
		var current = element.frame
		while current != previous && Date() < deadline {
			previous = current
			usleep( Self.settleInterval )
			current = element.frame
		}
		return current
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
		// The simulator now and then drops a tap, like the first one of a
		// run, so tap again if focus does not show.
		let lineEnd = second.coordinate( withNormalizedOffset: CGVector( dx: 0.9, dy: 0.5 ) )
		lineEnd.tap()
		let focused = web.textViews.matching( NSPredicate( format: "hasKeyboardFocus == true" ) ).firstMatch
		if !focused.waitForExistence( timeout: Self.focusRetryTimeout ) {
			lineEnd.tap()
		}
		XCTAssertTrue( focused.waitForExistence( timeout: 10 ), "The tap did not focus the paragraph" )

		// Focus that shows long after the tap no longer counts as the
		// tap's, and WebKit then focuses the paragraph without the
		// keyboard. The next tap brings the keyboard up without moving the
		// caret, so spend a tap on it here, not the double tap below.
		let keyboard = app.keyboards.firstMatch
		if !keyboard.waitForExistence( timeout: Self.settleTimeout ) {
			lineEnd.tap()
		}
		XCTAssertTrue( keyboard.waitForExistence( timeout: Self.settleTimeout ), "No software keyboard" )

		// Wait for the canvas to stop moving under the keyboard, so the
		// frames below are where the words are now.
		let target = stableFrame( of: second )

		// The emphasis makes "bravo" a text element of its own, with its
		// own frame.
		let bravo = web.staticTexts[ "bravo" ].frame

		// Double tap the first word, "Delta". The simulator now and then
		// delivers the double tap as two single taps: the second lands on
		// the caret the first placed and opens the Paste, Select, Select All
		// menu. Its Select selects the word at the caret, "Delta".
		point( target.minX + 15, target.midY ).doubleTap()
		let cut = app.menuItems[ "Cut" ]
		let select = app.menuItems[ "Select" ]
		if !cut.waitForExistence( timeout: 5 ) && select.exists {
			select.tap()
		}
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

	func testTapAfterDismissingKeyboardPlacesCaret() throws {
		let base = ProcessInfo.processInfo.environment[ "WP_BASE_URL" ] ?? "http://127.0.0.1:9400"
		var url = URLComponents( string: base + "/wp-admin/post-new.php" )!
		url.queryItems = [ URLQueryItem(
			name: "content",
			value: "<!-- wp:paragraph --><p>Alpha bravo charlie</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Delta echo foxtrot</p><!-- /wp:paragraph -->"
		) ]
		app.launchEnvironment[ "START_URL" ] = url.url!.absoluteString
		app.launch()

		// Two blocks, so the selected one is edited through the canvas
		// wrapper: a single block is edited on its own.
		let paragraph = editor.block( title: "Paragraph", content: "Alpha bravo charlie" )
		XCTAssertTrue( paragraph.waitForExistence( timeout: 240 ), "The post did not load" )

		paragraph.coordinate( withNormalizedOffset: CGVector( dx: 0.9, dy: 0.5 ) ).tap()
		let keyboard = app.keyboards.firstMatch
		XCTAssertTrue( keyboard.waitForExistence( timeout: 10 ), "The tap did not open the keyboard" )

		// The Done button above the keyboard ends editing but leaves the
		// block selected.
		app.buttons[ "Done" ].tap()
		XCTAssertTrue( keyboard.waitForNonExistence( timeout: 5 ), "The keyboard did not close" )

		// Tapping the selected block again places the caret there.
		paragraph.coordinate( withNormalizedOffset: CGVector( dx: 0.02, dy: 0.5 ) ).tap()
		XCTAssertTrue( keyboard.waitForExistence( timeout: 5 ), "The second tap did not open the keyboard" )
		app.typeText( "X" )

		editor.expectBlocks( [
			Block( title: "Paragraph", content: "XAlpha bravo charlie" ),
			Block( title: "Paragraph", content: "Delta echo foxtrot" ),
		] )
	}
}
