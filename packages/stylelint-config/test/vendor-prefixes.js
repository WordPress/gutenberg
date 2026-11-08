import { beforeEach, describe, expect, it } from 'vitest';
import { getStylelintResult } from './utils';

describe( 'flags no warnings with valid vendor prefixes css', () => {
	let result;

	beforeEach( () => {
		result = getStylelintResult( './vendor-prefixes-valid.css' );
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
