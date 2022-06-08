/**
 * Internal dependencies
 */
import { extractColorNameFromCurrentValue } from '../';

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
} );
