/**
 * Internal dependencies
 */
import { getEntityFieldCollections } from '../selectors';
import type { State } from '../types';

describe( 'getEntityFieldCollections', () => {
	const state: State = {
		fieldCollections: {
			'postType-post': [
				{
					id: 'core/post-fields',
					kind: 'postType',
					name: 'post',
					fields: [],
				},
			],
		},
	};

	it( 'returns the collections for a known entity', () => {
		expect(
			getEntityFieldCollections( state, 'postType', 'post' )
		).toEqual( state.fieldCollections[ 'postType-post' ] );
	} );

	it( 'returns an empty array for an unknown entity', () => {
		expect(
			getEntityFieldCollections( state, 'postType', 'page' )
		).toEqual( [] );
	} );
} );
