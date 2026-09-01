import { describe, expect, it } from 'vitest';
import { getHighlightTextColorStyle } from '../utils';

describe( 'getHighlightTextColorStyle', () => {
	it( 'inherits block text color when only a background color is set', () => {
		expect(
			getHighlightTextColorStyle( { backgroundColor: '#ffeb3b' } )
		).toBe( 'color:inherit' );
	} );

	it( 'does not inherit text color when a text color is explicitly set', () => {
		expect(
			getHighlightTextColorStyle( {
				color: '#cf2e2e',
				backgroundColor: '#ffeb3b',
			} )
		).toBeNull();
	} );

	it( 'does not inherit text color for text-only highlights', () => {
		expect( getHighlightTextColorStyle( { color: '#cf2e2e' } ) ).toBeNull();
	} );
} );
