/**
 * Internal dependencies
 */
import { getQueryParts } from '../get-query-parts';

describe( 'getQueryParts', () => {
	it( 'parses out pagination data', () => {
		const parts = getQueryParts( { page: 2, perPage: 2 } );

		expect( parts ).toEqual( {
			page: 2,
			perPage: 2,
			stableKey: '',
		} );
	} );

	it( 'encodes stable string key', () => {
		const first = getQueryParts( { '?': '&', b: 2 } );
		const second = getQueryParts( { b: 2, '?': '&' } );

		expect( first ).toEqual( second );
		expect( first ).toEqual( {
			page: 1,
			perPage: 10,
			stableKey: '%3F=%26&b=2',
		} );
	} );
} );
