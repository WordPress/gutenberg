/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { getEntityFieldCollections } from '../resolvers';

jest.mock( '@wordpress/api-fetch' );

const mockedApiFetch = apiFetch as unknown as jest.Mock;

describe( 'getEntityFieldCollections resolver', () => {
	beforeEach( () => {
		mockedApiFetch.mockReset();
	} );

	it( 'fetches collections and dispatches them', async () => {
		const collections = [
			{
				id: 'core/post-fields',
				kind: 'postType',
				name: 'post',
				fields: [],
			},
		];
		mockedApiFetch.mockResolvedValue( collections );
		const dispatch = { receiveEntityFieldCollections: jest.fn() };

		await getEntityFieldCollections(
			'postType',
			'post'
		)( {
			dispatch,
		} as any );

		expect( mockedApiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/field-collections?kind=postType&name=post',
		} );
		expect( dispatch.receiveEntityFieldCollections ).toHaveBeenCalledWith(
			'postType',
			'post',
			collections
		);
	} );

	it( 'swallows fetch errors without dispatching', async () => {
		mockedApiFetch.mockRejectedValue( new Error( 'network' ) );
		const dispatch = { receiveEntityFieldCollections: jest.fn() };

		await expect(
			getEntityFieldCollections(
				'postType',
				'post'
			)( {
				dispatch,
			} as any )
		).resolves.toBeUndefined();

		expect( dispatch.receiveEntityFieldCollections ).not.toHaveBeenCalled();
	} );
} );
