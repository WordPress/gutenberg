/**
 * Internal dependencies
 */
import { formatFontWeight } from '../format-font-weight';

describe( 'formatFontWeight', () => {
	it( 'should return empty object if weight is not available', () => {
		expect( formatFontWeight() ).toEqual( {} );
	} );

	it( 'should return the same object if weight is already an object', () => {
		const fontWeight = { name: 'Thin', value: '100' };
		expect( formatFontWeight( fontWeight ) ).toEqual( fontWeight );
	} );

	it( 'should return the formatted font weight', () => {
		expect( formatFontWeight( '100' ) ).toEqual( {
			name: 'Thin',
			value: '100',
		} );
		expect( formatFontWeight( '200' ) ).toEqual( {
			name: 'Extra Light',
			value: '200',
		} );
		expect( formatFontWeight( '300' ) ).toEqual( {
			name: 'Light',
			value: '300',
		} );
		expect( formatFontWeight( '400' ) ).toEqual( {
			name: 'Regular',
			value: '400',
		} );
		expect( formatFontWeight( '500' ) ).toEqual( {
			name: 'Medium',
			value: '500',
		} );
		expect( formatFontWeight( '600' ) ).toEqual( {
			name: 'Semi Bold',
			value: '600',
		} );
		expect( formatFontWeight( '700' ) ).toEqual( {
			name: 'Bold',
			value: '700',
		} );
		expect( formatFontWeight( '800' ) ).toEqual( {
			name: 'Extra Bold',
			value: '800',
		} );
		expect( formatFontWeight( '900' ) ).toEqual( {
			name: 'Black',
			value: '900',
		} );
		expect( formatFontWeight( '1000' ) ).toEqual( {
			name: 'Extra Black',
			value: '1000',
		} );
		expect( formatFontWeight( 'normal' ) ).toEqual( {
			name: 'Regular',
			value: 'normal',
		} );
		expect( formatFontWeight( 'bold' ) ).toEqual( {
			name: 'Bold',
			value: 'bold',
		} );
	} );
} );
