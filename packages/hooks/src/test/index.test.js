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
	ok( doingFilter( 'runtest.filter' ), 'The runtest.filter is running.' );
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



