/**
 * Internal dependencies
 */
import {
	extractPresetSlug,
	encodeColorValueWithPalette,
} from '../color-values';

describe( 'extractPresetSlug', () => {
	it( 'extracts the slug for a color from the user preset format', () => {
		expect(
			extractPresetSlug( 'var:preset|color|dark-text', 'color' )
		).toBe( 'dark-text' );
	} );

	it( 'extracts the slug for a color from the theme CSS-var format', () => {
		expect(
			extractPresetSlug(
				'var(--wp--preset--color--vivid-purple)',
				'color'
			)
		).toBe( 'vivid-purple' );
	} );

	it( 'extracts the slug for a gradient from the user preset format', () => {
		expect(
			extractPresetSlug(
				'var:preset|gradient|blush-bordeaux',
				'gradient'
			)
		).toBe( 'blush-bordeaux' );
	} );

	it( 'extracts the slug for a gradient from the theme CSS-var format', () => {
		expect(
			extractPresetSlug(
				'var(--wp--preset--gradient--blush-bordeaux)',
				'gradient'
			)
		).toBe( 'blush-bordeaux' );
	} );

	it( 'handles slugs that contain hyphens for any type', () => {
		expect(
			extractPresetSlug(
				'var:preset|gradient|my-custom-gradient-100',
				'gradient'
			)
		).toBe( 'my-custom-gradient-100' );
		expect(
			extractPresetSlug(
				'var(--wp--preset--gradient--my-custom-gradient-100)',
				'gradient'
			)
		).toBe( 'my-custom-gradient-100' );
	} );

	it( 'returns undefined for a non-matching type', () => {
		expect(
			extractPresetSlug( 'var:preset|color|dark-text', 'gradient' )
		).toBeUndefined();
		expect(
			extractPresetSlug(
				'var(--wp--preset--color--vivid-purple)',
				'gradient'
			)
		).toBeUndefined();
	} );

	it( 'returns undefined for non-string values', () => {
		expect( extractPresetSlug( undefined, 'gradient' ) ).toBeUndefined();
		expect( extractPresetSlug( null, 'gradient' ) ).toBeUndefined();
		expect( extractPresetSlug( 42, 'gradient' ) ).toBeUndefined();
	} );

	it( 'returns undefined for a theme var missing its closing parenthesis', () => {
		expect(
			extractPresetSlug( 'var(--wp--preset--gradient--oops', 'gradient' )
		).toBeUndefined();
	} );
} );

describe( 'encodeColorValueWithPalette', () => {
	const palette = [
		{ slug: 'brand-a', color: '#e10000' },
		{ slug: 'brand-b', color: '#e10000' },
		{ slug: 'accent', color: '#0000ff' },
	];

	it( 'encodes the provided slug directly, ignoring the hex value', () => {
		expect(
			encodeColorValueWithPalette( palette, '#e10000', 'brand-b' )
		).toBe( 'var:preset|color|brand-b' );
	} );

	it( 'preserves the user choice when two presets share the same hex', () => {
		// Selecting `brand-b` must not collapse onto `brand-a` (the first
		// palette entry with the same hex). This is the regression guard.
		expect(
			encodeColorValueWithPalette( palette, '#e10000', 'brand-b' )
		).not.toBe( 'var:preset|color|brand-a' );
	} );

	it( 'falls back to matching the hex against the palette when no slug is supplied', () => {
		expect( encodeColorValueWithPalette( palette, '#0000ff' ) ).toBe(
			'var:preset|color|accent'
		);
	} );

	it( 'matches the first entry on hex collision only when no slug is supplied', () => {
		expect( encodeColorValueWithPalette( palette, '#e10000' ) ).toBe(
			'var:preset|color|brand-a'
		);
	} );

	it( 'stores the raw value when the hex is not in the palette and no slug is supplied', () => {
		expect( encodeColorValueWithPalette( palette, '#abcabc' ) ).toBe(
			'#abcabc'
		);
	} );
} );
