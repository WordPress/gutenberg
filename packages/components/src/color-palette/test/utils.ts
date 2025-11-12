/**
 * Internal dependencies
 */
import {
	extractColorNameFromCurrentValue,
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

	describe( 'normalizeColorValue', () => {
		test( 'should return the value if the value argument is not a CSS variable', () => {
			const element = document.createElement( 'div' );
			expect( normalizeColorValue( '#ff0000', element ) ).toBe(
				'#ff0000'
			);
		} );
		test( 'should return the background color computed from an element if the value argument is a CSS variable', () => {
			const element = document.createElement( 'div' );
			element.style.backgroundColor = '#ff0000';
			expect( normalizeColorValue( 'var(--red)', element ) ).toBe(
				'#ff0000'
			);
		} );
		test( 'should return the background color computed from an element if the value argument is a color mix', () => {
			const element = document.createElement( 'div' );
			element.style.backgroundColor = '#ff0000';
			expect(
				normalizeColorValue(
					'color-mix(in oklab, #a71e14, white)',
					element
				)
			).toBe( '#ff0000' );
		} );
		test( 'should return the value if the value argument is undefined', () => {
			const element = document.createElement( 'div' );
			expect( normalizeColorValue( undefined, element ) ).toBe(
				undefined
			);
		} );
		test( 'should return the value if the element argument is null', () => {
			expect( normalizeColorValue( '#ff0000', null ) ).toBe( '#ff0000' );
		} );
	} );
} );
