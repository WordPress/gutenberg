/**
 * External dependencies
 */
import { noop, set, reduce } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	getBlockTypes,
	unregisterBlockType,
	registerBlockType,
	createBlock,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
	setupEditorState,
	mergeBlocks,
	replaceBlocks,
	savePost,
	selectBlock,
	removeBlock,
	createErrorNotice,
	fetchReusableBlocks,
	receiveReusableBlocks,
	receiveBlocks,
	saveReusableBlock,
	deleteReusableBlock,
	removeBlocks,
	resetBlocks,
	convertBlockToStatic,
	convertBlockToReusable,
	setTemplateValidity,
} from '../actions';
import effects, {
	removeProvisionalBlock,
} from '../effects';
import * as selectors from '../selectors';
import reducer from '../reducer';

describe( 'effects', () => {
	const defaultBlockSettings = { save: () => 'Saved', category: 'common', title: 'block title' };

	describe( 'removeProvisionalBlock()', () => {
		const store = { getState: () => {} };

		beforeAll( () => {
			selectors.getProvisionalBlockUID = jest.spyOn( selectors, 'getProvisionalBlockUID' );
			selectors.isBlockSelected = jest.spyOn( selectors, 'isBlockSelected' );
		} );

		beforeEach( () => {
			selectors.getProvisionalBlockUID.mockReset();
			selectors.isBlockSelected.mockReset();
		} );

		afterAll( () => {
			selectors.getProvisionalBlockUID.mockRestore();
			selectors.isBlockSelected.mockRestore();
		} );

		it( 'should return nothing if there is no provisional block', () => {
			const action = removeProvisionalBlock( {}, store );

			expect( action ).toBeUndefined();
		} );

		it( 'should return nothing if there is a provisional block and it is selected', () => {
			selectors.getProvisionalBlockUID.mockReturnValue( 'chicken' );
			selectors.isBlockSelected.mockImplementation( ( state, uid ) => uid === 'chicken' );
			const action = removeProvisionalBlock( {}, store );

			expect( action ).toBeUndefined();
		} );

		it( 'should return remove action for provisional block', () => {
			selectors.getProvisionalBlockUID.mockReturnValue( 'chicken' );
			selectors.isBlockSelected.mockImplementation( ( state, uid ) => uid === 'ribs' );
			const action = removeProvisionalBlock( {}, store );

			expect( action ).toEqual( removeBlock( 'chicken', true ) );
		} );
	} );

	describe( '.MERGE_BLOCKS', () => {
		const handler = effects.MERGE_BLOCKS;
		const defaultGetBlock = selectors.getBlock;

		afterEach( () => {
			getBlockTypes().forEach( ( block ) => {
				unregisterBlockType( block.name );
			} );
			selectors.getBlock = defaultGetBlock;
		} );

		it( 'should only focus the blockA if the blockA has no merge function', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );
			const blockA = {
				uid: 'chicken',
				name: 'core/test-block',
			};
			const blockB = {
				uid: 'ribs',
				name: 'core/test-block',
			};
			selectors.getBlock = ( state, uid ) => {
				return blockA.uid === uid ? blockA : blockB;
			};

			const dispatch = jest.fn();
			const getState = () => ( {} );
			handler( mergeBlocks( blockA.uid, blockB.uid ), { dispatch, getState } );

			expect( dispatch ).toHaveBeenCalledTimes( 1 );
			expect( dispatch ).toHaveBeenCalledWith( selectBlock( 'chicken' ) );
		} );

		it( 'should merge the blocks if blocks of the same type', () => {
			registerBlockType( 'core/test-block', {
				merge( attributes, attributesToMerge ) {
					return {
						content: attributes.content + ' ' + attributesToMerge.content,
					};
				},
				save: noop,
				category: 'common',
				title: 'test block',
			} );
			const blockA = {
				uid: 'chicken',
				name: 'core/test-block',
				attributes: { content: 'chicken' },
			};
			const blockB = {
				uid: 'ribs',
				name: 'core/test-block',
				attributes: { content: 'ribs' },
			};
			selectors.getBlock = ( state, uid ) => {
				return blockA.uid === uid ? blockA : blockB;
			};
			const dispatch = jest.fn();
			const getState = () => ( {} );
			handler( mergeBlocks( blockA.uid, blockB.uid ), { dispatch, getState } );

			expect( dispatch ).toHaveBeenCalledTimes( 2 );
			expect( dispatch ).toHaveBeenCalledWith( selectBlock( 'chicken', -1 ) );
			expect( dispatch ).toHaveBeenCalledWith( {
				...replaceBlocks( [ 'chicken', 'ribs' ], [ {
					uid: 'chicken',
					name: 'core/test-block',
					attributes: { content: 'chicken ribs' },
				} ] ),
				time: expect.any( Number ),
			} );
		} );

		it( 'should not merge the blocks have different types without transformation', () => {
			registerBlockType( 'core/test-block', {
				merge( attributes, attributesToMerge ) {
					return {
						content: attributes.content + ' ' + attributesToMerge.content,
					};
				},
				save: noop,
				category: 'common',
				title: 'test block',
			} );
			registerBlockType( 'core/test-block-2', defaultBlockSettings );
			const blockA = {
				uid: 'chicken',
				name: 'core/test-block',
				attributes: { content: 'chicken' },
			};
			const blockB = {
				uid: 'ribs',
				name: 'core/test-block2',
				attributes: { content: 'ribs' },
			};
			selectors.getBlock = ( state, uid ) => {
				return blockA.uid === uid ? blockA : blockB;
			};
			const dispatch = jest.fn();
			const getState = () => ( {} );
			handler( mergeBlocks( blockA.uid, blockB.uid ), { dispatch, getState } );

			expect( dispatch ).not.toHaveBeenCalled();
		} );

		it( 'should transform and merge the blocks', () => {
			registerBlockType( 'core/test-block', {
				attributes: {
					content: {
						type: 'string',
					},
				},
				merge( attributes, attributesToMerge ) {
					return {
						content: attributes.content + ' ' + attributesToMerge.content,
					};
				},
				save: noop,
				category: 'common',
				title: 'test block',
			} );
			registerBlockType( 'core/test-block-2', {
				attributes: {
					content: {
						type: 'string',
					},
				},
				transforms: {
					to: [ {
						type: 'block',
						blocks: [ 'core/test-block' ],
						transform: ( { content2 } ) => {
							return createBlock( 'core/test-block', {
								content: content2,
							} );
						},
					} ],
				},
				save: noop,
				category: 'common',
				title: 'test block 2',
			} );
			const blockA = {
				uid: 'chicken',
				name: 'core/test-block',
				attributes: { content: 'chicken' },
			};
			const blockB = {
				uid: 'ribs',
				name: 'core/test-block-2',
				attributes: { content2: 'ribs' },
			};
			selectors.getBlock = ( state, uid ) => {
				return blockA.uid === uid ? blockA : blockB;
			};
			const dispatch = jest.fn();
			const getState = () => ( {} );
			handler( mergeBlocks( blockA.uid, blockB.uid ), { dispatch, getState } );

			expect( dispatch ).toHaveBeenCalledTimes( 2 );
			// expect( dispatch ).toHaveBeenCalledWith( focusBlock( 'chicken', { offset: -1 } ) );
			expect( dispatch ).toHaveBeenCalledWith( {
				...replaceBlocks( [ 'chicken', 'ribs' ], [ {
					uid: 'chicken',
					name: 'core/test-block',
					attributes: { content: 'chicken ribs' },
				} ] ),
				time: expect.any( Number ),
			} );
		} );
	} );

	describe( '.AUTOSAVE', () => {
		const handler = effects.AUTOSAVE;
		const dispatch = jest.fn();
		const store = { getState: () => {}, dispatch };

		beforeAll( () => {
			selectors.isEditedPostSaveable = jest.spyOn( selectors, 'isEditedPostSaveable' );
			selectors.isEditedPostDirty = jest.spyOn( selectors, 'isEditedPostDirty' );
			selectors.isCurrentPostPublished = jest.spyOn( selectors, 'isCurrentPostPublished' );
			selectors.isEditedPostNew = jest.spyOn( selectors, 'isEditedPostNew' );
		} );

		beforeEach( () => {
			dispatch.mockReset();
			selectors.isEditedPostSaveable.mockReset();
			selectors.isEditedPostDirty.mockReset();
			selectors.isCurrentPostPublished.mockReset();
			selectors.isEditedPostNew.mockReset();
		} );

		afterAll( () => {
			selectors.isEditedPostSaveable.mockRestore();
			selectors.isEditedPostDirty.mockRestore();
			selectors.isCurrentPostPublished.mockRestore();
			selectors.isEditedPostNew.mockRestore();
		} );

		it( 'should do nothing for unsaveable', () => {
			selectors.isEditedPostSaveable.mockReturnValue( false );
			selectors.isEditedPostDirty.mockReturnValue( true );
			selectors.isCurrentPostPublished.mockReturnValue( false );
			selectors.isEditedPostNew.mockReturnValue( true );

			expect( dispatch ).not.toHaveBeenCalled();
		} );

		it( 'should do nothing for clean', () => {
			selectors.isEditedPostSaveable.mockReturnValue( true );
			selectors.isEditedPostDirty.mockReturnValue( false );
			selectors.isCurrentPostPublished.mockReturnValue( false );
			selectors.isEditedPostNew.mockReturnValue( false );

			expect( dispatch ).not.toHaveBeenCalled();
		} );

		it( 'should return autosave action for clean, new, saveable post', () => {
			selectors.isEditedPostSaveable.mockReturnValue( true );
			selectors.isEditedPostDirty.mockReturnValue( false );
			selectors.isCurrentPostPublished.mockReturnValue( false );
			selectors.isEditedPostNew.mockReturnValue( true );

			handler( {}, store );

			expect( dispatch ).toHaveBeenCalledTimes( 1 );
			expect( dispatch ).toHaveBeenCalledWith( savePost() );
		} );

		it( 'should return autosave action for saveable, dirty, published post', () => {
			selectors.isEditedPostSaveable.mockReturnValue( true );
			selectors.isEditedPostDirty.mockReturnValue( true );
			selectors.isCurrentPostPublished.mockReturnValue( true );
			selectors.isEditedPostNew.mockReturnValue( true );

			// TODO: Publish autosave
			expect( dispatch ).not.toHaveBeenCalled();
		} );

		it( 'should return update action for saveable, dirty draft', () => {
			selectors.isEditedPostSaveable.mockReturnValue( true );
			selectors.isEditedPostDirty.mockReturnValue( true );
			selectors.isCurrentPostPublished.mockReturnValue( false );
			selectors.isEditedPostNew.mockReturnValue( false );

			handler( {}, store );

			expect( dispatch ).toHaveBeenCalledTimes( 1 );
			expect( dispatch ).toHaveBeenCalledWith( savePost() );
		} );
	} );

	describe( '.REQUEST_POST_UPDATE_SUCCESS', () => {
		const handler = effects.REQUEST_POST_UPDATE_SUCCESS;
		let replaceStateSpy;

		const defaultPost = {
			id: 1,
			title: {
				raw: 'A History of Pork',
			},
			content: {
				raw: '',
			},
		};
		const getDraftPost = () => ( {
			...defaultPost,
			status: 'draft',
		} );
		const getPublishedPost = () => ( {
			...defaultPost,
			status: 'publish',
		} );

		beforeAll( () => {
			replaceStateSpy = jest.spyOn( window.history, 'replaceState' );
		} );

		beforeEach( () => {
			replaceStateSpy.mockReset();
		} );

		afterAll( () => {
			replaceStateSpy.mockRestore();
		} );

		it( 'should dispatch notices when publishing or scheduling a post', () => {
			const dispatch = jest.fn();
			const store = { dispatch };

			const previousPost = getDraftPost();
			const post = getPublishedPost();

			handler( { post, previousPost }, store );

			expect( dispatch ).toHaveBeenCalledTimes( 1 );
			expect( dispatch ).toHaveBeenCalledWith( expect.objectContaining( {
				notice: {
					content: <p><span>Post published!</span> <a>View post</a></p>, // eslint-disable-line jsx-a11y/anchor-is-valid
					id: 'SAVE_POST_NOTICE_ID',
					isDismissible: true,
					status: 'success',
					spokenMessage: 'Post published!',
				},
				type: 'CREATE_NOTICE',
			} ) );
		} );

		it( 'should dispatch notices when reverting a published post to a draft', () => {
			const dispatch = jest.fn();
			const store = { dispatch };

			const previousPost = getPublishedPost();
			const post = getDraftPost();

			handler( { post, previousPost }, store );

			expect( dispatch ).toHaveBeenCalledTimes( 1 );
			expect( dispatch ).toHaveBeenCalledWith( expect.objectContaining( {
				notice: {
					content: <p>
						<span>Post reverted to draft.</span>
						{ ' ' }
						{ false }
					</p>,
					id: 'SAVE_POST_NOTICE_ID',
					isDismissible: true,
					status: 'success',
					spokenMessage: 'Post reverted to draft.',
				},
				type: 'CREATE_NOTICE',
			} ) );
		} );

		it( 'should dispatch notices when just updating a published post again', () => {
			const dispatch = jest.fn();
			const store = { dispatch };

			const previousPost = getPublishedPost();
			const post = getPublishedPost();

			handler( { post, previousPost }, store );

			expect( dispatch ).toHaveBeenCalledTimes( 1 );
			expect( dispatch ).toHaveBeenCalledWith( expect.objectContaining( {
				notice: {
					content: <p><span>Post updated!</span>{ ' ' }<a>{ 'View post' }</a></p>, // eslint-disable-line jsx-a11y/anchor-is-valid
					id: 'SAVE_POST_NOTICE_ID',
					isDismissible: true,
					status: 'success',
					spokenMessage: 'Post updated!',
				},
				type: 'CREATE_NOTICE',
			} ) );
		} );
	} );

	describe( '.REQUEST_POST_UPDATE_FAILURE', () => {
		it( 'should dispatch a notice on failure when publishing a draft fails.', () => {
			const handler = effects.REQUEST_POST_UPDATE_FAILURE;
			const dispatch = jest.fn();
			const store = { getState: () => {}, dispatch };

			const action = {
				post: {
					id: 1,
					title: {
						raw: 'A History of Pork',
					},
					content: {
						raw: '',
					},
					status: 'draft',
				},
				edits: {
					status: 'publish',
				},
			};

			handler( action, store );

			expect( dispatch ).toHaveBeenCalledTimes( 1 );
			expect( dispatch ).toHaveBeenCalledWith( createErrorNotice( 'Publishing failed', { id: 'SAVE_POST_NOTICE_ID' } ) );
		} );

		it( 'should dispatch a notice on failure when trying to update a draft.', () => {
			const handler = effects.REQUEST_POST_UPDATE_FAILURE;
			const dispatch = jest.fn();
			const store = { getState: () => {}, dispatch };

			const action = {
				post: {
					id: 1,
					title: {
						raw: 'A History of Pork',
					},
					content: {
						raw: '',
					},
					status: 'draft',
				},
				edits: {
					status: 'draft',
				},
			};

			handler( action, store );

			expect( dispatch ).toHaveBeenCalledTimes( 1 );
			expect( dispatch ).toHaveBeenCalledWith( createErrorNotice( 'Updating failed', { id: 'SAVE_POST_NOTICE_ID' } ) );
		} );
	} );

	describe( '.SETUP_EDITOR', () => {
		const handler = effects.SETUP_EDITOR;

		afterEach( () => {
			getBlockTypes().forEach( ( block ) => {
				unregisterBlockType( block.name );
			} );
		} );

		it( 'should return post reset action', () => {
			const post = {
				id: 1,
				title: {
					raw: 'A History of Pork',
				},
				content: {
					raw: '',
				},
				status: 'draft',
			};

			const result = handler( { post, settings: {} } );

			expect( result ).toEqual( [
				setTemplateValidity( true ),
				setupEditorState( post, [], {} ),
			] );
		} );

		it( 'should return block reset with non-empty content', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );
			const post = {
				id: 1,
				title: {
					raw: 'A History of Pork',
				},
				content: {
					raw: '<!-- wp:core/test-block -->Saved<!-- /wp:core/test-block -->',
				},
				status: 'draft',
			};

			const result = handler( { post, settings: {} } );

			expect( result[ 1 ].blocks ).toHaveLength( 1 );
			expect( result ).toEqual( [
				setTemplateValidity( true ),
				setupEditorState( post, result[ 1 ].blocks, {} ),
			] );
		} );

		it( 'should return post setup action only if auto-draft', () => {
			const post = {
				id: 1,
				title: {
					raw: 'A History of Pork',
				},
				content: {
					raw: '',
				},
				status: 'auto-draft',
			};

			const result = handler( { post, settings: {} } );

			expect( result ).toEqual( [
				setTemplateValidity( true ),
				setupEditorState( post, [], { title: 'A History of Pork', status: 'draft' } ),
			] );
		} );
	} );

	describe( 'reusable block effects', () => {
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

		describe( '.FETCH_REUSABLE_BLOCKS', () => {
			const handler = effects.FETCH_REUSABLE_BLOCKS;

			it( 'should fetch multiple reusable blocks', () => {
				const promise = Promise.resolve( [
					{
						id: 123,
						title: 'My cool block',
						content: '<!-- wp:test-block {"name":"Big Bird"} /-->',
					},
				] );

				set( global, 'wp.api.getPostTypeRoute', () => 'blocks' );
				set( global, 'wp.apiRequest', () => promise );

				const dispatch = jest.fn();
				const store = { getState: noop, dispatch };

				handler( fetchReusableBlocks(), store );

				return promise.then( () => {
					expect( dispatch ).toHaveBeenCalledWith(
						receiveReusableBlocks( [
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
			} );

			it( 'should fetch a single reusable block', () => {
				const promise = Promise.resolve( {
					id: 123,
					title: 'My cool block',
					content: '<!-- wp:test-block {"name":"Big Bird"} /-->',
				} );

				set( global, 'wp.api.getPostTypeRoute', () => 'blocks' );
				set( global, 'wp.apiRequest', () => promise );

				const dispatch = jest.fn();
				const store = { getState: noop, dispatch };

				handler( fetchReusableBlocks( 123 ), store );

				return promise.then( () => {
					expect( dispatch ).toHaveBeenCalledWith(
						receiveReusableBlocks( [
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
			} );

			it( 'should handle an API error', () => {
				const promise = Promise.reject( {} );

				set( global, 'wp.api.getPostTypeRoute', () => 'blocks' );
				set( global, 'wp.apiRequest', () => promise );

				const dispatch = jest.fn();
				const store = { getState: noop, dispatch };

				handler( fetchReusableBlocks(), store );

				return promise.catch( () => {
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

		describe( '.RECEIVE_REUSABLE_BLOCKS', () => {
			const handler = effects.RECEIVE_REUSABLE_BLOCKS;

			it( 'should receive parsed blocks', () => {
				const action = receiveReusableBlocks( [
					{
						parsedBlock: { uid: 'broccoli' },
					},
				] );

				expect( handler( action ) ).toEqual( receiveBlocks( [
					{ uid: 'broccoli' },
				] ) );
			} );
		} );

		describe( '.SAVE_REUSABLE_BLOCK', () => {
			const handler = effects.SAVE_REUSABLE_BLOCK;

			it( 'should save a reusable block and swap its id', () => {
				let modelAttributes;
				const promise = Promise.resolve( { id: 456 } );

				set( global, 'wp.api.getPostTypeRoute', () => 'blocks' );
				set( global, 'wp.apiRequest', ( request ) => {
					modelAttributes = request.data;
					return promise;
				} );

				const reusableBlock = { id: 123, title: 'My cool block' };
				const parsedBlock = createBlock( 'core/test-block', { name: 'Big Bird' } );

				const state = reduce( [
					receiveReusableBlocks( [ { reusableBlock, parsedBlock } ] ),
					receiveBlocks( [ parsedBlock ] ),
				], reducer, undefined );

				const dispatch = jest.fn();
				const store = { getState: () => state, dispatch };

				handler( saveReusableBlock( 123 ), store );

				expect( modelAttributes ).toEqual( {
					id: 123,
					title: 'My cool block',
					content: '<!-- wp:test-block {\"name\":\"Big Bird\"} /-->',
				} );

				return promise.then( () => {
					expect( dispatch ).toHaveBeenCalledWith( {
						type: 'SAVE_REUSABLE_BLOCK_SUCCESS',
						id: 123,
						updatedId: 456,
					} );
				} );
			} );

			it( 'should handle an API error', () => {
				const promise = Promise.reject( {} );

				set( global, 'wp.api.getPostTypeRoute', () => 'blocks' );
				set( global, 'wp.apiRequest', () => promise );

				const reusableBlock = { id: 123, title: 'My cool block' };
				const parsedBlock = createBlock( 'core/test-block', { name: 'Big Bird' } );

				const state = reduce( [
					receiveReusableBlocks( [ { reusableBlock, parsedBlock } ] ),
					receiveBlocks( [ parsedBlock ] ),
				], reducer, undefined );

				const dispatch = jest.fn();
				const store = { getState: () => state, dispatch };

				handler( saveReusableBlock( 123 ), store );

				return promise.catch( () => {
					expect( dispatch ).toHaveBeenCalledWith( {
						type: 'SAVE_REUSABLE_BLOCK_FAILURE',
						id: 123,
					} );
				} );
			} );
		} );

		describe( '.DELETE_REUSABLE_BLOCK', () => {
			const handler = effects.DELETE_REUSABLE_BLOCK;

			it( 'should delete a reusable block', () => {
				const promise = Promise.resolve( {} );

				set( global, 'wp.api.getPostTypeRoute', () => 'blocks' );
				set( global, 'wp.apiRequest', () => promise );

				const associatedBlock = createBlock( 'core/block', { ref: 123 } );
				const reusableBlock = { id: 123, title: 'My cool block' };
				const parsedBlock = createBlock( 'core/test-block', { name: 'Big Bird' } );

				const state = reduce( [
					resetBlocks( [ associatedBlock ] ),
					receiveReusableBlocks( [ { reusableBlock, parsedBlock } ] ),
					receiveBlocks( [ parsedBlock ] ),
				], reducer, undefined );

				const dispatch = jest.fn();
				const store = { getState: () => state, dispatch };

				handler( deleteReusableBlock( 123 ), store );

				expect( dispatch ).toHaveBeenCalledWith( {
					type: 'REMOVE_REUSABLE_BLOCK',
					id: 123,
					optimist: expect.any( Object ),
				} );

				expect( dispatch ).toHaveBeenCalledWith(
					removeBlocks( [ associatedBlock.uid, parsedBlock.uid ] )
				);

				return promise.then( () => {
					expect( dispatch ).toHaveBeenCalledWith( {
						type: 'DELETE_REUSABLE_BLOCK_SUCCESS',
						id: 123,
						optimist: expect.any( Object ),
					} );
				} );
			} );

			it( 'should handle an API error', () => {
				const promise = Promise.reject( {} );

				set( global, 'wp.api.getPostTypeRoute', () => 'blocks' );
				set( global, 'wp.apiRequest', () => promise );

				const reusableBlock = { id: 123, title: 'My cool block' };
				const parsedBlock = createBlock( 'core/test-block', { name: 'Big Bird' } );

				const state = reduce( [
					receiveReusableBlocks( [ { reusableBlock, parsedBlock } ] ),
					receiveBlocks( [ parsedBlock ] ),
				], reducer, undefined );

				const dispatch = jest.fn();
				const store = { getState: () => state, dispatch };

				handler( deleteReusableBlock( 123 ), store );

				return promise.catch( () => {
					expect( dispatch ).toHaveBeenCalledWith( {
						type: 'DELETE_REUSABLE_BLOCK_FAILURE',
						id: 123,
						optimist: expect.any( Object ),
					} );
				} );
			} );

			it( 'should not save reusable blocks with temporary IDs', () => {
				const reusableBlock = { id: 'reusable1', title: 'My cool block' };
				const parsedBlock = createBlock( 'core/test-block', { name: 'Big Bird' } );

				const state = reduce( [
					receiveReusableBlocks( [ { reusableBlock, parsedBlock } ] ),
					receiveBlocks( [ parsedBlock ] ),
				], reducer, undefined );

				const dispatch = jest.fn();
				const store = { getState: () => state, dispatch };

				handler( deleteReusableBlock( 'reusable1' ), store );

				expect( dispatch ).not.toHaveBeenCalled();
			} );
		} );

		describe( '.CONVERT_BLOCK_TO_STATIC', () => {
			const handler = effects.CONVERT_BLOCK_TO_STATIC;

			it( 'should convert a reusable block into a static block', () => {
				const associatedBlock = createBlock( 'core/block', { ref: 123 } );
				const reusableBlock = { id: 123, title: 'My cool block' };
				const parsedBlock = createBlock( 'core/test-block', { name: 'Big Bird' } );

				const state = reduce( [
					resetBlocks( [ associatedBlock ] ),
					receiveReusableBlocks( [ { reusableBlock, parsedBlock } ] ),
					receiveBlocks( [ parsedBlock ] ),
				], reducer, undefined );

				const dispatch = jest.fn();
				const store = { getState: () => state, dispatch };

				handler( convertBlockToStatic( associatedBlock.uid ), store );

				expect( dispatch ).toHaveBeenCalledWith( {
					type: 'REPLACE_BLOCKS',
					uids: [ associatedBlock.uid ],
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

		describe( '.CONVERT_BLOCK_TO_REUSABLE', () => {
			const handler = effects.CONVERT_BLOCK_TO_REUSABLE;

			it( 'should convert a static block into a reusable block', () => {
				const staticBlock = createBlock( 'core/block', { ref: 123 } );
				const state = reducer( undefined, resetBlocks( [ staticBlock ] ) );

				const dispatch = jest.fn();
				const store = { getState: () => state, dispatch };

				handler( convertBlockToReusable( staticBlock.uid ), store );

				expect( dispatch ).toHaveBeenCalledWith(
					receiveReusableBlocks( [ {
						reusableBlock: {
							id: expect.stringMatching( /^reusable/ ),
							uid: staticBlock.uid,
							title: 'Untitled block',
						},
						parsedBlock: staticBlock,
					} ] )
				);

				expect( dispatch ).toHaveBeenCalledWith(
					saveReusableBlock( expect.stringMatching( /^reusable/ ) ),
				);

				expect( dispatch ).toHaveBeenCalledWith( {
					type: 'REPLACE_BLOCKS',
					uids: [ staticBlock.uid ],
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
} );
