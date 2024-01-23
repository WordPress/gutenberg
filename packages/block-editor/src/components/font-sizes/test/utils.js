/**
 * WordPress dependencies
 */
import { logged } from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { getFontSizeClass } from '../utils';

describe( 'getFontSizeClass()', () => {
	afterEach( () => {
		for ( const key in logged ) {
			delete logged[ key ];
		}
	} );

	it( 'Should return the correct font size class when given a string', () => {
		const fontSizeClass = getFontSizeClass( '14px' );
		expect( fontSizeClass ).toBe( 'has-14-px-font-size' );
	} );

	it( 'Should return the correct font size class when given a number', () => {
		const fontSizeClass = getFontSizeClass( 16 );
		expect( fontSizeClass ).toBe( 'has-16-font-size' );
	} );

	it( 'Should return the correct font size class when the given font size contains special characters', () => {
		const fontSizeClass = getFontSizeClass( '#abcdef' );
		expect( fontSizeClass ).toBe( 'has-abcdef-font-size' );
	} );
} );
