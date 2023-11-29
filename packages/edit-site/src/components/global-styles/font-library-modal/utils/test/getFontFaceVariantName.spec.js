/**
 * Internal dependencies
 */
import { getFontFaceVariantName } from '../index';

describe( 'getFontFaceVariantName', () => {
	it( 'should return "Normal" for fontWeight 400 and fontStyle "normal"', () => {
		const face = { fontWeight: 400, fontStyle: 'normal' };
		const result = getFontFaceVariantName( face );
		expect( result ).toBe( 'Normal ' );
	} );

	it( 'should return "Bold Italic" for fontWeight 700 and fontStyle "italic"', () => {
		const face = { fontWeight: 700, fontStyle: 'italic' };
		const result = getFontFaceVariantName( face );
		expect( result ).toBe( 'Bold Italic' );
	} );

	it( 'should return the numerical weight when fontWeight is not recognized', () => {
		const face = { fontWeight: 150, fontStyle: 'normal' };
		const result = getFontFaceVariantName( face );
		expect( result ).toBe( '150 ' );
	} );

	it( 'should return the raw style when fontStyle is not recognized', () => {
		const face = { fontWeight: 400, fontStyle: 'oblique' };
		const result = getFontFaceVariantName( face );
		expect( result ).toBe( 'Normal oblique' );
	} );
} );
