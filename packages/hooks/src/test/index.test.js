/**
 * Internal dependencies
 */
import HOOKS from '../hooks';
import {
	addAction,
	addFilter,
	removeAction,
	removeFilter,
	removeAllActions,
	removeAllFilters,
	hasAction,
	hasFilter,
	doAction,
	applyFilters,
	currentAction,
	currentFilter,
	doingAction,
	doingFilter,
	didAction,
	didFilter,
} from '../';

function filter_a( str ) {
	return str + 'a';
}

function filter_b( str ) {
	return str + 'b';
}

function filter_c( str ) {
	return str + 'c';
}

function filter_b_removes_self( str ) {
	removeFilter( 'test.filter', filter_b_removes_self );
	return str + 'b';
}

function filter_removes_b( str ) {
	removeFilter( 'test.filter', filter_b );
	return str;
}

function filter_removes_c( str ) {
	removeFilter( 'test.filter', filter_c );
	return str;
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

beforeEach( () => {
	window.actionValue = '';
	// Reset state in between tests (clear all callbacks, `didAction` counts,
	// etc.)  Just reseting HOOKS.actions and HOOKS.filters is not enough
	// because the internal functions have references to the original objects.
	[ HOOKS.actions, HOOKS.filters ].forEach( hooks => {
		for ( const k in hooks ) {
			delete hooks[ k ];
		}
	} );
} );

test( 'add and remove a filter', () => {
	addFilter( 'test.filter', filter_a );
	removeAllFilters( 'test.filter' );
	expect( applyFilters( 'test.filter', 'test' ) ).toBe( 'test' );
} );

test( 'add a filter and run it', () => {
	addFilter( 'test.filter', filter_a );
	expect( applyFilters( 'test.filter', 'test' ) ).toBe( 'testa' );
} );

test( 'add 2 filters in a row and run them', () => {
	addFilter( 'test.filter', filter_a );
	addFilter( 'test.filter', filter_b );
	expect( applyFilters( 'test.filter', 'test' ) ).toBe( 'testab' );
} );

test( 'add 3 filters with different priorities and run them', () => {
	addFilter( 'test.filter', filter_a );
	addFilter( 'test.filter', filter_b, 2 );
	addFilter( 'test.filter', filter_c, 8 );
	expect( applyFilters( 'test.filter', 'test' ) ).toBe( 'testbca' );
} );

test( 'filters with the same and different priorities', () => {
	const callbacks = {};

	[ 1, 2, 3, 4 ].forEach( priority => {
		[ 'a', 'b', 'c', 'd' ].forEach( string => {
			callbacks[ 'fn_' + priority + string ] = value => {
				return value.concat( priority + string );
			};
		} );
	} );

	addFilter( 'test_order', callbacks.fn_3a, 3 );
	addFilter( 'test_order', callbacks.fn_3b, 3 );
	addFilter( 'test_order', callbacks.fn_3c, 3 );
	addFilter( 'test_order', callbacks.fn_2a, 2 );
	addFilter( 'test_order', callbacks.fn_2b, 2 );
	addFilter( 'test_order', callbacks.fn_2c, 2 );

	expect( applyFilters( 'test_order', [] ) ).toEqual(
		[ '2a', '2b', '2c', '3a', '3b', '3c' ]
	);

	removeFilter( 'test_order', callbacks.fn_2b );
	removeFilter( 'test_order', callbacks.fn_3a );

	expect( applyFilters( 'test_order', [] ) ).toEqual(
		[ '2a', '2c', '3b', '3c' ]
	);

	addFilter( 'test_order', callbacks.fn_4a, 4 );
	addFilter( 'test_order', callbacks.fn_4b, 4 );
	addFilter( 'test_order', callbacks.fn_1a, 1 );
	addFilter( 'test_order', callbacks.fn_4c, 4 );
	addFilter( 'test_order', callbacks.fn_1b, 1 );
	addFilter( 'test_order', callbacks.fn_3d, 3 );
	addFilter( 'test_order', callbacks.fn_4d, 4 );
	addFilter( 'test_order', callbacks.fn_1c, 1 );
	addFilter( 'test_order', callbacks.fn_2d, 2 );
	addFilter( 'test_order', callbacks.fn_1d, 1 );

	expect( applyFilters( 'test_order', [] ) ).toEqual( [
		// all except 2b and 3a, which we removed earlier
		'1a', '1b', '1c', '1d',
		'2a', '2c', '2d',
		'3b', '3c', '3d',
		'4a', '4b', '4c', '4d',
	] );
} );

test( 'add and remove an action', () => {
	addAction( 'test.action', action_a );
	removeAllActions( 'test.action' );
	doAction( 'test.action' );
	expect( window.actionValue ).toBe( '' );
} );

test( 'add an action and run it', function() {
	addAction( 'test.action', action_a );
	doAction( 'test.action' );
	expect( window.actionValue ).toBe( 'a' );
} );

test( 'add 2 actions in a row and then run them', function() {
	addAction( 'test.action', action_a );
	addAction( 'test.action', action_b );
	doAction( 'test.action' );
	expect( window.actionValue ).toBe( 'ab' );
} );

test( 'add 3 actions with different priorities and run them', function() {
	addAction( 'test.action', action_a );
	addAction( 'test.action', action_b, 2 );
	addAction( 'test.action', action_c, 8 );
	doAction( 'test.action' );
	expect( window.actionValue ).toBe( 'bca' );
} );

test( 'pass in two arguments to an action', function() {
	const arg1 = { a: 10 };
	const arg2 = { b: 20 };

	addAction( 'test.action', function( a, b ) {
		expect( a ).toBe( arg1 );
		expect( b ).toBe( arg2 );
	} );
	doAction( 'test.action', arg1, arg2 );
} );

test( 'fire action multiple times', function() {
	expect.assertions( 2 );

	function func() {
		expect( true ).toBe( true );
	};

	addAction( 'test.action', func );
	doAction( 'test.action' );
	doAction( 'test.action' );
} );

test( 'remove specific action callback', function() {
	addAction( 'test.action', action_a );
	addAction( 'test.action', action_b, 2 );
	addAction( 'test.action', action_c, 8 );

	removeAction( 'test.action', action_b );
	doAction( 'test.action' );
	expect( window.actionValue ).toBe( 'ca' );
} );

test( 'remove all action callbacks', function() {
	addAction( 'test.action', action_a );
	addAction( 'test.action', action_b, 2 );
	addAction( 'test.action', action_c, 8 );

	removeAllActions( 'test.action' );
	doAction( 'test.action' );
	expect( window.actionValue ).toBe( '' );
} );

test( 'remove specific filter callback', function() {
	addFilter( 'test.filter', filter_a );
	addFilter( 'test.filter', filter_b, 2 );
	addFilter( 'test.filter', filter_c, 8 );

	removeFilter( 'test.filter', filter_b );
	expect( applyFilters( 'test.filter', 'test' ) ).toBe( 'testca' );
} );

test( 'filter removes a callback that has already executed', function() {
	addFilter( 'test.filter', filter_a, 1 );
	addFilter( 'test.filter', filter_b, 3 );
	addFilter( 'test.filter', filter_c, 5 );
	addFilter( 'test.filter', filter_removes_b, 4 );

	expect( applyFilters( 'test.filter', 'test' ) ).toBe( 'testabc' );
} );

test( 'filter removes a callback that has already executed (same priority)', function() {
	addFilter( 'test.filter', filter_a, 1 );
	addFilter( 'test.filter', filter_b, 2 );
	addFilter( 'test.filter', filter_removes_b, 2 );
	addFilter( 'test.filter', filter_c, 4 );

	expect( applyFilters( 'test.filter', 'test' ) ).toBe( 'testabc' );
} );

test( 'filter removes the current callback', function() {
	addFilter( 'test.filter', filter_a, 1 );
	addFilter( 'test.filter', filter_b_removes_self, 3 );
	addFilter( 'test.filter', filter_c, 5 );

	expect( applyFilters( 'test.filter', 'test' ) ).toBe( 'testabc' );
} );

test( 'filter removes a callback that has not yet executed (last)', function() {
	addFilter( 'test.filter', filter_a, 1 );
	addFilter( 'test.filter', filter_b, 3 );
	addFilter( 'test.filter', filter_c, 5 );
	addFilter( 'test.filter', filter_removes_c, 4 );

	expect( applyFilters( 'test.filter', 'test' ) ).toBe( 'testab' );
} );

test( 'filter removes a callback that has not yet executed (middle)', function() {
	addFilter( 'test.filter', filter_a, 1 );
	addFilter( 'test.filter', filter_b, 3 );
	addFilter( 'test.filter', filter_c, 4 );
	addFilter( 'test.filter', filter_removes_b, 2 );

	expect( applyFilters( 'test.filter', 'test' ) ).toBe( 'testac' );
} );

test( 'filter removes a callback that has not yet executed (same priority)', function() {
	addFilter( 'test.filter', filter_a, 1 );
	addFilter( 'test.filter', filter_removes_b, 2 );
	addFilter( 'test.filter', filter_b, 2 );
	addFilter( 'test.filter', filter_c, 4 );

	expect( applyFilters( 'test.filter', 'test' ) ).toBe( 'testac' );
} );

test( 'remove all filter callbacks', function() {
	addFilter( 'test.filter', filter_a );
	addFilter( 'test.filter', filter_b, 2 );
	addFilter( 'test.filter', filter_c, 8 );

	removeAllFilters( 'test.filter' );
	expect( applyFilters( 'test.filter', 'test' ) ).toBe( 'test' );
} );

// Test doingAction, didAction, hasAction.
test( 'Test doingAction, didAction and hasAction.', function() {
	let actionCalls = 0;

	addAction( 'another.action', () => {} );
	doAction( 'another.action' );

	// Verify no action is running yet.
	expect( doingAction( 'test.action' ) ).toBe( false );

	expect( didAction( 'test.action' ) ).toBe( 0 );
	expect( hasAction( 'test.action' ) ).toBe( 0 );

	addAction( 'test.action', () => {
		actionCalls++;
		expect( currentAction() ).toBe( 'test.action' );
		expect( doingAction() ).toBe( true );
		expect( doingAction( 'test.action' ) ).toBe( true );
	} );

	// Verify action added, not running yet.
	expect( doingAction( 'test.action' ) ).toBe( false );
	expect( didAction( 'test.action' ) ).toBe( 0 );
	expect( hasAction( 'test.action' ) ).toBe( 1 );

	doAction( 'test.action' );

	// Verify action added and running.
	expect( actionCalls ).toBe( 1 );
	expect( doingAction( 'test.action' ) ).toBe( false );
	expect( didAction( 'test.action' ) ).toBe( 1 );
	expect( hasAction( 'test.action' ) ).toBe( 1 );
	expect( doingAction() ).toBe( false );
	expect( doingAction( 'test.action' ) ).toBe( false );
	expect( doingAction( 'notatest.action' ) ).toBe( false );
	expect( currentAction() ).toBe( null );

	doAction( 'test.action' );
	expect( actionCalls ).toBe( 2 );
	expect( didAction( 'test.action' ) ).toBe( 2 );

	removeAllActions( 'test.action' );

	// Verify state is reset appropriately.
	expect( doingAction( 'test.action' ) ).toBe( false );
	expect( didAction( 'test.action' ) ).toBe( 2 );
	expect( hasAction( 'test.action' ) ).toBe( 0 );

	doAction( 'another.action' );
	expect( doingAction( 'test.action' ) ).toBe( false );

	// Verify hasAction returns 0 when no matching action.
	expect( hasAction( 'notatest.action' ) ).toBe( 0 );
} );

test( 'Verify doingFilter, didFilter and hasFilter.', function() {
	let filterCalls = 0;

	addFilter( 'runtest.filter', arg => {
		filterCalls++;
		expect( currentFilter() ).toBe( 'runtest.filter' );
		expect( doingFilter() ).toBe( true );
		expect( doingFilter( 'runtest.filter' ) ).toBe( true );
		return arg;
	} );

	// Verify filter added and running.
	const test = applyFilters( 'runtest.filter', 'someValue' );
	expect( test ).toBe( 'someValue' );
	expect( filterCalls ).toBe( 1 );
	expect( didFilter( 'runtest.filter' ) ).toBe( 1 );
	expect( hasFilter( 'runtest.filter' ) ).toBe( 1 );
	expect( hasFilter( 'notatest.filter' ) ).toBe( 0 );
	expect( doingFilter() ).toBe( false );
	expect( doingFilter( 'runtest.filter' ) ).toBe( false );
	expect( doingFilter( 'notatest.filter' ) ).toBe( false );
	expect( currentFilter() ).toBe( null );

	removeAllFilters( 'runtest.filter' );

	expect( hasFilter( 'runtest.filter' ) ).toBe( 0 );
	expect( didFilter( 'runtest.filter' ) ).toBe( 1 );
} );

test( 'recursively calling a filter', function() {
	addFilter( 'test.filter', value => {
		if ( value.length === 7 ) {
			return value;
		}
		return applyFilters( 'test.filter', value + 'X' );
	} );

	expect( applyFilters( 'test.filter', 'test' ) ).toBe( 'testXXX' );
} );

