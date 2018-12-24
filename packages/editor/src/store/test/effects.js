/**
 * WordPress dependencies
 */
import {
	getBlockTypes,
	unregisterBlockType,
	registerBlockType,
} from '@wordpress/blocks';
import { dispatch as dataDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { setupEditorState, resetEditorBlocks } from '../actions';
import effects from '../effects';
import { SAVE_POST_NOTICE_ID } from '../effects/posts';
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

			const result = handler( { post, settings: {} } );

			expect( result ).toEqual( [
				resetEditorBlocks( [] ),
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

			const result = handler( { post } );

			expect( result[ 0 ].blocks ).toHaveLength( 1 );
			expect( result[ 1 ] ).toEqual( setupEditorState( post, result[ 0 ].blocks, {} ) );
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

			const result = handler( { post } );

			expect( result ).toEqual( [
				resetEditorBlocks( [] ),
				setupEditorState( post, [], { title: 'A History of Pork' } ),
			] );
		} );
	} );
} );
