/**
 * Internal dependencies
 */
import { getSyncErrorMessages } from '../sync-error-messages';

describe( 'getSyncErrorMessages', () => {
	it.each( [
		'authentication-failed',
		'connection-expired',
		'connection-limit-exceeded',
		'document-size-limit-exceeded',
		'unknown-error',
	] )( 'should return title and description for "%s"', ( code ) => {
		const result = getSyncErrorMessages( { code } );
		expect( result ).toEqual(
			expect.objectContaining( {
				title: expect.any( String ),
				description: expect.any( String ),
			} )
		);
	} );

	it( 'should fall back to unknown-error for unrecognized codes', () => {
		const result = getSyncErrorMessages( { code: 'some-new-error' } );
		const unknownResult = getSyncErrorMessages( { code: 'unknown-error' } );
		expect( result ).toBe( unknownResult );
	} );

	it( 'should fall back to unknown-error when error is undefined', () => {
		const result = getSyncErrorMessages( undefined );
		const unknownResult = getSyncErrorMessages( { code: 'unknown-error' } );
		expect( result ).toBe( unknownResult );
	} );
} );
