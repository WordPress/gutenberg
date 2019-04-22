/**
 * WordPress dependencies
 */
import { UP, DOWN, LEFT, RIGHT } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { isNavigationCandidate } from '../';

describe( 'isNavigationCandidate', () => {
	let elements;
	beforeAll( () => {
		elements = {};
		elements.input = document.createElement( 'input' );
		elements.contentEditable = document.createElement( 'p' );
		elements.contentEditable.contentEditable = true;
	} );

	it( 'should return true if vertically navigating input without modifier', () => {
		[ UP, DOWN ].forEach( ( keyCode ) => {
			const result = isNavigationCandidate( elements.input, keyCode, false );

			expect( result ).toBe( true );
		} );
	} );

	it( 'should return false if vertically navigating input with modifier', () => {
		[ UP, DOWN ].forEach( ( keyCode ) => {
			const result = isNavigationCandidate( elements.input, keyCode, true );

			expect( result ).toBe( false );
		} );
	} );

	it( 'should return false if horizontally navigating input', () => {
		[ LEFT, RIGHT ].forEach( ( keyCode ) => {
			const result = isNavigationCandidate( elements.input, keyCode, false );

			expect( result ).toBe( false );
		} );
	} );

	it( 'should return true if horizontally navigating non-input', () => {
		[ LEFT, RIGHT ].forEach( ( keyCode ) => {
			const result = isNavigationCandidate( elements.contentEditable, keyCode, false );

			expect( result ).toBe( true );
		} );
	} );
} );
