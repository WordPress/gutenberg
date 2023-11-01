/**
 * Internal dependencies
 */
const engine = require( '../lib/engine' );

describe( 'Engine', () => {
	it( 'should return a void IR for undefined code', () => {
		const { ir } = engine( undefined );
		expect( ir ).toHaveLength( 0 );
	} );
} );
