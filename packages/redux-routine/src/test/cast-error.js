/**
 * Internal dependencies
 */
import castError from '../cast-error';

describe( 'castError', () => {
	it( 'should return error verbatim', () => {
		const error = new Error( 'Foo' );

		expect( castError( error ) ).toBe( error );
	} );

	it( 'should return string as message of error', () => {
		const error = 'Foo';

		expect( castError( error ) ).toEqual( new Error( 'Foo' ) );
	} );
} );
