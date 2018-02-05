/**
 * External dependencies
 */
import { noop, reduce, set } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	getBlockTypes,
	unregisterBlockType,
	registerBlockType,
	createBlock,
	createReusableBlock,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
	resetPost,
	setupNewPost,
	resetBlocks,
	mergeBlocks,
	replaceBlocks,
	editPost,
	savePost,
	requestMetaBoxUpdates,
	updateReusableBlock,
	saveReusableBlock,
	deleteReusableBlock,
	fetchReusableBlocks,
	convertBlockToStatic,
	convertBlockToReusable,
	selectBlock,
} from '../../store/actions';
import reducer from '../reducer';
import effects from '../effects';
import * as selectors from '../../store/selectors';

// Make all generated UUIDs the same for testing
jest.mock( 'uuid/v4', () => {
	return jest.fn( () => 'this-is-a-mock-uuid' );
} );

describe( 'effects', () => {
	const defaultBlockSettings = { save: () => 'Saved', category: 'common', title: 'block title' };

	describe( '.MERGE_BLOCKS', () => {
		const handler = effects.MERGE_BLOCKS;

		afterEach( () => {
			getBlockTypes().forEach( ( block ) => {
				unregisterBlockType( block.name );
			} );
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
			const dispatch = jest.fn();
			handler( mergeBlocks( blockA, blockB ), { dispatch } );

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
			const dispatch = jest.fn();
			handler( mergeBlocks( blockA, blockB ), { dispatch } );

			expect( dispatch ).toHaveBeenCalledTimes( 2 );
			expect( dispatch ).toHaveBeenCalledWith( selectBlock( 'chicken', -1 ) );
			expect( dispatch ).toHaveBeenCalledWith( replaceBlocks( [ 'chicken', 'ribs' ], [ {
				uid: 'chicken',
				name: 'core/test-block',
				attributes: { content: 'chicken ribs' },
			} ] ) );
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
			const dispatch = jest.fn();
			handler( mergeBlocks( blockA, blockB ), { dispatch } );

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
			const dispatch = jest.fn();
			handler( mergeBlocks( blockA, blockB ), { dispatch } );

			expect( dispatch ).toHaveBeenCalledTimes( 2 );
			// expect( dispatch ).toHaveBeenCalledWith( focusBlock( 'chicken', { offset: -1 } ) );
			expect( dispatch ).toHaveBeenCalledWith( replaceBlocks( [ 'chicken', 'ribs' ], [ {
				uid: 'chicken',
				name: 'core/test-block',
				attributes: { content: 'chicken ribs' },
			} ] ) );
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

			expect( dispatch ).toHaveBeenCalledTimes( 2 );
			expect( dispatch ).toHaveBeenCalledWith( editPost( { status: 'draft' } ) );
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

		it( 'should set auto-draft to draft before save', () => {
			selectors.isEditedPostSaveable.mockReturnValue( true );
			selectors.isEditedPostDirty.mockReturnValue( true );
			selectors.isCurrentPostPublished.mockReturnValue( false );
			selectors.isEditedPostNew.mockReturnValue( true );

			handler( {}, store );

			expect( dispatch ).toHaveBeenCalledTimes( 2 );
			expect( dispatch ).toHaveBeenCalledWith( editPost( { status: 'draft' } ) );
			expect( dispatch ).toHaveBeenCalledWith( savePost() );
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

		it( 'should dispatch meta box updates on success for dirty meta boxes', () => {
			const dispatch = jest.fn();
			const store = { getState: () => {}, dispatch };

			const post = getDraftPost();

			handler( { post: post, previousPost: post }, store );

			expect( dispatch ).toHaveBeenCalledTimes( 1 );
			expect( dispatch ).toHaveBeenCalledWith( requestMetaBoxUpdates() );
		} );

		it( 'should dispatch notices when publishing or scheduling a post', () => {
			const dispatch = jest.fn();
			const store = { getState: () => {}, dispatch };

			const previousPost = getDraftPost();
			const post = getPublishedPost();

			handler( { post, previousPost }, store );

			expect( dispatch ).toHaveBeenCalledTimes( 2 );
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
			const store = { getState: () => {}, dispatch };

			const previousPost = getPublishedPost();
			const post = getDraftPost();

			handler( { post, previousPost }, store );

			expect( dispatch ).toHaveBeenCalledTimes( 2 );
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
			const store = { getState: () => {}, dispatch };

			const previousPost = getPublishedPost();
			const post = getPublishedPost();

			handler( { post, previousPost }, store );

			expect( dispatch ).toHaveBeenCalledTimes( 2 );
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
				resetPost( post ),
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

			expect( result ).toHaveLength( 2 );
			expect( result ).toContainEqual( resetPost( post ) );
			expect( result.some( ( { blocks } ) => {
				return blocks && blocks[ 0 ].name === 'core/test-block';
			} ) ).toBe( true );
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
				setupNewPost( { title: 'A History of Pork' } ),
				resetPost( post ),
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
						id: 'a9691cf9-ecaa-42bd-a9ca-49587e817647',
						title: 'My cool block',
						content: '<!-- wp:core/test-block {"name":"Big Bird"} /-->',
					},
				] );

				set( global, 'wp.api.collections.Blocks', class {
					fetch() {
						return promise;
					}
				} );

				const dispatch = jest.fn();
				const store = { getState: () => {}, dispatch };

				handler( fetchReusableBlocks(), store );

				return promise.then( () => {
					expect( dispatch ).toHaveBeenCalledWith( {
						type: 'FETCH_REUSABLE_BLOCKS_SUCCESS',
						reusableBlocks: [
							{
								id: 'a9691cf9-ecaa-42bd-a9ca-49587e817647',
								title: 'My cool block',
								type: 'core/test-block',
								attributes: {
									name: 'Big Bird',
								},
							},
						],
					} );
				} );
			} );

			it( 'should fetch a single reusable block', () => {
				const id = 123;

				let modelAttributes;
				const promise = Promise.resolve( {
					id,
					title: 'My cool block',
					content: '<!-- wp:core/test-block {"name":"Big Bird"} /-->',
				} );

				set( global, 'wp.api.models.Blocks', class {
					constructor( attributes ) {
						modelAttributes = attributes;
					}

					fetch() {
						return promise;
					}
				} );

				const dispatch = jest.fn();
				const store = { getState: () => {}, dispatch };

				handler( fetchReusableBlocks( id ), store );

				expect( modelAttributes ).toEqual( { id } );
				return promise.then( () => {
					expect( dispatch ).toHaveBeenCalledWith( {
						type: 'FETCH_REUSABLE_BLOCKS_SUCCESS',
						id,
						reusableBlocks: [
							{
								id,
								title: 'My cool block',
								type: 'core/test-block',
								attributes: {
									name: 'Big Bird',
								},
							},
						],
					} );
				} );
			} );

			it( 'should handle an API error', () => {
				const promise = Promise.reject( {} );

				set( global, 'wp.api.collections.Blocks', class {
					fetch() {
						return promise;
					}
				} );

				const dispatch = jest.fn();
				const store = { getState: () => {}, dispatch };

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

		describe( '.SAVE_REUSABLE_BLOCK', () => {
			const handler = effects.SAVE_REUSABLE_BLOCK;

			it( 'should save a reusable block and swaps its id', () => {
				let modelAttributes;
				const promise = Promise.resolve( { id: 3 } );

				set( global, 'wp.api.models.Blocks', class {
					constructor( attributes ) {
						modelAttributes = attributes;
					}

					save() {
						return promise;
					}
				} );

				const reusableBlock = createReusableBlock( 'core/test-block', {
					name: 'Big Bird',
				} );

				const initialState = reducer( undefined, {} );
				const action = updateReusableBlock( reusableBlock.id, reusableBlock );
				const state = reducer( initialState, action );

				const dispatch = jest.fn();
				const store = { getState: () => state, dispatch };

				handler( saveReusableBlock( reusableBlock.id ), store );

				expect( modelAttributes ).toEqual( {
					title: 'Untitled block',
					content: '<!-- wp:test-block {\"name\":\"Big Bird\"} /-->',
				} );
				return promise.then( () => {
					expect( dispatch ).toHaveBeenCalledWith( {
						type: 'SAVE_REUSABLE_BLOCK_SUCCESS',
						id: reusableBlock.id,
						updatedId: 3,
					} );
				} );
			} );

			it( 'should handle an API error', () => {
				const promise = Promise.reject( {} );

				set( global, 'wp.api.models.Blocks', class {
					save() {
						return promise;
					}
				} );

				const reusableBlock = createReusableBlock( 'core/test-block', {
					name: 'Big Bird',
				} );

				const initialState = reducer( undefined, {} );
				const action = updateReusableBlock( reusableBlock.id, reusableBlock );
				const state = reducer( initialState, action );

				const dispatch = jest.fn();
				const store = { getState: () => state, dispatch };

				handler( saveReusableBlock( reusableBlock.id ), store );

				return promise.catch( () => {
					expect( dispatch ).toHaveBeenCalledWith( {
						type: 'SAVE_REUSABLE_BLOCK_FAILURE',
						id: reusableBlock.id,
					} );
				} );
			} );
		} );

		describe( '.DELETE_REUSABLE_BLOCK', () => {
			const handler = effects.DELETE_REUSABLE_BLOCK;

			it( 'should delete a reusable block', () => {
				let modelAttributes;
				const promise = Promise.resolve( {} );

				set( global, 'wp.api.models.Blocks', class {
					constructor( attributes ) {
						modelAttributes = attributes;
					}

					destroy() {
						return promise;
					}
				} );

				const id = 123;

				const associatedBlock = createBlock( 'core/block', {
					ref: id,
				} );

				const actions = [
					resetBlocks( [ associatedBlock ] ),
					updateReusableBlock( id, {} ),
				];
				const state = actions.reduce( reducer, undefined );

				const dispatch = jest.fn();
				const store = { getState: () => state, dispatch };

				handler( deleteReusableBlock( id ), store );

				expect( dispatch ).toHaveBeenCalledWith( {
					type: 'REMOVE_REUSABLE_BLOCK',
					id,
					associatedBlockUids: [ associatedBlock.uid ],
					optimist: expect.any( Object ),
				} );
				expect( modelAttributes ).toEqual( { id } );
				return promise.then( () => {
					expect( dispatch ).toHaveBeenCalledWith( {
						type: 'DELETE_REUSABLE_BLOCK_SUCCESS',
						id,
						optimist: expect.any( Object ),
					} );
				} );
			} );

			it( 'should handle an API error', () => {
				const promise = Promise.reject( {} );

				set( global, 'wp.api.models.Blocks', class {
					destroy() {
						return promise;
					}
				} );

				const state = reducer( undefined, updateReusableBlock( 123, {} ) );

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
				const reusableBlock = {
					id: -123,
					isTemporary: true,
				};

				const state = reducer( undefined, updateReusableBlock( -123, reusableBlock ) );

				const dispatch = jest.fn();
				const store = { getState: () => state, dispatch };

				handler( deleteReusableBlock( -123 ), store );

				expect( dispatch ).not.toHaveBeenCalled();
			} );
		} );

		describe( '.CONVERT_BLOCK_TO_STATIC', () => {
			const handler = effects.CONVERT_BLOCK_TO_STATIC;

			it( 'should convert a reusable block into a static block', () => {
				const reusableBlock = createReusableBlock( 'core/test-block', {
					name: 'Big Bird',
				} );
				const staticBlock = createBlock( 'core/block', {
					ref: reusableBlock.id,
				} );

				const actions = [
					resetBlocks( [ staticBlock ] ),
					updateReusableBlock( reusableBlock.id, reusableBlock ),
				];
				const initialState = reducer( undefined, {} );
				const state = reduce( actions, reducer, initialState );

				const dispatch = jest.fn();
				const store = { getState: () => state, dispatch };

				handler( convertBlockToStatic( staticBlock.uid ), store );

				expect( dispatch ).toHaveBeenCalledWith(
					replaceBlocks(
						[ staticBlock.uid ],
						createBlock( reusableBlock.type, reusableBlock.attributes )
					)
				);
			} );
		} );

		describe( '.CONVERT_BLOCK_TO_REUSABLE', () => {
			const handler = effects.CONVERT_BLOCK_TO_REUSABLE;

			it( 'should convert a static block into a reusable block', () => {
				const staticBlock = createBlock( 'core/test-block', {
					name: 'Big Bird',
				} );

				const initialState = reducer( undefined, {} );
				const state = reducer( initialState, resetBlocks( [ staticBlock ] ) );

				const dispatch = jest.fn();
				const store = { getState: () => state, dispatch };

				handler( convertBlockToReusable( staticBlock.uid ), store );

				expect( dispatch ).toHaveBeenCalledWith(
					updateReusableBlock( expect.any( Number ), {
						id: expect.any( Number ),
						isTemporary: true,
						title: 'Untitled block',
						type: staticBlock.name,
						attributes: staticBlock.attributes,
					} )
				);
				expect( dispatch ).toHaveBeenCalledWith(
					saveReusableBlock( expect.any( Number ) )
				);
				expect( dispatch ).toHaveBeenCalledWith(
					replaceBlocks(
						[ staticBlock.uid ],
						[ createBlock( 'core/block', { ref: expect.any( Number ) } ) ]
					)
				);
			} );
		} );
	} );
} );
