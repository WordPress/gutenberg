/**
 * Internal dependencies
 */
import { removeItems } from '../actions';

describe( 'removeItems', () => {
	it( 'builds an action object', () => {
		const postIds = [ 1, 2, 3 ];
		expect( removeItems( 'postType', 'post', postIds ) ).toEqual( {
			type: 'REMOVE_ITEMS',
			itemIds: postIds,
			kind: 'postType',
			name: 'post',
			invalidateCache: false,
		} );
	} );
} );
