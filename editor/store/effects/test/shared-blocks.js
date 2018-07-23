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
	fetchSharedBlocks,
	saveSharedBlocks,
	receiveSharedBlocks,
	deleteSharedBlocks,
	convertBlockToStatic,
	convertBlockToShared,
} from '../shared-blocks';
import {
	resetBlocks,
	receiveBlocks,
	saveSharedBlock,
	deleteSharedBlock,
	removeBlocks,
	convertBlockToShared as convertBlockToSharedAction,
	convertBlockToStatic as convertBlockToStaticAction,
	receiveSharedBlocks as receiveSharedBlocksAction,
	fetchSharedBlocks as fetchSharedBlocksAction,
} from '../../actions';
import reducer from '../../reducer';

describe( 'shared blocks effects', () => {
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
			title: 'Shared Block',
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

	describe( 'fetchSharedBlocks', () => {
		it( 'should fetch multiple shared blocks', async () => {
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

			await fetchSharedBlocks( fetchSharedBlocksAction(), store );

			expect( dispatch ).toHaveBeenCalledWith(
				receiveSharedBlocksAction( [
					{
						sharedBlock: {
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
				type: 'FETCH_SHARED_BLOCKS_SUCCESS',
				id: undefined,
			} );
		} );

		it( 'should fetch a single shared block', async () => {
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

			await fetchSharedBlocks( fetchSharedBlocksAction( 123 ), store );

			expect( dispatch ).toHaveBeenCalledWith(
				receiveSharedBlocksAction( [
					{
						sharedBlock: {
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
				type: 'FETCH_SHARED_BLOCKS_SUCCESS',
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

			await fetchSharedBlocks( fetchSharedBlocksAction(), store );

			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'FETCH_SHARED_BLOCKS_FAILURE',
				error: {
					code: 'unknown_error',
					message: 'An unknown error occurred.',
				},
			} );
		} );
	} );

	describe( 'saveSharedBlocks', () => {
		it( 'should save a shared block and swap its id', async () => {
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

			const sharedBlock = { id: 123, title: 'My cool block' };
			const parsedBlock = createBlock( 'core/test-block', { name: 'Big Bird' } );

			const state = reduce( [
				receiveSharedBlocksAction( [ { sharedBlock, parsedBlock } ] ),
				receiveBlocks( [ parsedBlock ] ),
			], reducer, undefined );

			const dispatch = jest.fn();
			const store = { getState: () => state, dispatch };

			await saveSharedBlocks( saveSharedBlock( 123 ), store );

			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'SAVE_SHARED_BLOCK_SUCCESS',
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

			const sharedBlock = { id: 123, title: 'My cool block' };
			const parsedBlock = createBlock( 'core/test-block', { name: 'Big Bird' } );

			const state = reduce( [
				receiveSharedBlocksAction( [ { sharedBlock, parsedBlock } ] ),
				receiveBlocks( [ parsedBlock ] ),
			], reducer, undefined );

			const dispatch = jest.fn();
			const store = { getState: () => state, dispatch };
			await saveSharedBlocks( saveSharedBlock( 123 ), store );

			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'SAVE_SHARED_BLOCK_FAILURE',
				id: 123,
			} );
		} );
	} );

	describe( 'receiveSharedBlocks', () => {
		it( 'should receive parsed blocks', () => {
			const action = receiveSharedBlocksAction( [
				{
					parsedBlock: { clientId: 'broccoli' },
				},
			] );

			expect( receiveSharedBlocks( action ) ).toEqual( receiveBlocks( [
				{ clientId: 'broccoli' },
			] ) );
		} );
	} );

	describe( 'deleteSharedBlocks', () => {
		it( 'should delete a shared block', async () => {
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
			const sharedBlock = { id: 123, title: 'My cool block' };
			const parsedBlock = createBlock( 'core/test-block', { name: 'Big Bird' } );

			const state = reduce( [
				resetBlocks( [ associatedBlock ] ),
				receiveSharedBlocksAction( [ { sharedBlock, parsedBlock } ] ),
				receiveBlocks( [ parsedBlock ] ),
			], reducer, undefined );

			const dispatch = jest.fn();
			const store = { getState: () => state, dispatch };

			await deleteSharedBlocks( deleteSharedBlock( 123 ), store );

			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'REMOVE_SHARED_BLOCK',
				id: 123,
				optimist: expect.any( Object ),
			} );

			expect( dispatch ).toHaveBeenCalledWith(
				removeBlocks( [ associatedBlock.clientId, parsedBlock.clientId ] )
			);

			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'DELETE_SHARED_BLOCK_SUCCESS',
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

			const sharedBlock = { id: 123, title: 'My cool block' };
			const parsedBlock = createBlock( 'core/test-block', { name: 'Big Bird' } );

			const state = reduce( [
				receiveSharedBlocksAction( [ { sharedBlock, parsedBlock } ] ),
				receiveBlocks( [ parsedBlock ] ),
			], reducer, undefined );

			const dispatch = jest.fn();
			const store = { getState: () => state, dispatch };

			await deleteSharedBlocks( deleteSharedBlock( 123 ), store );

			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'DELETE_SHARED_BLOCK_FAILURE',
				id: 123,
				optimist: expect.any( Object ),
			} );
		} );

		it( 'should not save shared blocks with temporary IDs', async () => {
			const sharedBlock = { id: 'shared1', title: 'My cool block' };
			const parsedBlock = createBlock( 'core/test-block', { name: 'Big Bird' } );

			const state = reduce( [
				receiveSharedBlocksAction( [ { sharedBlock, parsedBlock } ] ),
				receiveBlocks( [ parsedBlock ] ),
			], reducer, undefined );

			const dispatch = jest.fn();
			const store = { getState: () => state, dispatch };

			await deleteSharedBlocks( deleteSharedBlock( 'shared1' ), store );

			expect( dispatch ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'convertBlockToStatic', () => {
		it( 'should convert a shared block into a static block', () => {
			const associatedBlock = createBlock( 'core/block', { ref: 123 } );
			const sharedBlock = { id: 123, title: 'My cool block' };
			const parsedBlock = createBlock( 'core/test-block', { name: 'Big Bird' } );

			const state = reduce( [
				resetBlocks( [ associatedBlock ] ),
				receiveSharedBlocksAction( [ { sharedBlock, parsedBlock } ] ),
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

	describe( 'convertBlockToShared', () => {
		it( 'should convert a static block into a shared block', () => {
			const staticBlock = createBlock( 'core/block', { ref: 123 } );
			const state = reducer( undefined, resetBlocks( [ staticBlock ] ) );

			const dispatch = jest.fn();
			const store = { getState: () => state, dispatch };

			convertBlockToShared( convertBlockToSharedAction( staticBlock.clientId ), store );

			expect( dispatch ).toHaveBeenCalledWith(
				receiveSharedBlocksAction( [ {
					sharedBlock: {
						id: expect.stringMatching( /^shared/ ),
						clientId: staticBlock.clientId,
						title: 'Untitled shared block',
					},
					parsedBlock: staticBlock,
				} ] )
			);

			expect( dispatch ).toHaveBeenCalledWith(
				saveSharedBlock( expect.stringMatching( /^shared/ ) ),
			);

			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'REPLACE_BLOCKS',
				clientIds: [ staticBlock.clientId ],
				blocks: [
					expect.objectContaining( {
						name: 'core/block',
						attributes: { ref: expect.stringMatching( /^shared/ ) },
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
