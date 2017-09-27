/* eslint-disable no-console */

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
	Hooks,
} from '../';

const testObject = {};
testObject.hooks = new Hooks();

console.log( testObject.hooks );

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
	testObject.hooks.removeFilter( 'test.filter', 'me_name/my_plugin/my_callback_filter_b_removes_self' );
	return str + 'b';
}

function filter_removes_b( str ) {
	testObject.hooks.removeFilter( 'test.filter', 'me_name/my_plugin/my_callback_filter_b' );
	return str;
}

function filter_removes_c( str ) {
	testObject.hooks.removeFilter( 'test.filter', 'me_name/my_plugin/my_callback_filter_c' );
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
	// Reset state in between tests (clear all callbacks, `didAction` counts,
	// etc.)  Just reseting HOOKS.actions and HOOKS.filters is not enough
	// because the internal functions have references to the original objects.
	[ HOOKS.actions, HOOKS.filters ].forEach( hooks => {
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
	testObject.hooks.addFilter( 'test.filter', 'my_name/my_plugin/my_callback',  filter_a );
	expect( testObject.hooks.removeAllFilters( 'test.filter' ) ).toEqual( 1 );
	expect( testObject.hooks.applyFilters( 'test.filter', 'test' ) ).toBe( 'test' );
	expect( testObject.hooks.removeAllFilters( 'test.filter' ) ).toEqual( 0 );
} );

test( 'add a filter and run it', () => {
	testObject.hooks.addFilter( 'test.filter', 'my_name/my_plugin/my_callback',  filter_a );
	expect( testObject.hooks.applyFilters( 'test.filter', 'test' ) ).toBe( 'testa' );
} );

test( 'add 2 filters in a row and run them', () => {
	testObject.hooks.addFilter( 'test.filter', 'my_name/my_plugin/my_callback',  filter_a );
	testObject.hooks.addFilter( 'test.filter', 'my_name/my_plugin/my_callback',  filter_b );
	expect( testObject.hooks.applyFilters( 'test.filter', 'test' ) ).toBe( 'testab' );
} );

test( 'remove a non-existent filter', () => {
	expect( testObject.hooks.removeFilter( 'test.filter', 'my_name/my_plugin/my_callback', filter_a ) ).toEqual( 0 );
	expect( testObject.hooks.removeAllFilters( 'test.filter' ) ).toEqual( 0 );
} );

test( 'remove an invalid namespace from a filter', () => {
	expect( testObject.hooks.removeFilter( 'test.filter', 42 ) ).toEqual( undefined );
	expect( console.error ).toHaveBeenCalledWith(
		'The namespace must be a non-empty string.'
	);
} );

test( 'cannot add filters with non-string hook names', () => {
	testObject.hooks.addFilter( 42, 'my_name/my_plugin/my_callback', () => null );
	expect( console.error ).toHaveBeenCalledWith(
		'The hook name must be a non-empty string.'
	);
} );

test( 'cannot add filters with empty-string hook names', () => {
	testObject.hooks.addFilter( '', 'my_name/my_plugin/my_callback', () => null );
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
	testObject.hooks.addFilter( 'hook_name', 'invalid_name', () => null );
	expect( console.error ).toHaveBeenCalledWith(
		'The namespace must take the form `vendor/plugin/function`.'
	);
} );

test( 'cannot add filters with namespaces missing a functionDescription', () => {
	testObject.hooks.addFilter( 'hook_name', 'invalid_name/', () => null );
	expect( console.error ).toHaveBeenCalledWith(
		'The namespace must take the form `vendor/plugin/function`.'
	);
} );

test( 'Can add filters with capitals in namespaces', () => {
	testObject.hooks.addFilter( 'hook_name', 'my_name/OhNo/action', () => null );
	expect( console.error ).toHaveBeenCalledTimes( 0 );
} );

test( 'Can add filters with capitals in hookName', () => {
	testObject.hooks.addFilter( 'hookName', 'my_name/plugin/action', () => null );
	expect( console.error ).toHaveBeenCalledTimes( 0 );
} );

test( 'Can add filters with periods in namespaces', () => {
	testObject.hooks.addFilter( 'hook_name', 'my_name/plugin.name/ok.action', () => null );
	expect( console.error ).toHaveBeenCalledTimes( 0 );
} );

test( 'Can add filters with periods in hookName', () => {
	testObject.hooks.addFilter( 'hook.name', 'my_name/plugin/action', () => null );
	expect( console.error ).toHaveBeenCalledTimes( 0 );
} );

test( 'cannot add filters with invalid namespaces', () => {
	testObject.hooks.addFilter( 'hook_name', '/invalid_name', () => null );
	expect( console.error ).toHaveBeenCalledWith(
		'The namespace can only contain numbers, letters, dashes, periods and underscores, plus the forward slash dividing slug and description in the namespace.'
	);
} );

test( 'cannot add filters named with __ prefix', () => {
	testObject.hooks.addFilter( '__test', 'my_name/my_plugin/my_callback', () => null );
	expect( console.error ).toHaveBeenCalledWith(
		'The hook name cannot begin with `__`.'
	);
} );

test( 'cannot add filters with non-function callbacks', () => {
	testObject.hooks.addFilter( 'test', 'my_name/my_plugin/my_callback', '42' );
	expect( console.error ).toHaveBeenCalledWith(
		'The hook callback must be a function.'
	);
} );

test( 'cannot add filters with non-numeric priorities', () => {
	testObject.hooks.addFilter( 'test', 'my_name/my_plugin/my_callback', () => null, '42' );
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
	testObject.hooks.addFilter( 'test.filter', 'me_name/my_plugin/my_callback_filter_a',  filter_a );
	testObject.hooks.addFilter( 'test.filter', 'me_name/my_plugin/my_callback_filter_b',  filter_b, 2 );
	testObject.hooks.addFilter( 'test.filter', 'me_name/my_plugin/my_callback_filter_c',  filter_c, 8 );
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

	testObject.hooks.addFilter( 'test_order', 'my_name/my_plugin/my_callback_fn_3a', callbacks.fn_3a, 3 );
	testObject.hooks.addFilter( 'test_order', 'my_name/my_plugin/my_callback_fn_3b', callbacks.fn_3b, 3 );
	testObject.hooks.addFilter( 'test_order', 'my_name/my_plugin/my_callback_fn_3c', callbacks.fn_3c, 3 );
	testObject.hooks.addFilter( 'test_order', 'my_name/my_plugin/my_callback_fn_2a', callbacks.fn_2a, 2 );
	testObject.hooks.addFilter( 'test_order', 'my_name/my_plugin/my_callback_fn_2b', callbacks.fn_2b, 2 );
	testObject.hooks.addFilter( 'test_order', 'my_name/my_plugin/my_callback_fn_2c', callbacks.fn_2c, 2 );

	expect( testObject.hooks.applyFilters( 'test_order', [] ) ).toEqual(
		[ '2a', '2b', '2c', '3a', '3b', '3c' ]
	);

	testObject.hooks.removeFilter( 'test_order', 'my_name/my_plugin/my_callback_fn_2b', callbacks.fn_2b );
	testObject.hooks.removeFilter( 'test_order', 'my_name/my_plugin/my_callback_fn_3a', callbacks.fn_3a );

	expect( testObject.hooks.applyFilters( 'test_order', [] ) ).toEqual(
		[ '2a', '2c', '3b', '3c' ]
	);

	testObject.hooks.addFilter( 'test_order', 'my_name/my_plugin/my_callback_fn_4a', callbacks.fn_4a, 4 );
	testObject.hooks.addFilter( 'test_order', 'my_name/my_plugin/my_callback_fn_4b', callbacks.fn_4b, 4 );
	testObject.hooks.addFilter( 'test_order', 'my_name/my_plugin/my_callback_fn_1a', callbacks.fn_1a, 1 );
	testObject.hooks.addFilter( 'test_order', 'my_name/my_plugin/my_callback_fn_4c', callbacks.fn_4c, 4 );
	testObject.hooks.addFilter( 'test_order', 'my_name/my_plugin/my_callback_fn_1b', callbacks.fn_1b, 1 );
	testObject.hooks.addFilter( 'test_order', 'my_name/my_plugin/my_callback_fn_3d', callbacks.fn_3d, 3 );
	testObject.hooks.addFilter( 'test_order', 'my_name/my_plugin/my_callback_fn_4d', callbacks.fn_4d, 4 );
	testObject.hooks.addFilter( 'test_order', 'my_name/my_plugin/my_callback_fn_1c', callbacks.fn_1c, 1 );
	testObject.hooks.addFilter( 'test_order', 'my_name/my_plugin/my_callback_fn_2d', callbacks.fn_2d, 2 );
	testObject.hooks.addFilter( 'test_order', 'my_name/my_plugin/my_callback_fn_1d', callbacks.fn_1d, 1 );

	expect( testObject.hooks.applyFilters( 'test_order', [] ) ).toEqual( [
		// all except 2b and 3a, which we removed earlier
		'1a', '1b', '1c', '1d',
		'2a', '2c', '2d',
		'3b', '3c', '3d',
		'4a', '4b', '4c', '4d',
	] );
} );

test( 'add and remove an action', () => {
	addAction( 'test.action', 'my_name/my_plugin/my_callback', action_a );
	expect( removeAllActions( 'test.action' ) ).toEqual( 1 );
	expect( doAction( 'test.action' ) ).toBe( undefined );
	expect( window.actionValue ).toBe( '' );
} );

test( 'add an action and run it', () => {
	addAction( 'test.action', 'my_name/my_plugin/my_callback', action_a );
	doAction( 'test.action' );
	expect( window.actionValue ).toBe( 'a' );
} );

test( 'add 2 actions in a row and then run them', () => {
	addAction( 'test.action', 'my_name/my_plugin/my_callback', action_a );
	addAction( 'test.action', 'my_name/my_plugin/my_callback', action_b );
	doAction( 'test.action' );
	expect( window.actionValue ).toBe( 'ab' );
} );

test( 'add 3 actions with different priorities and run them', () => {
	addAction( 'test.action', 'my_name/my_plugin/my_callback', action_a );
	addAction( 'test.action', 'my_name/my_plugin/my_callback', action_b, 2 );
	addAction( 'test.action', 'my_name/my_plugin/my_callback', action_c, 8 );
	doAction( 'test.action' );
	expect( window.actionValue ).toBe( 'bca' );
} );

test( 'pass in two arguments to an action', () => {
	const arg1 = { a: 10 };
	const arg2 = { b: 20 };

	addAction( 'test.action', 'my_name/my_plugin/my_callback', ( a, b ) => {
		expect( a ).toBe( arg1 );
		expect( b ).toBe( arg2 );
	} );
	doAction( 'test.action', arg1, arg2 );
} );

test( 'fire action multiple times', () => {
	expect.assertions( 2 );

	function func() {
		expect( true ).toBe( true );
	};

	addAction( 'test.action', 'my_name/my_plugin/my_callback', func );
	doAction( 'test.action' );
	doAction( 'test.action' );
} );

test( 'add a filter before the one currently executing', () => {
	testObject.hooks.addFilter( 'test.filter', 'my_name/my_plugin/my_callback',  val => {
		testObject.hooks.addFilter( 'test.filter', 'my_name/my_plugin/my_callback',  val => val + 'a', 1 );
		return val + 'b';
	}, 2 );

	expect( testObject.hooks.applyFilters( 'test.filter', 'test_' ) ).toEqual( 'test_b' );
} );

test( 'add a filter after the one currently executing', () => {
	testObject.hooks.addFilter( 'test.filter', 'my_name/my_plugin/my_callback',  val => {
		testObject.hooks.addFilter( 'test.filter', 'my_name/my_plugin/my_callback',  val => val + 'b', 2 );
		return val + 'a';
	}, 1 );

	expect( testObject.hooks.applyFilters( 'test.filter', 'test_' ) ).toEqual( 'test_ab' );
} );

test( 'add a filter immediately after the one currently executing', () => {
	testObject.hooks.addFilter( 'test.filter', 'my_name/my_plugin/my_callback',  val => {
		testObject.hooks.addFilter( 'test.filter', 'my_name/my_plugin/my_callback',  val => val + 'b', 1 );
		return val + 'a';
	}, 1 );

	expect( testObject.hooks.applyFilters( 'test.filter', 'test_' ) ).toEqual( 'test_ab' );
} );

test( 'remove specific action callback', () => {
	addAction( 'test.action', 'my_name/my_plugin/my_callback_action_a', action_a );
	addAction( 'test.action', 'my_name/my_plugin/my_callback_action_b', action_b, 2 );
	addAction( 'test.action', 'my_name/my_plugin/my_callback_action_c', action_c, 8 );

	expect( removeAction( 'test.action', 'my_name/my_plugin/my_callback_action_b' ) ).toEqual( 1 );
	doAction( 'test.action' );
	expect( window.actionValue ).toBe( 'ca' );
} );

test( 'remove all action callbacks', () => {
	addAction( 'test.action', 'my_name/my_plugin/my_callback_action_a', action_a );
	addAction( 'test.action', 'my_name/my_plugin/my_callback_action_b', action_b, 2 );
	addAction( 'test.action', 'my_name/my_plugin/my_callback_action_c', action_c, 8 );

	expect( removeAllActions( 'test.action' ) ).toEqual( 3 );
	doAction( 'test.action' );
	expect( window.actionValue ).toBe( '' );
} );

test( 'remove specific filter callback', () => {
	testObject.hooks.addFilter( 'test.filter', 'me_name/my_plugin/my_callback_filter_a',  filter_a );
	testObject.hooks.addFilter( 'test.filter', 'me_name/my_plugin/my_callback_filter_b',  filter_b, 2 );
	testObject.hooks.addFilter( 'test.filter', 'me_name/my_plugin/my_callback_filter_c',  filter_c, 8 );

	expect( testObject.hooks.removeFilter( 'test.filter', 'me_name/my_plugin/my_callback_filter_b' ) ).toEqual( 1 );
	expect( testObject.hooks.applyFilters( 'test.filter', 'test' ) ).toBe( 'testca' );
} );

test( 'filter removes a callback that has already executed', () => {
	testObject.hooks.addFilter( 'test.filter', 'me_name/my_plugin/my_callback_filter_a',  filter_a, 1 );
	testObject.hooks.addFilter( 'test.filter', 'me_name/my_plugin/my_callback_filter_b',  filter_b, 3 );
	testObject.hooks.addFilter( 'test.filter', 'me_name/my_plugin/my_callback_filter_c',  filter_c, 5 );
	testObject.hooks.addFilter( 'test.filter', 'me_name/my_plugin/my_callback_filter_removes_b',  filter_removes_b, 4 );

	expect( testObject.hooks.applyFilters( 'test.filter', 'test' ) ).toBe( 'testabc' );
} );

test( 'filter removes a callback that has already executed (same priority)', () => {
	testObject.hooks.addFilter( 'test.filter', 'me_name/my_plugin/my_callback_filter_a',  filter_a, 1 );
	testObject.hooks.addFilter( 'test.filter', 'me_name/my_plugin/my_callback_filter_b',  filter_b, 2 );
	testObject.hooks.addFilter( 'test.filter', 'me_name/my_plugin/my_callback_filter_removes_b',  filter_removes_b, 2 );
	testObject.hooks.addFilter( 'test.filter', 'me_name/my_plugin/my_callback_filter_c',  filter_c, 4 );

	expect( testObject.hooks.applyFilters( 'test.filter', 'test' ) ).toBe( 'testabc' );
} );

test( 'filter removes the current callback', () => {
	testObject.hooks.addFilter( 'test.filter', 'me_name/my_plugin/my_callback_filter_a',  filter_a, 1 );
	testObject.hooks.addFilter( 'test.filter', 'me_name/my_plugin/my_callback_filter_b_removes_self',  filter_b_removes_self, 3 );
	testObject.hooks.addFilter( 'test.filter', 'me_name/my_plugin/my_callback_filter_c',  filter_c, 5 );

	expect( testObject.hooks.applyFilters( 'test.filter', 'test' ) ).toBe( 'testabc' );
} );

test( 'filter removes a callback that has not yet executed (last)', () => {
	testObject.hooks.addFilter( 'test.filter', 'me_name/my_plugin/my_callback_filter_a',  filter_a, 1 );
	testObject.hooks.addFilter( 'test.filter', 'me_name/my_plugin/my_callback_filter_b',  filter_b, 3 );
	testObject.hooks.addFilter( 'test.filter', 'me_name/my_plugin/my_callback_filter_c',  filter_c, 5 );
	testObject.hooks.addFilter( 'test.filter', 'me_name/my_plugin/my_callback_filter_removes_c',  filter_removes_c, 4 );

	expect( testObject.hooks.applyFilters( 'test.filter', 'test' ) ).toBe( 'testab' );
} );

test( 'filter removes a callback that has not yet executed (middle)', () => {
	testObject.hooks.addFilter( 'test.filter', 'me_name/my_plugin/my_callback_filter_a',  filter_a, 1 );
	testObject.hooks.addFilter( 'test.filter', 'me_name/my_plugin/my_callback_filter_b',  filter_b, 3 );
	testObject.hooks.addFilter( 'test.filter', 'me_name/my_plugin/my_callback_filter_c',  filter_c, 4 );
	testObject.hooks.addFilter( 'test.filter', 'me_name/my_plugin/my_callback_filter_removes_b',  filter_removes_b, 2 );

	expect( testObject.hooks.applyFilters( 'test.filter', 'test' ) ).toBe( 'testac' );
} );

test( 'filter removes a callback that has not yet executed (same priority)', () => {
	testObject.hooks.addFilter( 'test.filter', 'me_name/my_plugin/my_callback_filter_a',  filter_a, 1 );
	testObject.hooks.addFilter( 'test.filter', 'me_name/my_plugin/my_callback_filter_removes_b',  filter_removes_b, 2 );
	testObject.hooks.addFilter( 'test.filter', 'me_name/my_plugin/my_callback_filter_b',  filter_b, 2 );
	testObject.hooks.addFilter( 'test.filter', 'me_name/my_plugin/my_callback_filter_c',  filter_c, 4 );

	expect( testObject.hooks.applyFilters( 'test.filter', 'test' ) ).toBe( 'testac' );
} );

test( 'remove all filter callbacks', () => {
	testObject.hooks.addFilter( 'test.filter', 'me_name/my_plugin/my_callback_filter_a',  filter_a );
	testObject.hooks.addFilter( 'test.filter', 'me_name/my_plugin/my_callback_filter_b',  filter_b, 2 );
	testObject.hooks.addFilter( 'test.filter', 'me_name/my_plugin/my_callback_filter_c',  filter_c, 8 );

	expect( testObject.hooks.removeAllFilters( 'test.filter' ) ).toEqual( 3 );
	expect( testObject.hooks.applyFilters( 'test.filter', 'test' ) ).toBe( 'test' );
} );

// Test doingAction, didAction, hasAction.
test( 'Test doingAction, didAction and hasAction.', () => {
	let actionCalls = 0;

	addAction( 'another.action', 'my_name/my_plugin/my_callback', () => {} );
	doAction( 'another.action' );

	// Verify no action is running yet.
	expect( doingAction( 'test.action' ) ).toBe( false );

	expect( didAction( 'test.action' ) ).toBe( 0 );
	expect( hasAction( 'test.action' ) ).toBe( 0 );

	addAction( 'test.action', 'my_name/my_plugin/my_callback', () => {
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

	expect( removeAllActions( 'test.action' ) ).toEqual( 1 );

	// Verify state is reset appropriately.
	expect( doingAction( 'test.action' ) ).toBe( false );
	expect( didAction( 'test.action' ) ).toBe( 2 );
	expect( hasAction( 'test.action' ) ).toBe( 0 );

	doAction( 'another.action' );
	expect( doingAction( 'test.action' ) ).toBe( false );

	// Verify hasAction returns 0 when no matching action.
	expect( hasAction( 'notatest.action' ) ).toBe( 0 );
} );

test( 'Verify doingFilter, didFilter and hasFilter.', () => {
	let filterCalls = 0;

	testObject.hooks.addFilter( 'runtest.filter', 'my_name/my_plugin/my_callback',  arg => {
		filterCalls++;
		expect( currentFilter() ).toBe( 'runtest.filter' );
		expect( doingFilter() ).toBe( true );
		expect( doingFilter( 'runtest.filter' ) ).toBe( true );
		return arg;
	} );

	// Verify filter added and running.
	const test = testObject.hooks.applyFilters( 'runtest.filter', 'someValue' );
	expect( test ).toBe( 'someValue' );
	expect( filterCalls ).toBe( 1 );
	expect( didFilter( 'runtest.filter' ) ).toBe( 1 );
	expect( hasFilter( 'runtest.filter' ) ).toBe( 1 );
	expect( hasFilter( 'notatest.filter' ) ).toBe( 0 );
	expect( doingFilter() ).toBe( false );
	expect( doingFilter( 'runtest.filter' ) ).toBe( false );
	expect( doingFilter( 'notatest.filter' ) ).toBe( false );
	expect( currentFilter() ).toBe( null );

	expect( testObject.hooks.removeAllFilters( 'runtest.filter' ) ).toEqual( 1 );

	expect( hasFilter( 'runtest.filter' ) ).toBe( 0 );
	expect( didFilter( 'runtest.filter' ) ).toBe( 1 );
} );

test( 'recursively calling a filter', () => {
	testObject.hooks.addFilter( 'test.filter', 'my_name/my_plugin/my_callback',  value => {
		if ( value.length === 7 ) {
			return value;
		}
		return testObject.hooks.applyFilters( 'test.filter', value + 'X' );
	} );

	expect( testObject.hooks.applyFilters( 'test.filter', 'test' ) ).toBe( 'testXXX' );
} );

test( 'current filter when multiple filters are running', () => {
	testObject.hooks.addFilter( 'test.filter1', 'my_name/my_plugin/my_callback',  value => {
		return testObject.hooks.applyFilters( 'test.filter2', value.concat( currentFilter() ) );
	} );

	testObject.hooks.addFilter( 'test.filter2', 'my_name/my_plugin/my_callback',  value => {
		return value.concat( currentFilter() );
	} );

	expect( currentFilter() ).toBe( null );

	expect( testObject.hooks.applyFilters( 'test.filter1', [ 'test' ] ) ).toEqual(
		[ 'test', 'test.filter1', 'test.filter2' ]
	);

	expect( currentFilter() ).toBe( null );
} );

test( 'adding and removing filters with recursion', () => {
	function removeRecurseAndAdd2( val ) {
		expect( testObject.hooks.removeFilter( 'remove_and_add', 'my_name/my_plugin/my_callback_recurse' ) ).toEqual( 1 );
		val += '-' + testObject.hooks.applyFilters( 'remove_and_add', '' ) + '-';
		testObject.hooks.addFilter( 'remove_and_add', 'my_name/my_plugin/my_callback_recurse', 10 );
		return val + '2';
	}

	testObject.hooks.addFilter( 'remove_and_add', 'my_name/my_plugin/my_callback', val => val + '1', 11 );
	testObject.hooks.addFilter( 'remove_and_add', 'my_name/my_plugin/my_callback_recurse', removeRecurseAndAdd2, 12 );
	testObject.hooks.addFilter( 'remove_and_add', 'my_name/my_plugin/my_callback', val => val + '3', 13 );
	testObject.hooks.addFilter( 'remove_and_add', 'my_name/my_plugin/my_callback', val => val + '4', 14 );

	expect( testObject.hooks.applyFilters( 'remove_and_add', '' ) ).toEqual( '1-134-234' );
} );
