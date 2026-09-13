import { describe, expect, it } from 'vitest';
import { getColumnFlexBasis } from '../utils';

describe( 'getColumnFlexBasis', () => {
	it( 'returns lengths unchanged', () => {
		expect( getColumnFlexBasis( '320px' ) ).toBe( '320px' );
		expect( getColumnFlexBasis( '20rem' ) ).toBe( '20rem' );
	} );

	it( 'treats numbers as percentages for template compatibility', () => {
		expect( getColumnFlexBasis( 33.33 ) ).toBe( '33.33%' );
	} );

	it( 'rounds long percentage floats', () => {
		expect( getColumnFlexBasis( '33.333333333333336%' ) ).toBe(
			'33.333333333333%'
		);
	} );

	it( 'resolves preset references to custom properties', () => {
		expect( getColumnFlexBasis( 'var:preset|dimension|wide' ) ).toBe(
			'var(--wp--preset--dimension--wide)'
		);
	} );

	it( 'returns undefined for values without a width', () => {
		expect( getColumnFlexBasis( undefined ) ).toBeUndefined();
		expect( getColumnFlexBasis( '' ) ).toBeUndefined();
		expect( getColumnFlexBasis( 0 ) ).toBeUndefined();
		expect( getColumnFlexBasis( 'auto' ) ).toBeUndefined();
	} );
} );
