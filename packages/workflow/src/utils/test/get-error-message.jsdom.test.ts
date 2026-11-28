import { describe, expect, it } from 'vitest';
import { getErrorMessage } from '../get-error-message';

const FALLBACK =
	'This ability couldn’t run. Check the browser console for details.';

describe( 'getErrorMessage', () => {
	it.each( [
		[ 'undefined', undefined ],
		[ 'null', null ],
		[ 'an empty string', '' ],
		[ 'a plain object without a message', { code: 'oops' } ],
	] )( 'returns the fallback for %s', ( _, error ) => {
		expect( getErrorMessage( error ) ).toBe( FALLBACK );
	} );

	it( 'returns a thrown string', () => {
		expect( getErrorMessage( 'Something broke' ) ).toBe(
			'Something broke'
		);
	} );

	it( 'stringifies other primitives', () => {
		expect( getErrorMessage( 404 ) ).toBe( '404' );
	} );

	it( 'returns the message of an error', () => {
		expect( getErrorMessage( new Error( 'Not allowed' ) ) ).toBe(
			'Not allowed'
		);
	} );

	it( 'returns the message of a plain object', () => {
		expect( getErrorMessage( { message: 'REST failure' } ) ).toBe(
			'REST failure'
		);
	} );

	it( 'returns the name of an error with an empty message', () => {
		expect( getErrorMessage( new TypeError() ) ).toBe( 'TypeError' );
	} );

	it( 'decodes HTML entities', () => {
		expect(
			getErrorMessage( { message: 'You don&#8217;t have access.' } )
		).toBe( 'You don’t have access.' );
	} );
} );
