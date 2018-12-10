/**
 * Internal dependencies
 */
import { cleanForSlug } from '../url';

describe( 'cleanForSlug()', () => {
	it( 'Should return string prepared for use as url slug', () => {
		expect( cleanForSlug( ' /Déjà_vu. ' ) ).toBe( 'deja-vu' );
	} );
} );
