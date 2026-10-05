import { beforeEach, describe, expect, it } from 'vitest';
import { getStylelintResult } from './utils';

describe( 'flags no warnings with valid custom-property-pattern css', () => {
	let result;

	beforeEach( () => {
		result = getStylelintResult( './custom-property-pattern-valid.css' );
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

describe( 'flags warnings with invalid custom-property-pattern css', () => {
	let result;

	beforeEach( () => {
		result = getStylelintResult( './custom-property-pattern-invalid.css' );
	} );

	it( 'did error', () => {
		return result.then( ( data ) => expect( data.errored ).toBeTruthy() );
	} );

	it( 'flags correct number of warnings', () => {
		return result.then( ( data ) =>
			expect( data.results[ 0 ].warnings ).toHaveLength( 4 )
		);
	} );

	it( 'snapshot matches warnings', () => {
		return result.then( ( data ) =>
			expect( data.results[ 0 ].warnings ).toMatchSnapshot()
		);
	} );
} );
