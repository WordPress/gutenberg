import { beforeEach, describe, expect, it } from 'vitest';
import { getStylelintResult } from './utils';

describe( 'flags no warnings when validly positioned declarations are found', () => {
	let result;

	beforeEach( () => {
		result = getStylelintResult(
			'./no-invalid-position-declaration-valid.css'
		);
	} );

	it( 'did not error', () => {
		return result.then( ( data ) => expect( data.errored ).toBeFalsy() );
	} );

	it( 'flags no warnings', () => {
		return result.then( ( data ) =>
			expect( data.results[ 0 ].warnings ).toHaveLength( 0 )
		);
	} );
} );

describe( 'flags warnings when invalidly positioned declarations are found', () => {
	let result;

	beforeEach( () => {
		result = getStylelintResult(
			'./no-invalid-position-declaration-invalid.css'
		);
	} );

	it( 'did error', () => {
		return result.then( ( data ) => expect( data.errored ).toBeTruthy() );
	} );

	it( 'flags correct number of warnings', () => {
		return result.then( ( data ) =>
			expect( data.results[ 0 ].warnings ).toHaveLength( 3 )
		);
	} );

	it( 'snapshot matches warnings', () => {
		return result.then( ( data ) =>
			expect( data.results[ 0 ].warnings ).toMatchSnapshot()
		);
	} );
} );
