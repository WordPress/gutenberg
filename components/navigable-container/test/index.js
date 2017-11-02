/**
 * External dependencies
 */
import { mount } from 'enzyme';

/**
 * WordPress dependencies
 */
import { keycodes } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import { NavigableGrid, TabbableContainer, NavigableMenu } from '../';

const { UP, DOWN, TAB, LEFT, RIGHT } = keycodes;

function fireKeyDown( container, keyCode ) {
	container.simulate( 'keydown', {
		stopPropagation: () => {},
		preventDefault: () => {},
		keyCode,
	} );
}

describe( 'NavigableMenu', () => {
	// Skipping this this because the `isVisible` check in utils/focus/tabbable.js always returns false in tests
	// Probbably a jsdom issue
	// eslint-disable-next-line jest/no-disabled-tests
	it.skip( 'should navigate by keypresses', () => {
		let currentIndex = 0;
		const wrapper = mount( (
			<NavigableMenu onNavigate={ ( index ) => currentIndex = index }>
				<button id="btn1">One</button>
				<button id="btn2">Two</button>
				<button id="btn3">Three</button>
			</NavigableMenu >
		) );

		const container = wrapper.find( 'div' );
		wrapper.find( '#btn1' ).get( 0 ).focus();

		// Navigate options
		function assertKeyDown( keyCode, expectedActiveIndex ) {
			fireKeyDown( container, keyCode );
			expect( currentIndex ).toBe( expectedActiveIndex );
		}

		assertKeyDown( DOWN, 1 );
		assertKeyDown( DOWN, 2 );
		assertKeyDown( UP, 1 );
	} );
} );

describe( 'NavigableGrid', () => {
	// Skipping this this because the `isVisible` check in utils/focus/tabbable.js always returns false in tests
	// Probbably a jsdom issue
	// eslint-disable-next-line jest/no-disabled-tests
	it.skip( 'should navigate by keypresses', () => {
		let currentIndex = 0;
		const wrapper = mount( (
			<NavigableGrid onNavigate={ ( index ) => currentIndex = index } width={ 3 }>
				<button id="a1">A1</button>
				<button id="b1">B1</button>
				<button id="c1">C1</button>
				<button id="a2">A2</button>
				<button id="b2">B2</button>
				<button id="c2">C2</button>
			</NavigableGrid >
		) );

		const container = wrapper.find( 'div' );
		wrapper.find( '#a1' ).get( 0 ).focus();

		// Navigate options
		function assertKeyDown( keyCode, expectedActiveIndex ) {
			fireKeyDown( container, keyCode );
			expect( currentIndex ).toBe( expectedActiveIndex );
		}

		assertKeyDown( DOWN, 3 );
		assertKeyDown( DOWN, 0 );
		assertKeyDown( UP, 3 );
		assertKeyDown( LEFT, 5 );
		assertKeyDown( LEFT, 4 );
		assertKeyDown( RIGHT, 5 );
	} );
} );

describe( 'TabbableContainer', () => {
	// Skipping this this because the `isVisible` check in utils/focus/tabbable.js always returns false in tests
	// Probbably a jsdom issue
	// eslint-disable-next-line jest/no-disabled-tests
	it.skip( 'should navigate by keypresses', () => {
		let currentIndex = 0;
		const wrapper = mount( (
			<TabbableContainer onNavigate={ ( index ) => currentIndex = index }>
				<div id="section1" tabIndex="0">Section One</div>
				<div id="section2" tabIndex="0">Section Two</div>
				<div id="section3" tabIndex="0">Section Three</div>
			</TabbableContainer >
		) );

		const container = wrapper.find( 'div' );
		wrapper.find( '#section1' ).get( 0 ).focus();

		// Navigate options
		function assertKeyDown( keyCode, expectedActiveIndex ) {
			fireKeyDown( container, keyCode );
			expect( currentIndex ).toBe( expectedActiveIndex );
		}

		assertKeyDown( TAB, 1 );
		assertKeyDown( TAB, 2 );
		assertKeyDown( TAB, 0 );
	} );
} );
