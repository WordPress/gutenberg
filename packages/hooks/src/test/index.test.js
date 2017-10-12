/* eslint-disable no-console */

/**
 * Internal dependencies
 */
import createHooks from '../';

const testObject = {};
testObject.hooks = createHooks();

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
	testObject.hooks.removeFilter( 'test.filter', 'my_callback_filter_b_removes_self' );
	return str + 'b';
}

function filter_removes_b( str ) {
	testObject.hooks.removeFilter( 'test.filter', 'my_callback_filter_b' );
	return str;
}

function filter_removes_c( str ) {
	testObject.hooks.removeFilter( 'test.filter', 'my_callback_filter_c' );
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

const consoleErrorOriginal = console.error;

beforeEach( () => {
	window.actionValue = '';
	// Reset state in between tests (clear all callbacks, `testObject.hooks.didAction` counts,
	// etc.)  Just reseting actions and filters is not enough
	// because the internal functions have references to the original objects.
	[ testObject.hooks.actions, testObject.hooks.filters ].forEach( hooks => {
		for ( const k in hooks ) {
			delete hooks[ k ];
		}
	} );
	console.error = jest.fn();
} );

afterEach( () => {
	console.error = consoleErrorOriginal;
} );

test( 'hooks can be instantiated', () => {
	expect( typeof testObject.hooks ).toEqual( 'object' );
} );

test( 'run a filter with no callbacks', () => {
	expect( testObject.hooks.applyFilters( 'test.filter', 42 ) ).toEqual( 42 );
} );

test( 'add and remove a filter', () => {
	testObject.hooks.addFilter( 'test.filter', 'my_callback',  filter_a );
	expect( testObject.hooks.removeAllFilters( 'test.filter' ) ).toEqual( 1 );
	expect( testObject.hooks.applyFilters( 'test.filter', 'test' ) ).toBe( 'test' );
	expect( testObject.hooks.removeAllFilters( 'test.filter' ) ).toEqual( 0 );
} );

test( 'add a filter and run it', () => {
	testObject.hooks.addFilter( 'test.filter', 'my_callback',  filter_a );
	expect( testObject.hooks.applyFilters( 'test.filter', 'test' ) ).toBe( 'testa' );
} );

test( 'add 2 filters in a row and run them', () => {
	testObject.hooks.addFilter( 'test.filter', 'my_callback',  filter_a );
	testObject.hooks.addFilter( 'test.filter', 'my_callback',  filter_b );
	expect( testObject.hooks.applyFilters( 'test.filter', 'test' ) ).toBe( 'testab' );
} );

test( 'remove a non-existent filter', () => {
	expect( testObject.hooks.removeFilter( 'test.filter', 'my_callback', filter_a ) ).toEqual( 0 );
	expect( testObject.hooks.removeAllFilters( 'test.filter' ) ).toEqual( 0 );
} );

test( 'remove an invalid namespace from a filter', () => {
	expect( testObject.hooks.removeFilter( 'test.filter', 42 ) ).toEqual( undefined );
	expect( console.error ).toHaveBeenCalledWith(
		'The namespace must be a non-empty string.'
	);
} );

test( 'cannot add filters with non-string hook names', () => {
	testObject.hooks.addFilter( 42, 'my_callback', () => null );
	expect( console.error ).toHaveBeenCalledWith(
		'The hook name must be a non-empty string.'
	);
} );

test( 'cannot add filters with empty-string hook names', () => {
	testObject.hooks.addFilter( '', 'my_callback', () => null );
	expect( console.error ).toHaveBeenCalledWith(
		'The hook name must be a non-empty string.'
	);
} );

test( 'cannot add filters with empty-string namespaces', () => {
	testObject.hooks.addFilter( 'hook_name', '', () => null );
	expect( console.error ).toHaveBeenCalledWith(
		'The namespace must be a non-empty string.'
	);
} );

test( 'cannot add filters with invalid namespaces', () => {
	testObject.hooks.addFilter( 'hook_name', 'invalid_%&name', () => null );
	expect( console.error ).toHaveBeenCalledWith(
		'The namespace can only contain numbers, letters, dashes, periods and underscores.'
	);
} );

test( 'cannot add filters with namespaces missing a functionDescription', () => {
	testObject.hooks.addFilter( 'hook_name', 'invalid_name/', () => null );
	expect( console.error ).toHaveBeenCalledWith(
		'The namespace can only contain numbers, letters, dashes, periods and underscores.'
	);
} );

test( 'Can add filters with dashes in namespaces', () => {
	testObject.hooks.addFilter( 'hook_name', 'with-dashes', () => null );
	expect( console.error ).toHaveBeenCalledTimes( 0 );
} );

test( 'Can add filters with capitals in namespaces', () => {
	testObject.hooks.addFilter( 'hook_name', 'my_name-OhNoaction', () => null );
	expect( console.error ).toHaveBeenCalledTimes( 0 );
} );

test( 'Can add filters with capitals in hookName', () => {
	testObject.hooks.addFilter( 'hookName', 'action', () => null );
	expect( console.error ).toHaveBeenCalledTimes( 0 );
} );

test( 'Can add filters with periods in namespaces', () => {
	testObject.hooks.addFilter( 'hook_name', 'ok.action', () => null );
	expect( console.error ).toHaveBeenCalledTimes( 0 );
} );

test( 'Can add filters with periods in hookName', () => {
	testObject.hooks.addFilter( 'hook.name', 'action', () => null );
	expect( console.error ).toHaveBeenCalledTimes( 0 );
} );

test( 'cannot add filters with invalid namespaces', () => {
	testObject.hooks.addFilter( 'hook_name', '/invalid_name', () => null );
	expect( console.error ).toHaveBeenCalledWith(
		'The namespace can only contain numbers, letters, dashes, periods and underscores.'
	);
} );

test( 'cannot add filters named with __ prefix', () => {
	testObject.hooks.addFilter( '__test', 'my_callback', () => null );
	expect( console.error ).toHaveBeenCalledWith(
		'The hook name cannot begin with `__`.'
	);
} );

test( 'cannot add filters with non-function callbacks', () => {
	testObject.hooks.addFilter( 'test', 'my_callback', '42' );
	expect( console.error ).toHaveBeenCalledWith(
		'The hook callback must be a function.'
	);
} );

test( 'cannot add filters with non-numeric priorities', () => {
	testObject.hooks.addFilter( 'test', 'my_callback', () => null, '42' );
	expect( console.error ).toHaveBeenCalledWith(
		'If specified, the hook priority must be a number.'
	);
} );

test( 'cannot run filters with non-string names', () => {
	expect( testObject.hooks.applyFilters( () => {}, 42 ) ).toBe( undefined );
	expect( console.error ).toHaveBeenCalledWith(
		'The hook name must be a non-empty string.'
	);
} );

test( 'cannot run filters named with __ prefix', () => {
	expect( testObject.hooks.applyFilters( '__test', 42 ) ).toBe( undefined );
	expect( console.error ).toHaveBeenCalledWith(
		'The hook name cannot begin with `__`.'
	);
} );

test( 'add 3 filters with different priorities and run them', () => {
	testObject.hooks.addFilter( 'test.filter', 'my_callback_filter_a',  filter_a );
	testObject.hooks.addFilter( 'test.filter', 'my_callback_filter_b',  filter_b, 2 );
	testObject.hooks.addFilter( 'test.filter', 'my_callback_filter_c',  filter_c, 8 );
	expect( testObject.hooks.applyFilters( 'test.filter', 'test' ) ).toBe( 'testbca' );
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

	testObject.hooks.addFilter( 'test_order', 'my_callback_fn_3a', callbacks.fn_3a, 3 );
	testObject.hooks.addFilter( 'test_order', 'my_callback_fn_3b', callbacks.fn_3b, 3 );
	testObject.hooks.addFilter( 'test_order', 'my_callback_fn_3c', callbacks.fn_3c, 3 );
	testObject.hooks.addFilter( 'test_order', 'my_callback_fn_2a', callbacks.fn_2a, 2 );
	testObject.hooks.addFilter( 'test_order', 'my_callback_fn_2b', callbacks.fn_2b, 2 );
	testObject.hooks.addFilter( 'test_order', 'my_callback_fn_2c', callbacks.fn_2c, 2 );

	expect( testObject.hooks.applyFilters( 'test_order', [] ) ).toEqual(
		[ '2a', '2b', '2c', '3a', '3b', '3c' ]
	);

	testObject.hooks.removeFilter( 'test_order', 'my_callback_fn_2b', callbacks.fn_2b );
	testObject.hooks.removeFilter( 'test_order', 'my_callback_fn_3a', callbacks.fn_3a );

	expect( testObject.hooks.applyFilters( 'test_order', [] ) ).toEqual(
		[ '2a', '2c', '3b', '3c' ]
	);

	testObject.hooks.addFilter( 'test_order', 'my_callback_fn_4a', callbacks.fn_4a, 4 );
	testObject.hooks.addFilter( 'test_order', 'my_callback_fn_4b', callbacks.fn_4b, 4 );
	testObject.hooks.addFilter( 'test_order', 'my_callback_fn_1a', callbacks.fn_1a, 1 );
	testObject.hooks.addFilter( 'test_order', 'my_callback_fn_4c', callbacks.fn_4c, 4 );
	testObject.hooks.addFilter( 'test_order', 'my_callback_fn_1b', callbacks.fn_1b, 1 );
	testObject.hooks.addFilter( 'test_order', 'my_callback_fn_3d', callbacks.fn_3d, 3 );
	testObject.hooks.addFilter( 'test_order', 'my_callback_fn_4d', callbacks.fn_4d, 4 );
	testObject.hooks.addFilter( 'test_order', 'my_callback_fn_1c', callbacks.fn_1c, 1 );
	testObject.hooks.addFilter( 'test_order', 'my_callback_fn_2d', callbacks.fn_2d, 2 );
	testObject.hooks.addFilter( 'test_order', 'my_callback_fn_1d', callbacks.fn_1d, 1 );

	expect( testObject.hooks.applyFilters( 'test_order', [] ) ).toEqual( [
		// all except 2b and 3a, which we removed earlier
		'1a', '1b', '1c', '1d',
		'2a', '2c', '2d',
		'3b', '3c', '3d',
		'4a', '4b', '4c', '4d',
	] );
} );

test( 'add and remove an action', () => {
	testObject.hooks.addAction( 'test.action', 'my_callback', action_a );
	expect( testObject.hooks.removeAllActions( 'test.action' ) ).toEqual( 1 );
	expect( testObject.hooks.doAction( 'test.action' ) ).toBe( undefined );
	expect( window.actionValue ).toBe( '' );
} );

test( 'add an action and run it', () => {
	testObject.hooks.addAction( 'test.action', 'my_callback', action_a );
	testObject.hooks.doAction( 'test.action' );
	expect( window.actionValue ).toBe( 'a' );
} );

test( 'add 2 actions in a row and then run them', () => {
	testObject.hooks.addAction( 'test.action', 'my_callback', action_a );
	testObject.hooks.addAction( 'test.action', 'my_callback', action_b );
	testObject.hooks.doAction( 'test.action' );
	expect( window.actionValue ).toBe( 'ab' );
} );

test( 'add 3 actions with different priorities and run them', () => {
	testObject.hooks.addAction( 'test.action', 'my_callback', action_a );
	testObject.hooks.addAction( 'test.action', 'my_callback', action_b, 2 );
	testObject.hooks.addAction( 'test.action', 'my_callback', action_c, 8 );
	testObject.hooks.doAction( 'test.action' );
	expect( window.actionValue ).toBe( 'bca' );
} );

test( 'pass in two arguments to an action', () => {
	const arg1 = { a: 10 };
	const arg2 = { b: 20 };

	testObject.hooks.addAction( 'test.action', 'my_callback', ( a, b ) => {
		expect( a ).toBe( arg1 );
		expect( b ).toBe( arg2 );
	} );
	testObject.hooks.doAction( 'test.action', arg1, arg2 );
} );

test( 'fire action multiple times', () => {
	expect.assertions( 2 );

	function func() {
		expect( true ).toBe( true );
	};

	testObject.hooks.addAction( 'test.action', 'my_callback', func );
	testObject.hooks.doAction( 'test.action' );
	testObject.hooks.doAction( 'test.action' );
} );

test( 'add a filter before the one currently executing', () => {
	testObject.hooks.addFilter( 'test.filter', 'my_callback',  val => {
		testObject.hooks.addFilter( 'test.filter', 'my_callback',  val => val + 'a', 1 );
		return val + 'b';
	}, 2 );

	expect( testObject.hooks.applyFilters( 'test.filter', 'test_' ) ).toEqual( 'test_b' );
} );

test( 'add a filter after the one currently executing', () => {
	testObject.hooks.addFilter( 'test.filter', 'my_callback',  val => {
		testObject.hooks.addFilter( 'test.filter', 'my_callback',  val => val + 'b', 2 );
		return val + 'a';
	}, 1 );

	expect( testObject.hooks.applyFilters( 'test.filter', 'test_' ) ).toEqual( 'test_ab' );
} );

test( 'add a filter immediately after the one currently executing', () => {
	testObject.hooks.addFilter( 'test.filter', 'my_callback',  val => {
		testObject.hooks.addFilter( 'test.filter', 'my_callback',  val => val + 'b', 1 );
		return val + 'a';
	}, 1 );

	expect( testObject.hooks.applyFilters( 'test.filter', 'test_' ) ).toEqual( 'test_ab' );
} );

test( 'remove specific action callback', () => {
	testObject.hooks.addAction( 'test.action', 'my_callback_action_a', action_a );
	testObject.hooks.addAction( 'test.action', 'my_callback_action_b', action_b, 2 );
	testObject.hooks.addAction( 'test.action', 'my_callback_action_c', action_c, 8 );

	expect( testObject.hooks.removeAction( 'test.action', 'my_callback_action_b' ) ).toEqual( 1 );
	testObject.hooks.doAction( 'test.action' );
	expect( window.actionValue ).toBe( 'ca' );
} );

test( 'remove all action callbacks', () => {
	testObject.hooks.addAction( 'test.action', 'my_callback_action_a', action_a );
	testObject.hooks.addAction( 'test.action', 'my_callback_action_b', action_b, 2 );
	testObject.hooks.addAction( 'test.action', 'my_callback_action_c', action_c, 8 );

	expect( testObject.hooks.removeAllActions( 'test.action' ) ).toEqual( 3 );
	testObject.hooks.doAction( 'test.action' );
	expect( window.actionValue ).toBe( '' );
} );

test( 'remove specific filter callback', () => {
	testObject.hooks.addFilter( 'test.filter', 'my_callback_filter_a',  filter_a );
	testObject.hooks.addFilter( 'test.filter', 'my_callback_filter_b',  filter_b, 2 );
	testObject.hooks.addFilter( 'test.filter', 'my_callback_filter_c',  filter_c, 8 );

	expect( testObject.hooks.removeFilter( 'test.filter', 'my_callback_filter_b' ) ).toEqual( 1 );
	expect( testObject.hooks.applyFilters( 'test.filter', 'test' ) ).toBe( 'testca' );
} );

test( 'filter removes a callback that has already executed', () => {
	testObject.hooks.addFilter( 'test.filter', 'my_callback_filter_a',  filter_a, 1 );
	testObject.hooks.addFilter( 'test.filter', 'my_callback_filter_b',  filter_b, 3 );
	testObject.hooks.addFilter( 'test.filter', 'my_callback_filter_c',  filter_c, 5 );
	testObject.hooks.addFilter( 'test.filter', 'my_callback_filter_removes_b',  filter_removes_b, 4 );

	expect( testObject.hooks.applyFilters( 'test.filter', 'test' ) ).toBe( 'testabc' );
} );

test( 'filter removes a callback that has already executed (same priority)', () => {
	testObject.hooks.addFilter( 'test.filter', 'my_callback_filter_a',  filter_a, 1 );
	testObject.hooks.addFilter( 'test.filter', 'my_callback_filter_b',  filter_b, 2 );
	testObject.hooks.addFilter( 'test.filter', 'my_callback_filter_removes_b',  filter_removes_b, 2 );
	testObject.hooks.addFilter( 'test.filter', 'my_callback_filter_c',  filter_c, 4 );

	expect( testObject.hooks.applyFilters( 'test.filter', 'test' ) ).toBe( 'testabc' );
} );

test( 'filter removes the current callback', () => {
	testObject.hooks.addFilter( 'test.filter', 'my_callback_filter_a',  filter_a, 1 );
	testObject.hooks.addFilter( 'test.filter', 'my_callback_filter_b_removes_self',  filter_b_removes_self, 3 );
	testObject.hooks.addFilter( 'test.filter', 'my_callback_filter_c',  filter_c, 5 );

	expect( testObject.hooks.applyFilters( 'test.filter', 'test' ) ).toBe( 'testabc' );
} );

test( 'filter removes a callback that has not yet executed (last)', () => {
	testObject.hooks.addFilter( 'test.filter', 'my_callback_filter_a',  filter_a, 1 );
	testObject.hooks.addFilter( 'test.filter', 'my_callback_filter_b',  filter_b, 3 );
	testObject.hooks.addFilter( 'test.filter', 'my_callback_filter_c',  filter_c, 5 );
	testObject.hooks.addFilter( 'test.filter', 'my_callback_filter_removes_c',  filter_removes_c, 4 );

	expect( testObject.hooks.applyFilters( 'test.filter', 'test' ) ).toBe( 'testab' );
} );

test( 'filter removes a callback that has not yet executed (middle)', () => {
	testObject.hooks.addFilter( 'test.filter', 'my_callback_filter_a',  filter_a, 1 );
	testObject.hooks.addFilter( 'test.filter', 'my_callback_filter_b',  filter_b, 3 );
	testObject.hooks.addFilter( 'test.filter', 'my_callback_filter_c',  filter_c, 4 );
	testObject.hooks.addFilter( 'test.filter', 'my_callback_filter_removes_b',  filter_removes_b, 2 );

	expect( testObject.hooks.applyFilters( 'test.filter', 'test' ) ).toBe( 'testac' );
} );

test( 'filter removes a callback that has not yet executed (same priority)', () => {
	testObject.hooks.addFilter( 'test.filter', 'my_callback_filter_a',  filter_a, 1 );
	testObject.hooks.addFilter( 'test.filter', 'my_callback_filter_removes_b',  filter_removes_b, 2 );
	testObject.hooks.addFilter( 'test.filter', 'my_callback_filter_b',  filter_b, 2 );
	testObject.hooks.addFilter( 'test.filter', 'my_callback_filter_c',  filter_c, 4 );

	expect( testObject.hooks.applyFilters( 'test.filter', 'test' ) ).toBe( 'testac' );
} );

test( 'remove all filter callbacks', () => {
	testObject.hooks.addFilter( 'test.filter', 'my_callback_filter_a',  filter_a );
	testObject.hooks.addFilter( 'test.filter', 'my_callback_filter_b',  filter_b, 2 );
	testObject.hooks.addFilter( 'test.filter', 'my_callback_filter_c',  filter_c, 8 );

	expect( testObject.hooks.removeAllFilters( 'test.filter' ) ).toEqual( 3 );
	expect( testObject.hooks.applyFilters( 'test.filter', 'test' ) ).toBe( 'test' );
} );

// Test testObject.hooks.doingAction, testObject.hooks.didAction, testObject.hooks.hasAction.
test( 'Test testObject.hooks.doingAction, testObject.hooks.didAction and testObject.hooks.hasAction.', () => {
	let actionCalls = 0;

	testObject.hooks.addAction( 'another.action', 'my_callback', () => {} );
	testObject.hooks.doAction( 'another.action' );

	// Verify no action is running yet.
	expect( testObject.hooks.doingAction( 'test.action' ) ).toBe( false );

	expect( testObject.hooks.didAction( 'test.action' ) ).toBe( 0 );
	expect( testObject.hooks.hasAction( 'test.action' ) ).toBe( 0 );

	testObject.hooks.addAction( 'test.action', 'my_callback', () => {
		actionCalls++;
		expect( testObject.hooks.currentAction() ).toBe( 'test.action' );
		expect( testObject.hooks.doingAction() ).toBe( true );
		expect( testObject.hooks.doingAction( 'test.action' ) ).toBe( true );
	} );

	// Verify action added, not running yet.
	expect( testObject.hooks.doingAction( 'test.action' ) ).toBe( false );
	expect( testObject.hooks.didAction( 'test.action' ) ).toBe( 0 );
	expect( testObject.hooks.hasAction( 'test.action' ) ).toBe( 1 );

	testObject.hooks.doAction( 'test.action' );

	// Verify action added and running.
	expect( actionCalls ).toBe( 1 );
	expect( testObject.hooks.doingAction( 'test.action' ) ).toBe( false );
	expect( testObject.hooks.didAction( 'test.action' ) ).toBe( 1 );
	expect( testObject.hooks.hasAction( 'test.action' ) ).toBe( 1 );
	expect( testObject.hooks.doingAction() ).toBe( false );
	expect( testObject.hooks.doingAction( 'test.action' ) ).toBe( false );
	expect( testObject.hooks.doingAction( 'notatest.action' ) ).toBe( false );
	expect( testObject.hooks.currentAction() ).toBe( null );

	testObject.hooks.doAction( 'test.action' );
	expect( actionCalls ).toBe( 2 );
	expect( testObject.hooks.didAction( 'test.action' ) ).toBe( 2 );

	expect( testObject.hooks.removeAllActions( 'test.action' ) ).toEqual( 1 );

	// Verify state is reset appropriately.
	expect( testObject.hooks.doingAction( 'test.action' ) ).toBe( false );
	expect( testObject.hooks.didAction( 'test.action' ) ).toBe( 2 );
	expect( testObject.hooks.hasAction( 'test.action' ) ).toBe( 0 );

	testObject.hooks.doAction( 'another.action' );
	expect( testObject.hooks.doingAction( 'test.action' ) ).toBe( false );

	// Verify testObject.hooks.hasAction returns 0 when no matching action.
	expect( testObject.hooks.hasAction( 'notatest.action' ) ).toBe( 0 );
} );

test( 'Verify testObject.hooks.doingFilter, testObject.hooks.didFilter and testObject.hooks.hasFilter.', () => {
	let filterCalls = 0;

	testObject.hooks.addFilter( 'runtest.filter', 'my_callback',  arg => {
		filterCalls++;
		expect( testObject.hooks.currentFilter() ).toBe( 'runtest.filter' );
		expect( testObject.hooks.doingFilter() ).toBe( true );
		expect( testObject.hooks.doingFilter( 'runtest.filter' ) ).toBe( true );
		return arg;
	} );

	// Verify filter added and running.
	const test = testObject.hooks.applyFilters( 'runtest.filter', 'someValue' );
	expect( test ).toBe( 'someValue' );
	expect( filterCalls ).toBe( 1 );
	expect( testObject.hooks.didFilter( 'runtest.filter' ) ).toBe( 1 );
	expect( testObject.hooks.hasFilter( 'runtest.filter' ) ).toBe( 1 );
	expect( testObject.hooks.hasFilter( 'notatest.filter' ) ).toBe( 0 );
	expect( testObject.hooks.doingFilter() ).toBe( false );
	expect( testObject.hooks.doingFilter( 'runtest.filter' ) ).toBe( false );
	expect( testObject.hooks.doingFilter( 'notatest.filter' ) ).toBe( false );
	expect( testObject.hooks.currentFilter() ).toBe( null );

	expect( testObject.hooks.removeAllFilters( 'runtest.filter' ) ).toEqual( 1 );

	expect( testObject.hooks.hasFilter( 'runtest.filter' ) ).toBe( 0 );
	expect( testObject.hooks.didFilter( 'runtest.filter' ) ).toBe( 1 );
} );

test( 'recursively calling a filter', () => {
	testObject.hooks.addFilter( 'test.filter', 'my_callback',  value => {
		if ( value.length === 7 ) {
			return value;
		}
		return testObject.hooks.applyFilters( 'test.filter', value + 'X' );
	} );

	expect( testObject.hooks.applyFilters( 'test.filter', 'test' ) ).toBe( 'testXXX' );
} );

test( 'current filter when multiple filters are running', () => {
	testObject.hooks.addFilter( 'test.filter1', 'my_callback',  value => {
		return testObject.hooks.applyFilters( 'test.filter2', value.concat( testObject.hooks.currentFilter() ) );
	} );

	testObject.hooks.addFilter( 'test.filter2', 'my_callback',  value => {
		return value.concat( testObject.hooks.currentFilter() );
	} );

	expect( testObject.hooks.currentFilter() ).toBe( null );

	expect( testObject.hooks.applyFilters( 'test.filter1', [ 'test' ] ) ).toEqual(
		[ 'test', 'test.filter1', 'test.filter2' ]
	);

	expect( testObject.hooks.currentFilter() ).toBe( null );
} );

test( 'adding and removing filters with recursion', () => {
	function removeRecurseAndAdd2( val ) {
		expect( testObject.hooks.removeFilter( 'remove_and_add', 'my_callback_recurse' ) ).toEqual( 1 );
		val += '-' + testObject.hooks.applyFilters( 'remove_and_add', '' ) + '-';
		testObject.hooks.addFilter( 'remove_and_add', 'my_callback_recurse', 10 );
		return val + '2';
	}

	testObject.hooks.addFilter( 'remove_and_add', 'my_callback', val => val + '1', 11 );
	testObject.hooks.addFilter( 'remove_and_add', 'my_callback_recurse', removeRecurseAndAdd2, 12 );
	testObject.hooks.addFilter( 'remove_and_add', 'my_callback', val => val + '3', 13 );
	testObject.hooks.addFilter( 'remove_and_add', 'my_callback', val => val + '4', 14 );

	expect( testObject.hooks.applyFilters( 'remove_and_add', '' ) ).toEqual( '1-134-234' );
} );


// Test adding via composition.
test( 'adding hooks via composition', () => {

	var testObject2 = {};
	testObject2.hooks = createHooks();

	expect( typeof testObject2.hooks.applyFilters ).toEqual( 'function' );
} );


// Test adding as a mixin.
test( 'adding hooks as a mixin', () => {

	var testObject3 = {};
	Object.assign( testObject3, createHooks() );

	expect( typeof testObject3.applyFilters ).toEqual( 'function' );
} );

// Test context.
test( 'Test `this` context via composition', () => {

	var testObject2 = { test: 'test this' };

	testObject2.hooks = createHooks();

	var theCallback = function() {
		expect( this.test ).toEqual( 'test this' );
	};
	testObject.hooks.addAction( 'test.action', 'my_callback', theCallback.apply( testObject2 ) );
	testObject.hooks.doAction( 'test.action' );

	var testObject3 = {};
	Object.assign( testObject3, createHooks() );

} );

