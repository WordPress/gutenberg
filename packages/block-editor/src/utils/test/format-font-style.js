/**
 * Internal dependencies
 */
import { formatFontStyle } from '../format-font-style';

describe( 'formatFontStyle', () => {
	it( 'should return empty object if style is not available', () => {
		expect( formatFontStyle() ).toEqual( {} );
	} );

	it( 'should return the same object if style is already an object', () => {
		const fontStyle = { name: 'Italic', value: 'italic' };
		expect( formatFontStyle( fontStyle ) ).toEqual( fontStyle );
	} );

	it( 'should return the formatted font style', () => {
		expect( formatFontStyle( 'normal' ) ).toEqual( {
			name: 'Regular',
			value: 'normal',
		} );
		expect( formatFontStyle( 'italic' ) ).toEqual( {
			name: 'Italic',
			value: 'italic',
		} );
		expect( formatFontStyle( 'oblique' ) ).toEqual( {
			name: 'Oblique',
			value: 'oblique',
		} );
		expect( formatFontStyle( 'oblique 40deg' ) ).toEqual( {
			name: 'oblique 40deg',
			value: 'oblique 40deg',
		} );
	} );
} );
