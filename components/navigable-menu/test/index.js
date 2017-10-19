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
import NavigableMenu from '../';

const { UP, DOWN } = keycodes;

describe( 'NavigableMenu', () => {
	// Skipping this this because the `isVisible` check in utils/focus/tabbable.js always returns false in tests
	// Probbably a jsdom issue
	it.skip( 'should navigate by keypresses', () => {
		let currentIndex = 0;
		const wrapper = mount( (
			<NavigableMenu onNavigate={ ( index ) => currentIndex = index }>
				<button id="btn1" tabIndex="0">One</button>
				<button id="btn2" tabIndex="0">Two</button>
				<button id="btn3" tabIndex="0">Three</button>
			</NavigableMenu >
		) );

		const container = wrapper.find( 'div' );
		wrapper.find( '#btn1' ).get( 0 ).focus();

		// Navigate options
		function assertKeyDown( keyCode, expectedActiveIndex ) {
			container.simulate( 'keydown', {
				stopPropagation: () => {},
				preventDefault: () => {},
				keyCode,
			} );

			expect( currentIndex ).toBe( expectedActiveIndex );
		}

		assertKeyDown( DOWN, 1 );
		assertKeyDown( DOWN, 2 );
		assertKeyDown( UP, 1 );
	} );
} );
