/**
 * Internal dependencies
 */
import { default as castError, ReduxRoutineResponseError } from '../cast-error';

describe( 'castError', () => {
	it( 'should return error verbatim', () => {
		const error = new Error( 'Foo' );

		expect( castError( error ) ).toBe( error );
	} );

	it( 'should return string as message of redux routine response error', () => {
		const error = 'Foo';

		expect( castError( error ) )
			.toEqual( new ReduxRoutineResponseError( 'Foo' ) );
	} );
	describe( 'should handle non string error values', () => {
		[
			[
				'an object',
				{ foo: 'bar' },
			],
			[
				'an array',
				[ 0, 1, 2 ],
			],
			[
				'null',
				null,
			],
		].forEach( ( [
			descriptionPart,
			testErrorValue,
		] ) => {
			it( 'should return expected result when error is ' +
				descriptionPart, () => {
				const actual = castError( testErrorValue );
				expect( actual )
					.toEqual( new ReduxRoutineResponseError( testErrorValue ) );
				expect( actual.response ).toEqual( testErrorValue );
				expect( actual.message ).toEqual( 'ReduxRoutineResponseError' );
			} );
		} );
	} );
} );
