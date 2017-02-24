/*global wpNavMenu */
( function( QUnit, $ ) {
	QUnit.module( 'nav-menu' );
	var assert,
		eventsExpected = 3,
		eventsFired = 0;

	// Fail if we don't see the expected number of events triggered in 1500 ms.
	setTimeout( function() {
		// QUnit may load this file without running it, in which case `assert`
		// will never be set to `assertPassed` below.
		assert && assert.equal(
			eventsFired,
			eventsExpected,
			eventsExpected + ' wpNavMenu events should fire.'
		);
	}, 1500 );

	QUnit.test( 'Testing wpNavMenu event triggers.', function( assertPassed ) {
		assert = assertPassed;

		assert.expect( 3 );

		var testString = '<div>Hello World</div>';

		// Mock the internal function calls so the don't fail.
		$.fn.hideAdvancedMenuItemFields = function() {
			return {
				'appendTo':       function() { return true; },
				'prependTo':      function() { return true; }
			};
		};

		$.fn.extend( {
			'childMenuItems':  function() { return $(); },
			'shiftDepthClass': function() { return $(); }
		} );

		// Set up the events we should test.
		var eventsToTest = [
			{
				'event':         'addMenuItemToBottom',
				'data':          testString,
				'expect':        $( testString ),
				'shouldTrigger': 'menu-item-added'
			},
			{
				'event':         'addMenuItemToTop',
				'data':          testString,
				'expect':        $( testString ),
				'shouldTrigger': 'menu-item-added'
			},
			{
				'event':         'removeMenuItem',
				'data':          $( testString ),
				'expect':        $( testString ),
				'shouldTrigger': 'menu-removing-item'
			}
		];

		// Test each of the events.
		_.each( eventsToTest, function( theEvent ) {

			var done = assert.async();

			$( document ).on( theEvent.shouldTrigger, function( evt, passed ) {
				assert.equal(
					passed.html(),
					theEvent.expect.html(),
					'The ' + theEvent.event + ' should trigger ' + theEvent.shouldTrigger + '.'
				);
				eventsFired++;
				done();
			} );
			wpNavMenu[ theEvent.event ]( theEvent.data );
			$( document ).off( theEvent.shouldTrigger );
		} );

	} );


} )( window.QUnit, jQuery );
