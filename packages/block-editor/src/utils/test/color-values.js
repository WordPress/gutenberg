/**
 * Internal dependencies
 */
import { extractPresetSlug } from '../color-values';

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
