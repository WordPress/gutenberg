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
	createBlock,
} from '@wordpress/blocks';
import {
	dispatch as dataDispatch,
	select as dataSelect,
} from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	fetchReusableBlocks,
	saveReusableBlocks,
	deleteReusableBlocks,
	convertBlockToStatic,
	convertBlockToReusable,
} from '../reusable-blocks';
import {
	__experimentalSaveReusableBlock as saveReusableBlock,
	__experimentalDeleteReusableBlock as deleteReusableBlock,
	__experimentalConvertBlockToReusable as convertBlockToReusableAction,
	__experimentalConvertBlockToStatic as convertBlockToStaticAction,
	__experimentalReceiveReusableBlocks as receiveReusableBlocksAction,
	__experimentalFetchReusableBlocks as fetchReusableBlocksAction,
} from '../../actions';
import reducer from '../../reducer';
import '../../..'; // Ensure store dependencies are imported via root.

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
					status: 'publish',
					title: {
						raw: 'My cool block',
					},
					content: {
						raw: '<!-- wp:test-block {"name":"Big Bird"} /-->',
						protected: false,
					},
				},
			] );
			const postTypePromise = Promise.resolve( {
				slug: 'wp_block',
				rest_base: 'blocks',
			} );

			apiFetch.mockImplementation( ( options ) => {
				if ( options.path === '/wp/v2/types/wp_block' ) {
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
						id: 123,
						title: 'My cool block',
						content: '<!-- wp:test-block {"name":"Big Bird"} /-->',
						status: 'publish',
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
				status: 'publish',
				title: {
					raw: 'My cool block',
				},
				content: {
					raw: '<!-- wp:test-block {"name":"Big Bird"} /-->',
					protected: false,
				},
			} );
			const postTypePromise = Promise.resolve( {
				slug: 'wp_block',
				rest_base: 'blocks',
			} );

			apiFetch.mockImplementation( ( options ) => {
				if ( options.path === '/wp/v2/types/wp_block' ) {
					return postTypePromise;
				}

				return blockPromise;
			} );

			const dispatch = jest.fn();
			const store = { getState: noop, dispatch };

			await fetchReusableBlocks(
				fetchReusableBlocksAction( 123 ),
				store
			);

			expect( dispatch ).toHaveBeenCalledWith(
				receiveReusableBlocksAction( [
					{
						id: 123,
						title: 'My cool block',
						content: '<!-- wp:test-block {"name":"Big Bird"} /-->',
						status: 'publish',
					},
				] )
			);
			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'FETCH_REUSABLE_BLOCKS_SUCCESS',
				id: 123,
			} );
		} );

		it( 'should ignore reusable blocks with a trashed post status', async () => {
			const blockPromise = Promise.resolve( {
				id: 123,
				status: 'trash',
				title: {
					raw: 'My cool block',
				},
				content: {
					raw: '<!-- wp:test-block {"name":"Big Bird"} /-->',
					protected: false,
				},
			} );
			const postTypePromise = Promise.resolve( {
				slug: 'wp_block',
				rest_base: 'blocks',
			} );

			apiFetch.mockImplementation( ( options ) => {
				if ( options.path === '/wp/v2/types/wp_block' ) {
					return postTypePromise;
				}

				return blockPromise;
			} );

			const dispatch = jest.fn();
			const store = { getState: noop, dispatch };

			await fetchReusableBlocks(
				fetchReusableBlocksAction( 123 ),
				store
			);

			expect( dispatch ).toHaveBeenCalledTimes( 1 );
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
				slug: 'wp_block',
				rest_base: 'blocks',
			} );

			apiFetch.mockImplementation( ( options ) => {
				if ( options.path === '/wp/v2/types/wp_block' ) {
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
				slug: 'wp_block',
				rest_base: 'blocks',
			} );

			apiFetch.mockImplementation( ( options ) => {
				if ( options.path === '/wp/v2/types/wp_block' ) {
					return postTypePromise;
				}

				return savePromise;
			} );

			const reusableBlock = {
				id: 123,
				title: 'My cool block',
				content: '<!-- wp:test-block {"name":"Big Bird"} /-->',
			};
			const state = reducer(
				undefined,
				receiveReusableBlocksAction( [ reusableBlock ] )
			);

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
				slug: 'wp_block',
				rest_base: 'blocks',
			} );

			apiFetch.mockImplementation( ( options ) => {
				if ( options.path === '/wp/v2/types/wp_block' ) {
					return postTypePromise;
				}

				return savePromise;
			} );

			const reusableBlock = {
				id: 123,
				title: 'My cool block',
				content: '<!-- wp:test-block {"name":"Big Bird"} /-->',
			};
			const state = reducer(
				undefined,
				receiveReusableBlocksAction( [ reusableBlock ] )
			);

			const dispatch = jest.fn();
			const store = { getState: () => state, dispatch };
			await saveReusableBlocks( saveReusableBlock( 123 ), store );

			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'SAVE_REUSABLE_BLOCK_FAILURE',
				id: 123,
			} );
		} );
	} );

	describe( 'deleteReusableBlocks', () => {
		it( 'should delete a reusable block', async () => {
			const deletePromise = Promise.resolve( {} );
			const postTypePromise = Promise.resolve( {
				slug: 'wp_block',
				rest_base: 'blocks',
			} );

			apiFetch.mockImplementation( ( options ) => {
				if ( options.path === '/wp/v2/types/wp_block' ) {
					return postTypePromise;
				}

				return deletePromise;
			} );

			const reusableBlock = {
				id: 123,
				title: 'My cool block',
				content: '<!-- wp:test-block {"name":"Big Bird"} /-->',
			};
			const state = reducer(
				undefined,
				receiveReusableBlocksAction( [ reusableBlock ] )
			);
			const associatedBlock = createBlock( 'core/block', { ref: 123 } );
			jest.spyOn(
				dataSelect( 'core/block-editor' ),
				'getBlocks'
			).mockImplementation( () => [ associatedBlock ] );
			jest.spyOn(
				dataDispatch( 'core/block-editor' ),
				'removeBlocks'
			).mockImplementation( () => {} );

			const dispatch = jest.fn();
			const store = { getState: () => state, dispatch };

			await deleteReusableBlocks( deleteReusableBlock( 123 ), store );

			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'REMOVE_REUSABLE_BLOCK',
				id: 123,
				optimist: expect.any( Object ),
			} );

			expect(
				dataDispatch( 'core/block-editor' ).removeBlocks
			).toHaveBeenCalledWith( [ associatedBlock.clientId ] );

			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'DELETE_REUSABLE_BLOCK_SUCCESS',
				id: 123,
				optimist: expect.any( Object ),
			} );

			dataDispatch( 'core/block-editor' ).removeBlocks.mockReset();
			dataSelect( 'core/block-editor' ).getBlocks.mockReset();
		} );

		it( 'should handle an API error', async () => {
			const deletePromise = Promise.reject( {} );
			const postTypePromise = Promise.resolve( {
				slug: 'wp_block',
				rest_base: 'blocks',
			} );

			apiFetch.mockImplementation( ( options ) => {
				if ( options.path === '/wp/v2/types/wp_block' ) {
					return postTypePromise;
				}

				return deletePromise;
			} );

			const reusableBlock = {
				id: 123,
				title: 'My cool block',
				content: '<!-- wp:test-block {"name":"Big Bird"} /-->',
			};
			const state = reducer(
				undefined,
				receiveReusableBlocksAction( [ reusableBlock ] )
			);
			jest.spyOn(
				dataSelect( 'core/block-editor' ),
				'getBlocks'
			).mockImplementation( () => [] );
			jest.spyOn(
				dataDispatch( 'core/block-editor' ),
				'removeBlocks'
			).mockImplementation( () => {} );

			const dispatch = jest.fn();
			const store = { getState: () => state, dispatch };

			await deleteReusableBlocks( deleteReusableBlock( 123 ), store );

			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'DELETE_REUSABLE_BLOCK_FAILURE',
				id: 123,
				optimist: expect.any( Object ),
			} );
			dataDispatch( 'core/block-editor' ).removeBlocks.mockReset();
			dataSelect( 'core/block-editor' ).getBlocks.mockReset();
		} );

		it( 'should not save reusable blocks with temporary IDs', async () => {
			const reusableBlock = { id: 'reusable1', title: 'My cool block' };
			const state = reducer(
				undefined,
				receiveReusableBlocksAction( [ reusableBlock ] )
			);
			jest.spyOn(
				dataSelect( 'core/block-editor' ),
				'getBlocks'
			).mockImplementation( () => [] );
			jest.spyOn(
				dataDispatch( 'core/block-editor' ),
				'removeBlocks'
			).mockImplementation( () => {} );

			const dispatch = jest.fn();
			const store = { getState: () => state, dispatch };

			await deleteReusableBlocks(
				deleteReusableBlock( 'reusable1' ),
				store
			);

			expect( dispatch ).not.toHaveBeenCalled();
			dataDispatch( 'core/block-editor' ).removeBlocks.mockReset();
			dataSelect( 'core/block-editor' ).getBlocks.mockReset();
		} );
	} );

	describe( 'convertBlockToStatic', () => {
		it( 'should convert a reusable block into a static block', () => {
			const associatedBlock = createBlock( 'core/block', { ref: 123 } );
			const reusableBlock = {
				id: 123,
				title: 'My cool block',
				content: '<!-- wp:test-block {"name":"Big Bird"} /-->',
			};
			const state = reducer(
				undefined,
				receiveReusableBlocksAction( [ reusableBlock ] )
			);
			jest.spyOn(
				dataSelect( 'core/block-editor' ),
				'getBlock'
			).mockImplementation( ( id ) =>
				associatedBlock.clientId === id ? associatedBlock : null
			);
			jest.spyOn(
				dataDispatch( 'core/block-editor' ),
				'replaceBlocks'
			).mockImplementation( () => {} );

			const dispatch = jest.fn();
			const store = { getState: () => state, dispatch };

			convertBlockToStatic(
				convertBlockToStaticAction( associatedBlock.clientId ),
				store
			);

			expect(
				dataDispatch( 'core/block-editor' ).replaceBlocks
			).toHaveBeenCalledWith( associatedBlock.clientId, [
				expect.objectContaining( {
					name: 'core/test-block',
					attributes: { name: 'Big Bird' },
				} ),
			] );

			dataDispatch( 'core/block-editor' ).replaceBlocks.mockReset();
			dataSelect( 'core/block-editor' ).getBlock.mockReset();
		} );

		it( 'should convert a reusable block with nested blocks into a static block', () => {
			const associatedBlock = createBlock( 'core/block', { ref: 123 } );
			const reusableBlock = {
				id: 123,
				title: 'My cool block',
				content:
					'<!-- wp:test-block {"name":"Big Bird"} --><!-- wp:test-block {"name":"Oscar the Grouch"} /--><!-- wp:test-block {"name":"Cookie Monster"} /--><!-- /wp:test-block -->',
			};
			const state = reducer(
				undefined,
				receiveReusableBlocksAction( [ reusableBlock ] )
			);
			jest.spyOn(
				dataSelect( 'core/block-editor' ),
				'getBlock'
			).mockImplementation( ( id ) =>
				associatedBlock.clientId === id ? associatedBlock : null
			);
			jest.spyOn(
				dataDispatch( 'core/block-editor' ),
				'replaceBlocks'
			).mockImplementation( () => {} );

			const dispatch = jest.fn();
			const store = { getState: () => state, dispatch };

			convertBlockToStatic(
				convertBlockToStaticAction( associatedBlock.clientId ),
				store
			);

			expect(
				dataDispatch( 'core/block-editor' ).replaceBlocks
			).toHaveBeenCalledWith( associatedBlock.clientId, [
				expect.objectContaining( {
					name: 'core/test-block',
					attributes: { name: 'Big Bird' },
					innerBlocks: [
						expect.objectContaining( {
							attributes: { name: 'Oscar the Grouch' },
						} ),
						expect.objectContaining( {
							attributes: { name: 'Cookie Monster' },
						} ),
					],
				} ),
			] );

			dataDispatch( 'core/block-editor' ).replaceBlocks.mockReset();
			dataSelect( 'core/block-editor' ).getBlock.mockReset();
		} );
	} );

	describe( 'convertBlockToReusable', () => {
		it( 'should convert a static block into a reusable block', () => {
			const staticBlock = createBlock( 'core/test-block' );
			jest.spyOn(
				dataSelect( 'core/block-editor' ),
				'getBlocksByClientId'
			).mockImplementation( () => [ staticBlock ] );
			jest.spyOn(
				dataDispatch( 'core/block-editor' ),
				'replaceBlocks'
			).mockImplementation( () => {} );
			jest.spyOn(
				dataDispatch( 'core/block-editor' ),
				'receiveBlocks'
			).mockImplementation( () => {} );

			const dispatch = jest.fn();
			const store = { getState: () => {}, dispatch };

			convertBlockToReusable(
				convertBlockToReusableAction( staticBlock.clientId ),
				store
			);

			expect( dispatch ).toHaveBeenCalledWith(
				receiveReusableBlocksAction( [
					{
						id: expect.stringMatching( /^reusable/ ),
						title: 'Untitled Reusable Block',
						content: '<!-- wp:test-block /-->',
					},
				] )
			);

			expect( dispatch ).toHaveBeenCalledWith(
				saveReusableBlock( expect.stringMatching( /^reusable/ ) )
			);

			expect(
				dataDispatch( 'core/block-editor' ).replaceBlocks
			).toHaveBeenCalledWith(
				[ staticBlock.clientId ],
				expect.objectContaining( {
					name: 'core/block',
					attributes: { ref: expect.stringMatching( /^reusable/ ) },
				} )
			);

			dataDispatch( 'core/block-editor' ).replaceBlocks.mockReset();
			dataDispatch( 'core/block-editor' ).receiveBlocks.mockReset();
			dataSelect( 'core/block-editor' ).getBlock.mockReset();
		} );
	} );
} );
