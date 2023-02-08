/**
 * Internal dependencies
 */
import {
	extractColorNameFromCurrentValue,
	showTransparentBackground,
	normalizeColorValue,
} from '../utils';

describe( 'ColorPalette: Utils', () => {
	describe( 'extractColorNameFromCurrentValue', () => {
		test( 'should support hex values', () => {
			const result = extractColorNameFromCurrentValue( '#00f', [
				{ name: 'Red', color: '#f00' },
				{ name: 'Blue', color: '#00f' },
			] );
			expect( result ).toBe( 'Blue' );
		} );

		test( 'should support CSS variables', () => {
			const result = extractColorNameFromCurrentValue( 'var(--blue)', [
				{ name: 'Red', color: 'var(--red)' },
				{ name: 'Blue', color: 'var(--blue)' },
			] );
			expect( result ).toBe( 'Blue' );
		} );
	} );
	describe( 'showTransparentBackground', () => {
		test( 'should return true for undefined color values', () => {
			expect( showTransparentBackground( undefined ) ).toBe( true );
		} );
		test( 'should return true for transparent colors', () => {
			expect( showTransparentBackground( 'transparent' ) ).toBe( true );
			expect( showTransparentBackground( '#75757500' ) ).toBe( true );
		} );
		test( 'should return false for non-transparent colors', () => {
			expect( showTransparentBackground( '#FFF' ) ).toBe( false );
			expect( showTransparentBackground( '#757575' ) ).toBe( false );
			expect( showTransparentBackground( '#f5f5f524' ) ).toBe( false ); // 0.14 alpha.
		} );
	} );

	describe( 'normalizeColorValue', () => {
		test( 'should return the value as is if the color value is not a CSS variable', () => {
			const element = document.createElement( 'div' );
			expect( normalizeColorValue( '#ff0000', element ) ).toBe(
				'#ff0000'
			);
		} );
		test( 'should return the background color computed from a element if the color value is a CSS variable', () => {
			const element = document.createElement( 'div' );
			element.style.backgroundColor = '#ff0000';
			expect( normalizeColorValue( 'var(--red)', element ) ).toBe(
				'#ff0000'
			);
		} );
	} );
} );
