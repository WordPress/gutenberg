/**
 * Internal dependencies
 */
import { cleanForSlug } from '../url';

describe( 'cleanForSlug()', () => {
	it( 'Should return string prepared for use as url slug', () => {
		expect( cleanForSlug( ' /Déjà_vu. ' ) ).toBe( 'deja-vu' );
	} );

	it( 'Should return an empty string for missing argument', () => {
		expect( cleanForSlug() ).toBe( '' );
	} );

	it( 'Should return an empty string for falsy argument', () => {
		expect( cleanForSlug( null ) ).toBe( '' );
	} );
} );
