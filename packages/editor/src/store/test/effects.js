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

/**
 * Internal dependencies
 */
import {
	setupEditorState,
	mergeBlocks,
	replaceBlocks,
	selectBlock,
	createErrorNotice,
	setTemplateValidity,
	editPost,
} from '../actions';
import effects from '../effects';
import * as selectors from '../selectors';
import reducer from '../reducer';

describe( 'effects', () => {
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

		function createGetState( hasLingeringEdits = false ) {
			let state = reducer( undefined, {} );
			if ( hasLingeringEdits ) {
				state = reducer( state, editPost( { edited: true } ) );
			}

			const getState = () => state;
			return getState;
		}

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

		it( 'should dispatch notices when publishing or scheduling a post', () => {
			const dispatch = jest.fn();
			const store = { dispatch, getState: createGetState() };

			const previousPost = getDraftPost();
			const post = getPublishedPost();

			handler( { post, previousPost }, store );

			expect( dispatch ).toHaveBeenCalledTimes( 1 );
			expect( dispatch ).toHaveBeenCalledWith( expect.objectContaining( {
				notice: {
					content: <p>Post published!{ ' ' }<a>View post</a></p>, // eslint-disable-line jsx-a11y/anchor-is-valid
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
			const store = { dispatch, getState: createGetState() };

			const previousPost = getPublishedPost();
			const post = getDraftPost();

			handler( { post, previousPost }, store );

			expect( dispatch ).toHaveBeenCalledTimes( 1 );
			expect( dispatch ).toHaveBeenCalledWith( expect.objectContaining( {
				notice: {
					content: <p>
						Post reverted to draft.
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
			const store = { dispatch, getState: createGetState() };

			const previousPost = getPublishedPost();
			const post = getPublishedPost();

			handler( { post, previousPost }, store );

			expect( dispatch ).toHaveBeenCalledTimes( 1 );
			expect( dispatch ).toHaveBeenCalledWith( expect.objectContaining( {
				notice: {
					content: <p>Post updated!{ ' ' }<a>{ 'View post' }</a></p>, // eslint-disable-line jsx-a11y/anchor-is-valid
					id: 'SAVE_POST_NOTICE_ID',
					isDismissible: true,
					status: 'success',
					spokenMessage: 'Post updated!',
				},
				type: 'CREATE_NOTICE',
			} ) );
		} );

		it( 'should do nothing if the updated post was autosaved', () => {
			const dispatch = jest.fn();
			const store = { dispatch, getState: createGetState() };

			const previousPost = getPublishedPost();
			const post = { ...getPublishedPost(), id: defaultPost.id + 1 };

			handler( { post, previousPost, isAutosave: true }, store );

			expect( dispatch ).toHaveBeenCalledTimes( 0 );
		} );

		it( 'should dispatch dirtying action if edits linger after autosave', () => {
			const dispatch = jest.fn();
			const store = { dispatch, getState: createGetState( true ) };

			const previousPost = getPublishedPost();
			const post = { ...getPublishedPost(), id: defaultPost.id + 1 };

			handler( { post, previousPost, isAutosave: true }, store );

			expect( dispatch ).toHaveBeenCalledTimes( 1 );
			expect( dispatch ).toHaveBeenCalledWith( { type: 'DIRTY_ARTIFICIALLY' } );
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

		it( 'should not dispatch a notice when there were no changes for autosave to save.', () => {
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
				error: {
					code: 'rest_autosave_no_changes',
				},
			};

			handler( action, store );

			expect( dispatch ).toHaveBeenCalledTimes( 0 );
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
			const getState = () => ( {
				settings: {
					template: null,
					templateLock: false,
				},
			} );

			const result = handler( { post, settings: {} }, { getState } );

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
			const getState = () => ( {
				settings: {
					template: null,
					templateLock: false,
				},
			} );

			const result = handler( { post }, { getState } );

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
			const getState = () => ( {
				settings: {
					template: null,
					templateLock: false,
				},
			} );

			const result = handler( { post }, { getState } );

			expect( result ).toEqual( [
				setTemplateValidity( true ),
				setupEditorState( post, [], { title: 'A History of Pork' } ),
			] );
		} );
	} );
} );
