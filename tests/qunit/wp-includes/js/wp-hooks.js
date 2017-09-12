/* global wp */
( function( QUnit ) {
	QUnit.module( 'wp-hooks' );

	function filter_a( str ) {
		return str + 'a';
	}

	function filter_b( str ) {
		return str + 'b';
	}

	function filter_c( str ) {
		return str + 'c';
	}

	function action_a() {
		window.actionValue += 'a';
	}

	function action_b() {
		window.actionValue += 'b';
	}

	function action_c() {
		window.actionValue += 'c';
	}

	function filter_check( x ) {
		ok( wp.hooks.doingFilter( 'runtest_filter' ), 'The runtest_filter is running.' );
		return x;
	}

	window.actionValue = '';

	QUnit.test( 'add and remove a filter', function() {
		expect( 1 );
		wp.hooks.addFilter( 'test_filter', 'myPlugin/myNamespace/myCallback', filter_a );
		wp.hooks.removeFilter( 'test_filter', 'myPlugin/myNamespace/myCallback'  );
		equal( wp.hooks.applyFilters( 'test_filter', 'test' ), 'test' );
	} );
	QUnit.test( 'add a filter and run it', function() {
		expect( 1 );
		wp.hooks.addFilter( 'test_filter', 'myPlugin/myNamespace/myCallback_filter_a', filter_a );
		equal( wp.hooks.applyFilters( 'test_filter', 'test' ), 'testa' );
		wp.hooks.removeAllFilters( 'test_filter' );
	} );

	QUnit.test( 'add 2 filters in a row and run them', function() {
		expect( 1 );
		wp.hooks.addFilter( 'test_filter', 'myPlugin/myNamespace/myCallback_filter_a', filter_a );
		wp.hooks.addFilter( 'test_filter', 'myPlugin/myNamespace/myCallback_filter_b', filter_b );
		equal( wp.hooks.applyFilters( 'test_filter', 'test' ), 'testab' );
		wp.hooks.removeAllFilters( 'test_filter' );
	} );

	QUnit.test( 'add 3 filters with different priorities and run them', function() {
		expect( 1 );
		wp.hooks.addFilter( 'test_filter', 'myPlugin/myNamespace/myCallback_filter_a', filter_a );
		wp.hooks.addFilter( 'test_filter', 'myPlugin/myNamespace/myCallback_filter_b', filter_b, 2 );
		wp.hooks.addFilter( 'test_filter', 'myPlugin/myNamespace/myCallback_filter_c', filter_c, 8 );
		equal( wp.hooks.applyFilters( 'test_filter', 'test' ), 'testbca' );
		wp.hooks.removeAllFilters( 'test_filter' );
	} );

	QUnit.test( 'add and remove an action', function() {
		expect( 1 );
		window.actionValue = '';
		wp.hooks.addAction( 'test_action', 'myPlugin/myNamespace/myCallback', action_a );
		wp.hooks.removeAction( 'test_action', 'myPlugin/myNamespace/myCallback' );
		wp.hooks.doAction( 'test_action' );
		equal( window.actionValue, '' );
	} );

	QUnit.test( 'add an action and run it', function() {
		expect( 1 );
		window.actionValue = '';
		wp.hooks.addAction( 'test_action', 'myPlugin/myNamespace/myCallback', action_a );
		wp.hooks.doAction( 'test_action' );
		equal( window.actionValue, 'a' );
		wp.hooks.removeAllActions( 'test_action' );
	} );

	QUnit.test( 'add 2 actions in a row and then run them', function() {
		expect( 1 );
		window.actionValue = '';
		wp.hooks.addAction( 'test_action', 'myPlugin/myNamespace/myCallback', action_a );
		wp.hooks.addAction( 'test_action', 'myPlugin/myNamespace/myCallback', action_b );
		wp.hooks.doAction( 'test_action' );
		equal( window.actionValue, 'ab' );
		wp.hooks.removeAllActions( 'test_action' );
	} );

	QUnit.test( 'add 3 actions with different priorities and run them', function() {
		expect( 1 );
		window.actionValue = '';
		wp.hooks.addAction( 'test_action', 'myPlugin/myNamespace/myCallback', action_a );
		wp.hooks.addAction( 'test_action', 'myPlugin/myNamespace/myCallback', action_b, 2 );
		wp.hooks.addAction( 'test_action', 'myPlugin/myNamespace/myCallback', action_c, 8 );
		wp.hooks.doAction( 'test_action' );
		equal( window.actionValue, 'bca' );
		wp.hooks.removeAllActions( 'test_action' );
	} );

	QUnit.test( 'pass in two arguments to an action', function() {
		var arg1 = 10,
			arg2 = 20;

		expect( 4 );

		wp.hooks.addAction( 'test_action', 'myPlugin/myNamespace/myCallback', function( a, b ) {
			equal( arg1, a );
			equal( arg2, b );
		} );
		wp.hooks.doAction( 'test_action', arg1, arg2 );
		wp.hooks.removeAllActions( 'test_action' );

		equal( arg1, 10 );
		equal( arg2, 20 );
	} );

	QUnit.test( 'fire action multiple times', function() {
		var func;
		expect( 2 );

		func = function() {
			ok( true );
		};

		wp.hooks.addAction( 'test_action', 'myPlugin/myNamespace/myCallback', func );
		wp.hooks.doAction( 'test_action' );
		wp.hooks.doAction( 'test_action' );
		wp.hooks.removeAllActions( 'test_action' );
	} );

	QUnit.test( 'remove specific action callback', function() {
		window.actionValue = '';
		wp.hooks.addAction( 'test_action', 'myPlugin/myNamespace/myCallback_action_a', action_a );
		wp.hooks.addAction( 'test_action', 'myPlugin/myNamespace/myCallback_action_b', action_b, 2 );
		wp.hooks.addAction( 'test_action', 'myPlugin/myNamespace/myCallback_action_c', action_c, 8 );

		wp.hooks.removeAction( 'test_action', 'myPlugin/myNamespace/myCallback_action_b' );
		wp.hooks.doAction( 'test_action' );
		equal( window.actionValue, 'ca' );
		wp.hooks.removeAllActions( 'test_action' );
	} );

	QUnit.test( 'remove all action callbacks', function() {
		window.actionValue = '';
		wp.hooks.addAction( 'test_action', 'myPlugin/myNamespace/myCallback_action_a', action_a );
		wp.hooks.addAction( 'test_action', 'myPlugin/myNamespace/myCallback_action_b', action_b, 2 );
		wp.hooks.addAction( 'test_action', 'myPlugin/myNamespace/myCallback_action_c', action_c, 8 );

		wp.hooks.removeAllActions( 'test_action' );
		wp.hooks.doAction( 'test_action' );
		equal( window.actionValue, '' );
	} );

	QUnit.test( 'remove specific filter callback', function() {
		wp.hooks.addFilter( 'test_filter', 'myPlugin/myNamespace/myCallback_filter_a', filter_a );
		wp.hooks.addFilter( 'test_filter', 'myPlugin/myNamespace/myCallback_filter_b', filter_b, 2 );
		wp.hooks.addFilter( 'test_filter', 'myPlugin/myNamespace/myCallback_filter_c', filter_c, 8 );

		wp.hooks.removeFilter( 'test_filter', 'myPlugin/myNamespace/myCallback_filter_b' );
		equal( wp.hooks.applyFilters( 'test_filter', 'test' ), 'testca' );
		wp.hooks.removeAllFilters( 'test_filter' );
	} );

	QUnit.test( 'remove all filter callbacks', function() {
		wp.hooks.addFilter( 'test_filter', 'myPlugin/myNamespace/myCallback_filter_a', filter_a );
		wp.hooks.addFilter( 'test_filter', 'myPlugin/myNamespace/myCallback_filter_b', filter_b, 2 );
		wp.hooks.addFilter( 'test_filter', 'myPlugin/myNamespace/myCallback_filter_c', filter_c, 8 );

		wp.hooks.removeAllFilters( 'test_filter' );
		equal( wp.hooks.applyFilters( 'test_filter', 'test' ), 'test' );
	} );

	// Test doingAction, didAction, hasAction.
	QUnit.test( 'Test doingAction, didAction and hasAction.', function() {

		// Reset state for testing.
		wp.hooks.removeAllActions( 'test_action' );
		wp.hooks.addAction( 'another_action', 'myPlugin/myNamespace/myCallback', function(){} );
		wp.hooks.doAction( 'another_action' );

		// Verify no action is running yet.
		ok( ! wp.hooks.doingAction( 'newtest_action' ), 'The newtest_action is not running.' );
		equal( wp.hooks.didAction( 'newtest_action' ), 0, 'The newtest_action has not run.' );
		ok( ! wp.hooks.hasAction( 'newtest_action' ), 'The newtest_action is not registered.' );

		wp.hooks.addAction( 'newtest_action', 'myPlugin/myNamespace/myCallback', action_a );

		// Verify action added, not running yet.
		ok( ! wp.hooks.doingAction( 'newtest_action' ), 'The newtest_action is not running.' );
		equal( wp.hooks.didAction( 'newtest_action' ), 0, 'The newtest_action has not run.' );
		ok( wp.hooks.hasAction( 'newtest_action' ), 'The newtest_action is registered.' );

		wp.hooks.doAction( 'newtest_action' );

		// Verify action added and running.
		equal( wp.hooks.didAction( 'newtest_action' ), 1, 'The newtest_action has run once.' );
		ok( wp.hooks.hasAction( 'newtest_action' ), 'The newtest_action is registered.' );

		wp.hooks.doAction( 'newtest_action' );
		equal( wp.hooks.didAction( 'newtest_action' ), 2, 'The newtest_action has run twice.' );

		wp.hooks.removeAllActions( 'newtest_action' );

		// Verify state is reset appropriately.
		equal( wp.hooks.didAction( 'newtest_action' ), 2, 'The newtest_action has run twice.' );
		ok( ! wp.hooks.hasAction( 'newtest_action' ), 'The newtest_action is not registered.' );

		wp.hooks.doAction( 'another_action' );
		ok( ! wp.hooks.doingAction( 'newtest_action' ), 'The newtest_action is running.' );

		// Verify hasAction returns false when no matching action.
		ok( ! wp.hooks.hasAction( 'notanewtest_action' ), 'The notanewtest_action is registered.' );

	} );

	QUnit.test( 'Verify doingFilter, didFilter and hasFilter.', function() {
		expect( 5 );
		wp.hooks.addFilter( 'runtest_filter', 'myPlugin/myNamespace/myCallback', filter_check );
		equal( wp.hooks.applyFilters( 'runtest_filter', 'test' ), 'test' );

		// Verify filter added and running.
		equal( wp.hooks.didFilter( 'runtest_filter' ), 1, 'The runtest_filter has run once.' );
		ok( wp.hooks.hasFilter( 'runtest_filter' ), 'The runtest_filter is registered.' );
		ok( ! wp.hooks.hasFilter( 'notatest_filter' ), 'The notatest_filter is not registered.' );

		wp.hooks.removeAllFilters( 'runtest_filter' );
	} );
/*
*/
} )( window.QUnit );
