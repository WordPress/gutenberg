import XCTest

/// Diagnostic only: runs the plain HTML probe page in several modes and
/// reports whether the keyboard capitalizes after Return in each.
final class ProbeTests: XCTestCase {
	let safari = XCUIApplication( bundleIdentifier: "com.apple.mobilesafari" )
	var keyboard: XCUIElement { safari.keyboards.firstMatch }

	func key( _ label: String ) -> XCUIElement {
		keyboard.descendants( matching: .any )
			.matching( NSPredicate( format: "label ==[c] %@", label ) )
			.firstMatch
	}

	func waitForFocus( _ field: XCUIElement ) -> Bool {
		let focused = NSPredicate( format: "hasKeyboardFocus == true" )
		let done = XCTNSPredicateExpectation( predicate: focused, object: field )
		return XCTWaiter.wait( for: [ done ], timeout: 10 ) == .completed
	}

	func typeLetter( _ letter: String, into field: XCUIElement, expecting: String ) {
		for _ in 1...3 {
			key( letter ).tap()
			let arrived = NSPredicate( format: "value CONTAINS %@", expecting )
			let done = XCTNSPredicateExpectation( predicate: arrived, object: field )
			if XCTWaiter.wait( for: [ done ], timeout: 2 ) == .completed {
				return
			}
		}
	}

	func run( mode query: String ) -> String {
		let base = ProcessInfo.processInfo.environment[ "WP_PLUGIN_URL" ] ?? "http://127.0.0.1:9400/wp-content/plugins/gutenberg"
		XCUIDevice.shared.system.open( URL( string: base + "/test/ios/probe.html?" + query )! )
		safari.activate()
		let web = safari.webViews.firstMatch
		guard web.waitForExistence( timeout: 60 ) else { return "no web view" }
		let first = web.textViews.element( boundBy: 0 )
		guard first.waitForExistence( timeout: 30 ) else { return "no field" }
		first.tap()
		guard waitForFocus( first ) else { return "no focus" }
		guard keyboard.waitForExistence( timeout: 10 ) else { return "no keyboard" }
		let startShift = key( "shift" ).isSelected
		typeLetter( "h", into: first, expecting: "h" )
		typeLetter( "i", into: first, expecting: "i" )
		let beforeReturnShift = key( "shift" ).isSelected
		key( "return" ).tap()
		let second = web.textViews.element( boundBy: 1 )
		let split = second.waitForExistence( timeout: 5 )
		let focusedField = split && waitForFocus( second ) ? second : first
		sleep( 1 )
		let afterReturnShift = key( "shift" ).isSelected
		// The page records whether the first typed character was upper case.
		key( "a" ).tap()
		sleep( 1 )
		let status = web.staticTexts.matching( NSPredicate( format: "label BEGINSWITH 'caret'" ) ).firstMatch
		let statusText = status.exists ? status.label : "(no status)"
		return "shift start=\( startShift ) beforeReturn=\( beforeReturnShift ) afterReturn=\( afterReturnShift ) split=\( split ) focused=\( focusedField == second ? "second" : "first" ) | \( statusText )"
	}

	func testProbeModes() throws {
		let modes = [
			"mode=native",
			"mode=gb",
			"mode=beforeinput",
			"mode=beforeinput&pad=zwnbsp&caret=after",
			"mode=beforeinput&pad=zwnbsp&caret=after&fix=sync",
			"mode=beforeinput&pad=zwnbsp&caret=after&fix=micro",
			"mode=beforeinput&pad=zwnbsp&caret=after&fix=raf",
		]
		var report = ""
		for mode in modes {
			let result = run( mode: mode )
			report += "PROBE \( mode ): \( result )\n"
			print( "PROBE \( mode ): \( result )" )
		}
		let attachment = XCTAttachment( string: report )
		attachment.name = "Probe report"
		attachment.lifetime = .keepAlways
		add( attachment )
	}
}
