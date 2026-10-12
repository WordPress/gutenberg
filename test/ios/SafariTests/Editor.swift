import XCTest

/// A block in the editor canvas as accessibility reports it: the title from
/// its "Block: <title>" label and its content as text. Safari gives a UI
/// test no way to run the editor's JavaScript, so this stands in for the
/// block list of the Playwright end-to-end tests.
struct Block: Equatable, CustomStringConvertible {
	let title: String
	let content: String

	var description: String {
		"\( title ): \"\( content )\""
	}
}

/// Utilities for the block editor in Safari.
struct Editor {
	let safari: XCUIApplication

	var canvas: XCUIElement {
		safari.webViews.firstMatch
	}

	/// The block with this title and exactly this content.
	func block( title: String, content: String ) -> XCUIElement {
		canvas.descendants( matching: .any )
			.matching( NSPredicate( format: "label == %@ AND value == %@", "Block: " + title, content ) )
			.firstMatch
	}

	/// The blocks in the canvas, in document order.
	func getBlocks() -> [ Block ] {
		canvas.descendants( matching: .any )
			.matching( NSPredicate( format: "label BEGINSWITH 'Block: '" ) )
			.allElementsBoundByIndex
			.map { Block( title: String( $0.label.dropFirst( "Block: ".count ) ), content: $0.value as? String ?? "" ) }
	}

	/// Waits until the canvas holds exactly these blocks.
	func expectBlocks(
		_ expected: [ Block ],
		timeout: TimeInterval = 5,
		file: StaticString = #filePath,
		line: UInt = #line
	) {
		let deadline = Date( timeIntervalSinceNow: timeout )
		var actual = getBlocks()
		while actual != expected && Date() < deadline {
			usleep( 250_000 )
			actual = getBlocks()
		}
		XCTAssertEqual( actual, expected, "The blocks differ", file: file, line: line )
	}
}
