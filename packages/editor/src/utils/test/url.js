/**
 * Internal dependencies
 */
import { cleanForSlug } from '../url';

describe( 'cleanForSlug()', () => {
	it( 'Should return string prepared for use as url slug', () => {
		expect( cleanForSlug( '/Is th@t Déjà_vu? ' ) ).toBe( 'is-tht-deja_vu' );
	} );

	it( 'Should allow non-latin characters', () => {
		expect( cleanForSlug( 'Καλημέρα Κόσμε' ) ).toBe( 'καλημέρα-κόσμε' );
	} );

	it( 'Should return an empty string for missing argument', () => {
		expect( cleanForSlug() ).toBe( '' );
	} );

	it( 'Should return an empty string for falsy argument', () => {
		expect( cleanForSlug( null ) ).toBe( '' );
	} );
} );
