/**
 * Internal dependencies
 */
import { extractColorSlug, extractPresetSlug } from '../color-values';

describe( 'extractColorSlug', () => {
	it( 'extracts the slug from the user preset format (var:preset|color|slug)', () => {
		expect( extractColorSlug( 'var:preset|color|dark-text' ) ).toBe(
			'dark-text'
		);
	} );

	it( 'extracts the slug from the theme CSS-var format (var(--wp--preset--color--slug))', () => {
		expect(
			extractColorSlug( 'var(--wp--preset--color--vivid-purple)' )
		).toBe( 'vivid-purple' );
	} );

	it( 'handles slugs that contain hyphens', () => {
		expect(
			extractColorSlug( 'var:preset|color|my-custom-blue-100' )
		).toBe( 'my-custom-blue-100' );
		expect(
			extractColorSlug( 'var(--wp--preset--color--my-custom-blue-100)' )
		).toBe( 'my-custom-blue-100' );
	} );

	it( 'returns undefined for a plain hex value', () => {
		expect( extractColorSlug( '#000000' ) ).toBeUndefined();
	} );

	it( 'returns undefined for non-string values', () => {
		expect( extractColorSlug( undefined ) ).toBeUndefined();
		expect( extractColorSlug( null ) ).toBeUndefined();
		expect( extractColorSlug( 42 ) ).toBeUndefined();
	} );

	it( 'returns undefined for a theme var missing its closing parenthesis', () => {
		expect(
			extractColorSlug( 'var(--wp--preset--color--oops' )
		).toBeUndefined();
	} );
} );

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
