/**
 * Internal dependencies
 */
import { getQueriedItems } from '../selectors';

describe( 'getQueriedItems', () => {
	it( 'should return null if requesting but no item IDs', () => {
		const state = {
			items: {},
			queries: {
				'': {
					itemIds: null,
					requestingPageByPerPage: {
						10: {
							1: true,
						},
					},
				},
			},
		};

		const result = getQueriedItems( state );

		expect( result ).toBe( null );
	} );
} );
