/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import { getEntityRecord } from '../selectors';

describe( 'getEntityRecord', () => {
	it( 'should return undefined for unknown record\'s key', () => {
		const state = deepFreeze( {
			entities: {
				root: {
					postType: {
						byKey: {},
					},
				},
			},
		} );
		expect( getEntityRecord( state, 'root', 'postType', 'post' ) ).toBe( undefined );
	} );

	it( 'should return a record by key', () => {
		const state = deepFreeze( {
			entities: {
				root: {
					postType: {
						byKey: {
							post: { slug: 'post' },
						},
					},
				},
			},
		} );
		expect( getEntityRecord( state, 'root', 'postType', 'post' ) ).toEqual( { slug: 'post' } );
	} );
} );
