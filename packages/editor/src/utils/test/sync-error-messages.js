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
	] )(
		'should return title, description, and canRetry for "%s"',
		( code ) => {
			const result = getSyncErrorMessages( { code } );
			expect( result ).toEqual(
				expect.objectContaining( {
					title: expect.any( String ),
					description: expect.any( String ),
					canRetry: expect.any( Boolean ),
				} )
			);
		}
	);

	it( 'should set canRetry to false for authentication-failed', () => {
		const result = getSyncErrorMessages( {
			code: 'authentication-failed',
		} );
		expect( result.canRetry ).toBe( false );
	} );

	it( 'should set canRetry to true for retryable errors', () => {
		expect(
			getSyncErrorMessages( { code: 'connection-expired' } ).canRetry
		).toBe( true );
		expect(
			getSyncErrorMessages( { code: 'connection-limit-exceeded' } )
				.canRetry
		).toBe( true );
		expect(
			getSyncErrorMessages( { code: 'unknown-error' } ).canRetry
		).toBe( true );
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
