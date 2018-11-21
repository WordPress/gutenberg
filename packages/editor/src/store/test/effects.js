/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	getBlockTypes,
	unregisterBlockType,
	registerBlockType,
	createBlock,
} from '@wordpress/blocks';
import { dispatch as dataDispatch, createRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import actions, {
	updateEditorSettings,
	setupEditorState,
	mergeBlocks,
	replaceBlocks,
	resetBlocks,
	selectBlock,
	setTemplateValidity,
} from '../actions';
import effects, { validateBlocksToTemplate } from '../effects';
import { SAVE_POST_NOTICE_ID } from '../effects/posts';
import * as selectors from '../selectors';
import reducer from '../reducer';
import applyMiddlewares from '../middlewares';
import '../../';

describe( 'effects', () => {
	beforeAll( () => {
		jest.spyOn( dataDispatch( 'core/notices' ), 'createErrorNotice' );
		jest.spyOn( dataDispatch( 'core/notices' ), 'createSuccessNotice' );
	} );

	beforeEach( () => {
		dataDispatch( 'core/notices' ).createErrorNotice.mockReset();
		dataDispatch( 'core/notices' ).createSuccessNotice.mockReset();
	} );

	const defaultBlockSettings = { save: () => 'Saved', category: 'common', title: 'block title' };

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
				clientId: 'chicken',
				name: 'core/test-block',
			};
			const blockB = {
				clientId: 'ribs',
				name: 'core/test-block',
			};
			selectors.getBlock = ( state, clientId ) => {
				return blockA.clientId === clientId ? blockA : blockB;
			};

			const dispatch = jest.fn();
			const getState = () => ( {} );
			handler( mergeBlocks( blockA.clientId, blockB.clientId ), { dispatch, getState } );

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
				clientId: 'chicken',
				name: 'core/test-block',
				attributes: { content: 'chicken' },
			};
			const blockB = {
				clientId: 'ribs',
				name: 'core/test-block',
				attributes: { content: 'ribs' },
			};
			selectors.getBlock = ( state, clientId ) => {
				return blockA.clientId === clientId ? blockA : blockB;
			};
			const dispatch = jest.fn();
			const getState = () => ( {} );
			handler( mergeBlocks( blockA.clientId, blockB.clientId ), { dispatch, getState } );

			expect( dispatch ).toHaveBeenCalledTimes( 2 );
			expect( dispatch ).toHaveBeenCalledWith( selectBlock( 'chicken', -1 ) );
			expect( dispatch ).toHaveBeenCalledWith( {
				...replaceBlocks( [ 'chicken', 'ribs' ], [ {
					clientId: 'chicken',
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
				clientId: 'chicken',
				name: 'core/test-block',
				attributes: { content: 'chicken' },
			};
			const blockB = {
				clientId: 'ribs',
				name: 'core/test-block2',
				attributes: { content: 'ribs' },
			};
			selectors.getBlock = ( state, clientId ) => {
				return blockA.clientId === clientId ? blockA : blockB;
			};
			const dispatch = jest.fn();
			const getState = () => ( {} );
			handler( mergeBlocks( blockA.clientId, blockB.clientId ), { dispatch, getState } );

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
				clientId: 'chicken',
				name: 'core/test-block',
				attributes: { content: 'chicken' },
			};
			const blockB = {
				clientId: 'ribs',
				name: 'core/test-block-2',
				attributes: { content2: 'ribs' },
			};
			selectors.getBlock = ( state, clientId ) => {
				return blockA.clientId === clientId ? blockA : blockB;
			};
			const dispatch = jest.fn();
			const getState = () => ( {} );
			handler( mergeBlocks( blockA.clientId, blockB.clientId ), { dispatch, getState } );

			expect( dispatch ).toHaveBeenCalledTimes( 2 );
			// expect( dispatch ).toHaveBeenCalledWith( focusBlock( 'chicken', { offset: -1 } ) );
			expect( dispatch ).toHaveBeenCalledWith( {
				...replaceBlocks( [ 'chicken', 'ribs' ], [ {
					clientId: 'chicken',
					name: 'core/test-block',
					attributes: { content: 'chicken ribs' },
				} ] ),
				time: expect.any( Number ),
			} );
		} );
	} );

	describe( '.REQUEST_POST_UPDATE_SUCCESS', () => {
		const handler = effects.REQUEST_POST_UPDATE_SUCCESS;

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
		const getPostType = () => ( {
			labels: {
				view_item: 'View post',
				item_published: 'Post published.',
				item_reverted_to_draft: 'Post reverted to draft.',
				item_updated: 'Post updated.',
			},
			viewable: true,
		} );

		it( 'should dispatch notices when publishing or scheduling a post', () => {
			const previousPost = getDraftPost();
			const post = getPublishedPost();
			const postType = getPostType();

			handler( { post, previousPost, postType } );

			expect( dataDispatch( 'core/notices' ).createSuccessNotice ).toHaveBeenCalledWith(
				'Post published.',
				{
					id: SAVE_POST_NOTICE_ID,
					actions: [
						{ label: 'View post', url: undefined },
					],
				}
			);
		} );

		it( 'should dispatch notices when publishing or scheduling an unviewable post', () => {
			const previousPost = getDraftPost();
			const post = getPublishedPost();
			const postType = { ...getPostType(), viewable: false };

			handler( { post, previousPost, postType } );

			expect( dataDispatch( 'core/notices' ).createSuccessNotice ).toHaveBeenCalledWith(
				'Post published.',
				{
					id: SAVE_POST_NOTICE_ID,
					actions: [],
				}
			);
		} );

		it( 'should dispatch notices when reverting a published post to a draft', () => {
			const previousPost = getPublishedPost();
			const post = getDraftPost();
			const postType = getPostType();

			handler( { post, previousPost, postType } );

			expect( dataDispatch( 'core/notices' ).createSuccessNotice ).toHaveBeenCalledWith(
				'Post reverted to draft.',
				{
					id: SAVE_POST_NOTICE_ID,
					actions: [],
				}
			);
		} );

		it( 'should dispatch notices when just updating a published post again', () => {
			const previousPost = getPublishedPost();
			const post = getPublishedPost();
			const postType = getPostType();

			handler( { post, previousPost, postType } );

			expect( dataDispatch( 'core/notices' ).createSuccessNotice ).toHaveBeenCalledWith(
				'Post updated.',
				{
					id: SAVE_POST_NOTICE_ID,
					actions: [
						{ label: 'View post', url: undefined },
					],
				}
			);
		} );

		it( 'should do nothing if the updated post was autosaved', () => {
			const previousPost = getPublishedPost();
			const post = { ...getPublishedPost(), id: defaultPost.id + 1 };

			handler( { post, previousPost, options: { isAutosave: true } } );

			expect( dataDispatch( 'core/notices' ).createSuccessNotice ).not.toHaveBeenCalled();
		} );
	} );

	describe( '.REQUEST_POST_UPDATE_FAILURE', () => {
		it( 'should dispatch a notice on failure when publishing a draft fails.', () => {
			const handler = effects.REQUEST_POST_UPDATE_FAILURE;

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

			handler( action );

			expect( dataDispatch( 'core/notices' ).createErrorNotice ).toHaveBeenCalledWith( 'Publishing failed', { id: SAVE_POST_NOTICE_ID } );
		} );

		it( 'should not dispatch a notice when there were no changes for autosave to save.', () => {
			const handler = effects.REQUEST_POST_UPDATE_FAILURE;

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
				error: {
					code: 'rest_autosave_no_changes',
				},
			};

			handler( action );

			expect( dataDispatch( 'core/notices' ).createErrorNotice ).not.toHaveBeenCalled();
		} );

		it( 'should dispatch a notice on failure when trying to update a draft.', () => {
			const handler = effects.REQUEST_POST_UPDATE_FAILURE;

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

			handler( action );

			expect( dataDispatch( 'core/notices' ).createErrorNotice ).toHaveBeenCalledWith( 'Updating failed', { id: SAVE_POST_NOTICE_ID } );
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
			const getState = () => ( {
				settings: {
					template: null,
					templateLock: false,
				},
				template: {
					isValid: true,
				},
			} );

			const result = handler( { post, settings: {} }, { getState } );

			expect( result ).toEqual( [
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
			const getState = () => ( {
				settings: {
					template: null,
					templateLock: false,
				},
				template: {
					isValid: true,
				},
			} );

			const result = handler( { post }, { getState } );

			expect( result[ 0 ].blocks ).toHaveLength( 1 );
			expect( result ).toEqual( [
				setupEditorState( post, result[ 0 ].blocks, {} ),
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
			const getState = () => ( {
				settings: {
					template: null,
					templateLock: false,
				},
				template: {
					isValid: true,
				},
			} );

			const result = handler( { post }, { getState } );

			expect( result ).toEqual( [
				setupEditorState( post, [], { title: 'A History of Pork' } ),
			] );
		} );
	} );

	describe( 'validateBlocksToTemplate', () => {
		let store;
		beforeEach( () => {
			store = createRegistry().registerStore( 'test', {
				actions,
				selectors,
				reducer,
			} );
			applyMiddlewares( store );

			registerBlockType( 'core/test-block', defaultBlockSettings );
		} );

		afterEach( () => {
			getBlockTypes().forEach( ( block ) => {
				unregisterBlockType( block.name );
			} );
		} );

		it( 'should return undefined if no template assigned', () => {
			const result = validateBlocksToTemplate( resetBlocks( [
				createBlock( 'core/test-block' ),
			] ), store );

			expect( result ).toBe( undefined );
		} );

		it( 'should return undefined if invalid but unlocked', () => {
			store.dispatch( updateEditorSettings( {
				template: [
					[ 'core/foo', {} ],
				],
			} ) );

			const result = validateBlocksToTemplate( resetBlocks( [
				createBlock( 'core/test-block' ),
			] ), store );

			expect( result ).toBe( undefined );
		} );

		it( 'should return undefined if locked and valid', () => {
			store.dispatch( updateEditorSettings( {
				template: [
					[ 'core/test-block' ],
				],
				templateLock: 'all',
			} ) );

			const result = validateBlocksToTemplate( resetBlocks( [
				createBlock( 'core/test-block' ),
			] ), store );

			expect( result ).toBe( undefined );
		} );

		it( 'should return validity set action if invalid on default state', () => {
			store.dispatch( updateEditorSettings( {
				template: [
					[ 'core/foo' ],
				],
				templateLock: 'all',
			} ) );

			const result = validateBlocksToTemplate( resetBlocks( [
				createBlock( 'core/test-block' ),
			] ), store );

			expect( result ).toEqual( setTemplateValidity( false ) );
		} );
	} );
} );
