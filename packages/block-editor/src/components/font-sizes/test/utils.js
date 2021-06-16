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
		const fontSizeClass = getFontSizeClass( '14' );
		expect( fontSizeClass ).toBe( 'has-14-font-size' );
	} );

	it( 'Should throw a warning when given a number', () => {
		const fontSizeClass = getFontSizeClass( 16 );
		expect( fontSizeClass ).toBe( 'has-16-font-size' );
		expect( console ).toHaveWarnedWith(
			'The font size slug should be a string.'
		);
	} );

	it( 'Should throw a warning if the argument contains special characters', () => {
		const fontSizeClass = getFontSizeClass( '#abcdef' );
		expect( fontSizeClass ).toBe( 'has-#abcdef-font-size' );
		expect( console ).toHaveWarnedWith(
			'The font size slug should not have any special character.'
		);
	} );
} );
