/**
 * Internal Dependencies.
 */
import {
	doAction,
	applyFilters,
	addAction,
	addFilter,
	doingAction,
	doingFilter,
	didAction,
	didFilter,
	hasAction,
	hasFilter,
	removeFilter,
	removeAction,
	removeAllActions,
	removeAllFilters,
	currentFilter
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
function filter_check() {
	expect( doingFilter( 'runtest.filter' ) ).toBeTruthy();
}
window.actionValue = '';

describe( 'add and remove a filter', () => {
	it( 'should leave the value unfiltered', () => {
		addFilter( 'test.filter', filter_a );
		removeFilter( 'test.filter' );
		expect( applyFilters( 'test.filter', 'test' ) ).toBe( 'test' );
	} );
} );

describe( 'add a filter and run it', () => {
	it( 'should filter the value', () => {
		addFilter( 'test.filter', filter_a );
		expect( applyFilters( 'test.filter', 'test' ) ).toBe( 'testa' );
		removeFilter( 'test.filter' );
	} );
} );

describe( 'add 2 filters in a row and run them', () => {
	it( 'both filters should apply', () => {
		addFilter( 'test.filter', filter_a );
		addFilter( 'test.filter', filter_b );
		expect( applyFilters( 'test.filter', 'test' ) ).toBe( 'testab' );
		removeFilter( 'test.filter' );
	} );
} );

describe( 'add 3 filters with different priorities and run them', () => {
	it( 'should run in order', () => {
		addFilter( 'test.filter', filter_a );
		addFilter( 'test.filter', filter_b, 2 );
		addFilter( 'test.filter', filter_c, 8 );
		expect( applyFilters( 'test.filter', 'test' ) ).toBe( 'testbca' );
		removeFilter( 'test.filter' );
	} );
} );

describe( 'add and remove an action', () => {
	it( 'should leave the action unhooked', () => {
		window.actionValue = '';
		addAction( 'test.action', action_a );
		removeAction( 'test.action' );
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
		removeAction( 'test.action' );
	} );
} );

describe( 'add 2 actions in a row and then run them', function() {
	it( 'should', () => {
		window.actionValue = '';
		addAction( 'test.action', action_a );
		addAction( 'test.action', action_b );
		doAction( 'test.action' );
		expect( window.actionValue ).toBe( 'ab' );
		removeAction( 'test.action' );
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
		removeAction( 'test.action' );
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
		removeAction( 'test.action' );

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
		removeAction( 'test.action' );
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
		removeAction( 'test.action' );
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
		removeFilter( 'test.filter' );
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

		// Reset state for testing.
		removeAction( 'test.action' );
		addAction( 'another.action', function(){} );
		doAction( 'another.action' );

		// Verify no action is running yet.
		expect( ! doingAction( 'test.action' ) ).toBeTruthy();

		expect( didAction( 'test.action' ) ).toBe( 0 );
		expect( ! hasAction( 'test.action' ) ).toBeTruthy();

		addAction( 'test.action', action_a );

		// Verify action added, not running yet.
		expect( ! doingAction( 'test.action' ) ).toBeTruthy();
		expect( didAction( 'test.action' ) ).toBe( 0 );
		expect( hasAction( 'test.action' ) ).toBeTruthy();

		doAction( 'test.action' );

		// Verify action added and running.
		expect( doingAction( 'test.action' ) ).toBeTruthy();
		expect( didAction( 'test.action' ) ).toBe( 1 );
		expect( hasAction( 'test.action' ) ).toBeTruthy();

		doAction( 'test.action' );
		expect( didAction( 'test.action' ) ).toBe( 2 );

		removeAction( 'test.action' );

		// Verify state is reset appropriately.
		expect( doingAction( 'test.action' ) ).toBeTruthy();
		expect( didAction( 'test.action' ) ).toBe( 0 );
		expect( ! hasAction( 'test.action' ) ).toBeTruthy();

		doAction( 'another.action' );
		expect( ! doingAction( 'test.action' ) ).toBeTruthy();

		// Verify hasAction returns false when no matching action.
		expect( ! hasAction( 'notatest.action' ) ).toBeTruthy();

	} );
} );

describe( 'Verify doingFilter, didFilter and hasFilter.', function() {
	it( 'should', () => {
		addFilter( 'runtest.filter', filter_check );

		// Verify filter added and running.
		var test = applyFilters( 'runtest.filter', true );
		expect( didFilter( 'runtest.filter' ), 1, 'The runtest.filter has run once.' );
		expect( hasFilter( 'runtest.filter' ), 'The runtest.filter is registered.' );
		expect( ! hasFilter( 'notatest.filter' ), 'The notatest.filter is not registered.' );

		removeFilter( 'runtest.filter' );
	} );
} );


