import { describe, expect, it } from 'vitest';
import { getDimensionPresetCssVar } from '../utils/dimensions';

describe( 'getDimensionPresetCssVar', () => {
	it( 'returns undefined without a value', () => {
		expect( getDimensionPresetCssVar( undefined ) ).toBeUndefined();
		expect( getDimensionPresetCssVar( '' ) ).toBeUndefined();
	} );

	it( 'passes a plain length through', () => {
		expect( getDimensionPresetCssVar( '25%' ) ).toBe( '25%' );
		expect( getDimensionPresetCssVar( '200px' ) ).toBe( '200px' );
	} );

	it( 'converts a preset reference to its custom property', () => {
		expect( getDimensionPresetCssVar( 'var:preset|dimension|wide' ) ).toBe(
			'var(--wp--preset--dimension--wide)'
		);
	} );

	it( 'kebab-cases the slug, matching the declared custom property', () => {
		expect(
			getDimensionPresetCssVar( 'var:preset|dimension|wideColumn' )
		).toBe( 'var(--wp--preset--dimension--wide-column)' );
		expect( getDimensionPresetCssVar( 'var:preset|dimension|size2' ) ).toBe(
			'var(--wp--preset--dimension--size-2)'
		);
	} );
} );
