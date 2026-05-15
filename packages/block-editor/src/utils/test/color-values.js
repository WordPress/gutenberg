/**
 * Internal dependencies
 */
import { extractColorSlug } from '../color-values';

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
