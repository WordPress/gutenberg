/**
 * Internal dependencies
 */
import * as sources from '../source';

describe( 'sources', () => {
	it( 'should generate sources which apply internal flag', () => {
		for ( const sourceFn in sources ) {
			expect( sources[ sourceFn ]()._wpBlocksKnownSource ).toBe( true );
		}
	} );
} );
