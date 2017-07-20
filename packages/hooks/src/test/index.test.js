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

describe( 'add and remove a filter', () => {
	it( 'should leave the value unfiltered', () => {
		addFilter( 'test.filter', filter_a );
		removeAllFilters( 'test.filter' );
		expect( applyFilters( 'test.filter', 'test' ) ).toBe( 'test' );
	} );
} );

describe( 'add a filter and run it', () => {
	it( 'should filter the value', () => {
		addFilter( 'test.filter', filter_a );
		expect( applyFilters( 'test.filter', 'test' ) ).toBe( 'testa' );
		removeAllFilters( 'test.filter' );
	} );
} );

describe( 'add 2 filters in a row and run them', () => {
	it( 'both filters should apply', () => {
		addFilter( 'test.filter', filter_a );
		addFilter( 'test.filter', filter_b );
		expect( applyFilters( 'test.filter', 'test' ) ).toBe( 'testab' );
		removeAllFilters( 'test.filter' );
	} );
} );

describe( 'add 3 filters with different priorities and run them', () => {
	it( 'should run in order', () => {
		addFilter( 'test.filter', filter_a );
		addFilter( 'test.filter', filter_b, 2 );
		addFilter( 'test.filter', filter_c, 8 );
		expect( applyFilters( 'test.filter', 'test' ) ).toBe( 'testbca' );
		removeAllFilters( 'test.filter' );
	} );
} );

describe( 'add and remove an action', () => {
	it( 'should leave the action unhooked', () => {
		window.actionValue = '';
		addAction( 'test.action', action_a );
		removeAllActions( 'test.action' );
		doAction( 'test.action' );
		expect( window.actionValue ).toBe( '' );
	} );
} );

describe( 'add an action and run it', function() {
	it( 'should', () => {
		window.actionValue = '';
		addAction( 'test.action', action_a );
		doAction( 'test.action' );
		expect( window.actionValue ).toBe( 'a' );
		removeAllActions( 'test.action' );
	} );
} );

describe( 'add 2 actions in a row and then run them', function() {
	it( 'should', () => {
		window.actionValue = '';
		addAction( 'test.action', action_a );
		addAction( 'test.action', action_b );
		doAction( 'test.action' );
		expect( window.actionValue ).toBe( 'ab' );
		removeAllActions( 'test.action' );
	} );
} );

describe( 'add 3 actions with different priorities and run them', function() {
	it( 'should', () => {
		window.actionValue = '';
		addAction( 'test.action', action_a );
		addAction( 'test.action', action_b, 2 );
		addAction( 'test.action', action_c, 8 );
		doAction( 'test.action' );
		expect( window.actionValue ).toBe( 'bca' );
		removeAllActions( 'test.action' );
	} );
} );

describe( 'pass in two arguments to an action', function() {
	it( 'should', () => {
		var arg1 = 10,
			arg2 = 20;

		addAction( 'test.action', function( a, b ) {
			expect( arg1 ).toBe( a );
			expect( arg2 ).toBe( b );
		} );
		doAction( 'test.action', arg1, arg2 );
		removeAllActions( 'test.action' );

		expect( arg1 ).toBe( 10 );
		expect( arg2 ).toBe( 20 );
	} );
} );

describe( 'fire action multiple times', function() {
	it( 'should', () => {
		var func;
		expect.assertions(2);

		func = function() {
			expect( true ).toBe( true );
		};

		addAction( 'test.action', func );
		doAction( 'test.action' );
		doAction( 'test.action' );
		removeAllActions( 'test.action' );
	} );
} );

describe( 'remove specific action callback', function() {
	it( 'should', () => {
		window.actionValue = '';
		addAction( 'test.action', action_a );
		addAction( 'test.action', action_b, 2 );
		addAction( 'test.action', action_c, 8 );

		removeAction( 'test.action', action_b );
		doAction( 'test.action' );
		expect( window.actionValue ).toBe( 'ca' );
		removeAllActions( 'test.action' );
	} );
} );

describe( 'remove all action callbacks', function() {
	it( 'should', () => {
		window.actionValue = '';
		addAction( 'test.action', action_a );
		addAction( 'test.action', action_b, 2 );
		addAction( 'test.action', action_c, 8 );

		removeAllActions( 'test.action' );
		doAction( 'test.action' );
		expect( window.actionValue ).toBe( '' );
	} );
} );

describe( 'remove specific filter callback', function() {
	it( 'should', () => {
		addFilter( 'test.filter', filter_a );
		addFilter( 'test.filter', filter_b, 2 );
		addFilter( 'test.filter', filter_c, 8 );

		removeFilter( 'test.filter', filter_b );
		expect( applyFilters( 'test.filter', 'test' ) ).toBe( 'testca' );
		removeAllFilters( 'test.filter' );
	} );
} );

describe( 'remove all filter callbacks', function() {
	it( 'should', () => {
		addFilter( 'test.filter', filter_a );
		addFilter( 'test.filter', filter_b, 2 );
		addFilter( 'test.filter', filter_c, 8 );

		removeAllFilters( 'test.filter' );
		expect( applyFilters( 'test.filter', 'test' ) ).toBe( 'test' );
	} );
} );

// Test doingAction, didAction, hasAction.
describe( 'Test doingAction, didAction and hasAction.', function() {
	it( 'should', () => {
		let actionCalls = 0;

		addAction( 'another.action', () => {} );
		doAction( 'another.action' );

		// Verify no action is running yet.
		expect( doingAction( 'test.action' ) ).toBe( false );

		expect( didAction( 'test.action' ) ).toBe( 0 );
		expect( hasAction( 'test.action' ) ).toBe( false );

		addAction( 'test.action', () => {
			actionCalls++;
			expect( currentAction() ).toBe( 'test.action' );
			expect( doingAction( 'test.action' ) ).toBe( true );
		} );

		// Verify action added, not running yet.
		expect( doingAction( 'test.action' ) ).toBe( false );
		expect( didAction( 'test.action' ) ).toBe( 0 );
		expect( hasAction( 'test.action' ) ).toBe( true );

		doAction( 'test.action' );

		// Verify action added and running.
		expect( actionCalls ).toBe( 1 );
		expect( doingAction( 'test.action' ) ).toBe( false );
		expect( didAction( 'test.action' ) ).toBe( 1 );
		expect( hasAction( 'test.action' ) ).toBe( true );
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
		expect( hasAction( 'test.action' ) ).toBe( false );

		doAction( 'another.action' );
		expect( doingAction( 'test.action' ) ).toBe( false );

		// Verify hasAction returns false when no matching action.
		expect( hasAction( 'notatest.action' ) ).toBe( false );
	} );
} );

describe( 'Verify doingFilter, didFilter and hasFilter.', function() {
	it( 'should', () => {
		let filterCalls = 0;

		addFilter( 'runtest.filter', arg => {
			filterCalls++;
			expect( currentFilter() ).toBe( 'runtest.filter' );
			expect( doingFilter( 'runtest.filter' ) ).toBeTruthy();
			return arg;
		} );

		// Verify filter added and running.
		const test = applyFilters( 'runtest.filter', 'someValue' );
		expect( test ).toBe( 'someValue' );
		expect( filterCalls ).toBe( 1 );
		expect( didFilter( 'runtest.filter' ) ).toBe( 1 );
		expect( hasFilter( 'runtest.filter' ) ).toBe( true );
		expect( hasFilter( 'notatest.filter' ) ).toBe( false );
		expect( doingFilter() ).toBe( false );
		expect( doingFilter( 'runtest.filter' ) ).toBe( false );
		expect( doingFilter( 'notatest.filter' ) ).toBe( false );
		expect( currentFilter() ).toBe( null );

		removeAllFilters( 'runtest.filter' );

		expect( hasFilter( 'runtest.filter' ) ).toBe( false );
		expect( didFilter( 'runtest.filter' ) ).toBe( 1 );
	} );
} );


