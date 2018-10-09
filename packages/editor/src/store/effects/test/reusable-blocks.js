/**
 * External dependencies
 */
import { noop, reduce } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import {
	registerBlockType,
	unregisterBlockType,
	createBlock,
} from '@wordpress/blocks';
import '@wordpress/core-data'; // Needed to load the core store

/**
 * Internal dependencies
 */
import {
	fetchReusableBlocks,
	saveReusableBlocks,
	receiveReusableBlocks,
	deleteReusableBlocks,
	convertBlockToStatic,
	convertBlockToReusable,
} from '../reusable-blocks';
import {
	resetBlocks,
	receiveBlocks,
	saveReusableBlock,
	deleteReusableBlock,
	removeBlocks,
	convertBlockToReusable as convertBlockToReusableAction,
	convertBlockToStatic as convertBlockToStaticAction,
	receiveReusableBlocks as receiveReusableBlocksAction,
	fetchReusableBlocks as fetchReusableBlocksAction,
} from '../../actions';
import reducer from '../../reducer';

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
					title: 'My cool block',
					content: '<!-- wp:test-block {"name":"Big Bird"} /-->',
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
							title: 'My cool block',
							content: '<!-- wp:test-block {"name":"Big Bird"} /-->',
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

		it( 'should fetch a single reusable block', async () => {
			const blockPromise = Promise.resolve( {
				id: 123,
				title: 'My cool block',
				content: '<!-- wp:test-block {"name":"Big Bird"} /-->',
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

			await fetchReusableBlocks( fetchReusableBlocksAction( 123 ), store );

			expect( dispatch ).toHaveBeenCalledWith(
				receiveReusableBlocksAction( [
					{
						reusableBlock: {
							id: 123,
							title: 'My cool block',
							content: '<!-- wp:test-block {"name":"Big Bird"} /-->',
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
				id: 123,
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

	describe( 'saveReusableBlocks', () => {
		it( 'should save a reusable block and swap its id', async () => {
			const savePromise = Promise.resolve( { id: 456 } );
			const postTypePromise = Promise.resolve( {
				slug: 'wp_block', rest_base: 'blocks',
			} );

			apiFetch.mockImplementation( ( options ) => {
				if ( options.path === '/wp/v2/types/wp_block?context=edit' ) {
					return postTypePromise;
				}

				return savePromise;
			} );

			const reusableBlock = { id: 123, title: 'My cool block' };
			const parsedBlock = createBlock( 'core/test-block', { name: 'Big Bird' } );

			const state = reduce( [
				receiveReusableBlocksAction( [ { reusableBlock, parsedBlock } ] ),
				receiveBlocks( [ parsedBlock ] ),
			], reducer, undefined );

			const dispatch = jest.fn();
			const store = { getState: () => state, dispatch };

			await saveReusableBlocks( saveReusableBlock( 123 ), store );

			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'SAVE_REUSABLE_BLOCK_SUCCESS',
				id: 123,
				updatedId: 456,
			} );
		} );

		it( 'should handle an API error', async () => {
			const savePromise = Promise.reject( {} );
			const postTypePromise = Promise.resolve( {
				slug: 'wp_block', rest_base: 'blocks',
			} );

			apiFetch.mockImplementation( ( options ) => {
				if ( options.path === '/wp/v2/types/wp_block?context=edit' ) {
					return postTypePromise;
				}

				return savePromise;
			} );

			const reusableBlock = { id: 123, title: 'My cool block' };
			const parsedBlock = createBlock( 'core/test-block', { name: 'Big Bird' } );

			const state = reduce( [
				receiveReusableBlocksAction( [ { reusableBlock, parsedBlock } ] ),
				receiveBlocks( [ parsedBlock ] ),
			], reducer, undefined );

			const dispatch = jest.fn();
			const store = { getState: () => state, dispatch };
			await saveReusableBlocks( saveReusableBlock( 123 ), store );

			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'SAVE_REUSABLE_BLOCK_FAILURE',
				id: 123,
			} );
		} );
	} );

	describe( 'receiveReusableBlocks', () => {
		it( 'should receive parsed blocks', () => {
			const action = receiveReusableBlocksAction( [
				{
					parsedBlock: { clientId: 'broccoli' },
				},
			] );

			expect( receiveReusableBlocks( action ) ).toEqual( receiveBlocks( [
				{ clientId: 'broccoli' },
			] ) );
		} );
	} );

	describe( 'deleteReusableBlocks', () => {
		it( 'should delete a reusable block', async () => {
			const deletePromise = Promise.resolve( {} );
			const postTypePromise = Promise.resolve( {
				slug: 'wp_block', rest_base: 'blocks',
			} );

			apiFetch.mockImplementation( ( options ) => {
				if ( options.path === '/wp/v2/types/wp_block?context=edit' ) {
					return postTypePromise;
				}

				return deletePromise;
			} );

			const associatedBlock = createBlock( 'core/block', { ref: 123 } );
			const reusableBlock = { id: 123, title: 'My cool block' };
			const parsedBlock = createBlock( 'core/test-block', { name: 'Big Bird' } );

			const state = reduce( [
				resetBlocks( [ associatedBlock ] ),
				receiveReusableBlocksAction( [ { reusableBlock, parsedBlock } ] ),
				receiveBlocks( [ parsedBlock ] ),
			], reducer, undefined );

			const dispatch = jest.fn();
			const store = { getState: () => state, dispatch };

			await deleteReusableBlocks( deleteReusableBlock( 123 ), store );

			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'REMOVE_REUSABLE_BLOCK',
				id: 123,
				optimist: expect.any( Object ),
			} );

			expect( dispatch ).toHaveBeenCalledWith(
				removeBlocks( [ associatedBlock.clientId, parsedBlock.clientId ] )
			);

			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'DELETE_REUSABLE_BLOCK_SUCCESS',
				id: 123,
				optimist: expect.any( Object ),
			} );
		} );

		it( 'should handle an API error', async () => {
			const deletePromise = Promise.reject( {} );
			const postTypePromise = Promise.resolve( {
				slug: 'wp_block', rest_base: 'blocks',
			} );

			apiFetch.mockImplementation( ( options ) => {
				if ( options.path === '/wp/v2/types/wp_block?context=edit' ) {
					return postTypePromise;
				}

				return deletePromise;
			} );

			const reusableBlock = { id: 123, title: 'My cool block' };
			const parsedBlock = createBlock( 'core/test-block', { name: 'Big Bird' } );

			const state = reduce( [
				receiveReusableBlocksAction( [ { reusableBlock, parsedBlock } ] ),
				receiveBlocks( [ parsedBlock ] ),
			], reducer, undefined );

			const dispatch = jest.fn();
			const store = { getState: () => state, dispatch };

			await deleteReusableBlocks( deleteReusableBlock( 123 ), store );

			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'DELETE_REUSABLE_BLOCK_FAILURE',
				id: 123,
				optimist: expect.any( Object ),
			} );
		} );

		it( 'should not save reusable blocks with temporary IDs', async () => {
			const reusableBlock = { id: 'reusable1', title: 'My cool block' };
			const parsedBlock = createBlock( 'core/test-block', { name: 'Big Bird' } );

			const state = reduce( [
				receiveReusableBlocksAction( [ { reusableBlock, parsedBlock } ] ),
				receiveBlocks( [ parsedBlock ] ),
			], reducer, undefined );

			const dispatch = jest.fn();
			const store = { getState: () => state, dispatch };

			await deleteReusableBlocks( deleteReusableBlock( 'reusable1' ), store );

			expect( dispatch ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'convertBlockToStatic', () => {
		it( 'should convert a reusable block into a static block', () => {
			const associatedBlock = createBlock( 'core/block', { ref: 123 } );
			const reusableBlock = { id: 123, title: 'My cool block' };
			const parsedBlock = createBlock( 'core/test-block', { name: 'Big Bird' } );

			const state = reduce( [
				resetBlocks( [ associatedBlock ] ),
				receiveReusableBlocksAction( [ { reusableBlock, parsedBlock } ] ),
				receiveBlocks( [ parsedBlock ] ),
			], reducer, undefined );

			const dispatch = jest.fn();
			const store = { getState: () => state, dispatch };

			convertBlockToStatic( convertBlockToStaticAction( associatedBlock.clientId ), store );

			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'REPLACE_BLOCKS',
				clientIds: [ associatedBlock.clientId ],
				blocks: [
					expect.objectContaining( {
						name: 'core/test-block',
						attributes: { name: 'Big Bird' },
					} ),
				],
				time: expect.any( Number ),
			} );
		} );
	} );

	describe( 'convertBlockToReusable', () => {
		it( 'should convert a static block into a reusable block', () => {
			const staticBlock = createBlock( 'core/block', { ref: 123 } );
			const state = reducer( undefined, resetBlocks( [ staticBlock ] ) );

			const dispatch = jest.fn();
			const store = { getState: () => state, dispatch };

			convertBlockToReusable( convertBlockToReusableAction( staticBlock.clientId ), store );

			expect( dispatch ).toHaveBeenCalledWith(
				receiveReusableBlocksAction( [ {
					reusableBlock: {
						id: expect.stringMatching( /^reusable/ ),
						clientId: staticBlock.clientId,
						title: 'Untitled Reusable Block',
					},
					parsedBlock: staticBlock,
				} ] )
			);

			expect( dispatch ).toHaveBeenCalledWith(
				saveReusableBlock( expect.stringMatching( /^reusable/ ) ),
			);

			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'REPLACE_BLOCKS',
				clientIds: [ staticBlock.clientId ],
				blocks: [
					expect.objectContaining( {
						name: 'core/block',
						attributes: { ref: expect.stringMatching( /^reusable/ ) },
					} ),
				],
				time: expect.any( Number ),
			} );

			expect( dispatch ).toHaveBeenCalledWith(
				receiveBlocks( [ staticBlock ] ),
			);
		} );
	} );
} );
