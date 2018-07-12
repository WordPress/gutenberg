/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import {
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import '@wordpress/core-data'; // Needed to load the core store

/**
 * Internal dependencies
 */
import {
	fetchReusableBlocks,
} from '../reusable-blocks';
import {
	receiveReusableBlocks as receiveReusableBlocksAction,
	fetchReusableBlocks as fetchReusableBlocksAction,
} from '../../actions';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

describe( 'reusable blocks effects', () => {
	beforeAll( () => {
		registerBlockType( 'core/test-block', {
			title: 'Test block',
			category: 'common',
			save: () => null,
			attributes: {
				name: { type: 'string' },
			},
		} );
		registerBlockType( 'core/block', {
			title: 'Reusable Block',
			category: 'common',
			save: () => null,
			attributes: {
				ref: { type: 'string' },
			},
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'core/test-block' );
		unregisterBlockType( 'core/block' );
	} );

	describe( 'fetchReusableBlocks', () => {
		it( 'should fetch multiple reusable blocks', async () => {
			const blockPromise = Promise.resolve( [
				{
					id: 123,
					title: {
						raw: 'My cool block',
					},
					content: {
						raw: '<!-- wp:test-block {"name":"Big Bird"} /-->',
					},
				},
			] );
			const postTypePromise = Promise.resolve( {
				slug: 'wp_block', rest_base: 'blocks',
			} );

			apiFetch.mockImplementation( ( options ) => {
				if ( options.path === '/wp/v2/types/wp_block?context=edit' ) {
					return postTypePromise;
				}

				return blockPromise;
			} );

			const dispatch = jest.fn();
			const store = { getState: noop, dispatch };

			await fetchReusableBlocks( fetchReusableBlocksAction(), store );

			expect( dispatch ).toHaveBeenCalledWith(
				receiveReusableBlocksAction( [
					{
						reusableBlock: {
							id: 123,
							title: {
								raw: 'My cool block',
							},
							content: {
								raw: '<!-- wp:test-block {"name":"Big Bird"} /-->',
							},
						},
						parsedBlock: expect.objectContaining( {
							name: 'core/test-block',
							attributes: { name: 'Big Bird' },
						} ),
					},
				] )
			);
			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'FETCH_REUSABLE_BLOCKS_SUCCESS',
				id: undefined,
			} );
		} );

		it( 'should handle an API error', async () => {
			const blockPromise = Promise.reject( {
				code: 'unknown_error',
				message: 'An unknown error occurred.',
			} );
			const postTypePromise = Promise.resolve( {
				slug: 'wp_block', rest_base: 'blocks',
			} );

			apiFetch.mockImplementation( ( options ) => {
				if ( options.path === '/wp/v2/types/wp_block?context=edit' ) {
					return postTypePromise;
				}

				return blockPromise;
			} );

			const dispatch = jest.fn();
			const store = { getState: noop, dispatch };

			await fetchReusableBlocks( fetchReusableBlocksAction(), store );

			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'FETCH_REUSABLE_BLOCKS_FAILURE',
				error: {
					code: 'unknown_error',
					message: 'An unknown error occurred.',
				},
			} );
		} );
	} );
} );
