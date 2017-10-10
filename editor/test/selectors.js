/**
 * External dependencies
 */
import moment from 'moment';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
	getEditorMode,
	getPreference,
	isEditorSidebarOpened,
	isEditorSidebarPanelOpened,
	hasEditorUndo,
	hasEditorRedo,
	isEditedPostNew,
	isEditedPostDirty,
	isCleanNewPost,
	getCurrentPost,
	getCurrentPostId,
	getCurrentPostType,
	getPostEdits,
	getEditedPostTitle,
	getDocumentTitle,
	getEditedPostExcerpt,
	getEditedPostVisibility,
	isCurrentPostPublished,
	isEditedPostPublishable,
	isEditedPostSaveable,
	isEditedPostBeingScheduled,
	getEditedPostPreviewLink,
	getBlock,
	getBlocks,
	getBlockCount,
	getSelectedBlock,
	getEditedPostContent,
	getMultiSelectedBlockUids,
	getMultiSelectedBlocksStartUid,
	getMultiSelectedBlocksEndUid,
	getBlockUids,
	getBlockIndex,
	isFirstBlock,
	isLastBlock,
	getPreviousBlock,
	getNextBlock,
	isBlockSelected,
	isBlockMultiSelected,
	isFirstMultiSelectedBlock,
	isBlockHovered,
	getBlockFocus,
	getBlockMode,
	isTyping,
	getBlockInsertionPoint,
	isBlockInsertionPointVisible,
	isSavingPost,
	didPostSaveRequestSucceed,
	didPostSaveRequestFail,
	getSuggestedPostFormat,
	getNotices,
	getMostFrequentlyUsedBlocks,
} from '../selectors';

describe( 'selectors', () => {
	function getEditorState( states ) {
		const past = [ ...states ];
		const present = past.pop();

		return {
			...present,
			history: { past, present },
		};
	}

	beforeAll( () => {
		registerBlockType( 'core/test-block', {
			save: ( props ) => props.attributes.text,
			category: 'common',
			title: 'test block',
		} );
	} );

	beforeEach( () => {
		isEditedPostDirty.clear();
		getBlock.clear();
		getBlocks.clear();
		getEditedPostContent.clear();
	} );

	afterAll( () => {
		unregisterBlockType( 'core/test-block' );
	} );

	describe( 'getEditorMode', () => {
		it( 'should return the selected editor mode', () => {
			const state = {
				preferences: { mode: 'text' },
			};

			expect( getEditorMode( state ) ).toEqual( 'text' );
		} );

		it( 'should fallback to visual if not set', () => {
			const state = {
				preferences: {},
			};

			expect( getEditorMode( state ) ).toEqual( 'visual' );
		} );
	} );

	describe( 'getPreference', () => {
		it( 'should return the preference value if set', () => {
			const state = {
				preferences: { chicken: true },
			};

			expect( getPreference( state, 'chicken' ) ).toBe( true );
		} );

		it( 'should return undefined if the preference is unset', () => {
			const state = {
				preferences: { chicken: true },
			};

			expect( getPreference( state, 'ribs' ) ).toBeUndefined();
		} );

		it( 'should return the default value if provided', () => {
			const state = {
				preferences: {},
			};

			expect( getPreference( state, 'ribs', 'chicken' ) ).toEqual( 'chicken' );
		} );
	} );

	describe( 'isEditorSidebarOpened', () => {
		it( 'should return true when the sidebar is opened', () => {
			const state = {
				preferences: { isSidebarOpened: true },
			};

			expect( isEditorSidebarOpened( state ) ).toBe( true );
		} );

		it( 'should return false when the sidebar is opened', () => {
			const state = {
				preferences: { isSidebarOpened: false },
			};

			expect( isEditorSidebarOpened( state ) ).toBe( false );
		} );
	} );

	describe( 'isEditorSidebarPanelOpened', () => {
		it( 'should return false if no panels preference', () => {
			const state = {
				preferences: { isSidebarOpened: true },
			};

			expect( isEditorSidebarPanelOpened( state, 'post-taxonomies' ) ).toBe( false );
		} );

		it( 'should return false if the panel value is not set', () => {
			const state = {
				preferences: { panels: {} },
			};

			expect( isEditorSidebarPanelOpened( state, 'post-taxonomies' ) ).toBe( false );
		} );

		it( 'should return the panel value', () => {
			const state = {
				preferences: { panels: { 'post-taxonomies': true } },
			};

			expect( isEditorSidebarPanelOpened( state, 'post-taxonomies' ) ).toBe( true );
		} );
	} );

	describe( 'hasEditorUndo', () => {
		it( 'should return true when the past history is not empty', () => {
			const state = {
				editor: {
					history: {
						past: [
							{},
						],
					},
				},
			};

			expect( hasEditorUndo( state ) ).toBe( true );
		} );

		it( 'should return false when the past history is empty', () => {
			const state = {
				editor: {
					history: {
						past: [],
					},
				},
			};

			expect( hasEditorUndo( state ) ).toBe( false );
		} );
	} );

	describe( 'hasEditorRedo', () => {
		it( 'should return true when the future history is not empty', () => {
			const state = {
				editor: {
					history: {
						future: [
							{},
						],
					},
				},
			};

			expect( hasEditorRedo( state ) ).toBe( true );
		} );

		it( 'should return false when the future history is empty', () => {
			const state = {
				editor: {
					history: {
						future: [],
					},
				},
			};

			expect( hasEditorRedo( state ) ).toBe( false );
		} );
	} );

	describe( 'isEditedPostNew', () => {
		it( 'should return true when the post is new', () => {
			const state = {
				currentPost: {
					status: 'auto-draft',
				},
				editor: {
					edits: {},
				},
			};

			expect( isEditedPostNew( state ) ).toBe( true );
		} );

		it( 'should return false when the post is not new', () => {
			const state = {
				currentPost: {
					status: 'draft',
				},
				editor: {
					edits: {},
				},
			};

			expect( isEditedPostNew( state ) ).toBe( false );
		} );
	} );

	describe( 'isEditedPostDirty', () => {
		it( 'should return true when the post has edited attributes', () => {
			const state = {
				currentPost: {
					title: '',
				},
				editor: getEditorState( [
					{
						edits: {
							title: 'The Meat Eater\'s Guide to Delicious Meats',
						},
						blocksByUid: {},
						blockOrder: [],
					},
				] ),
			};

			expect( isEditedPostDirty( state ) ).toBe( true );
		} );

		it( 'should return false when the post has no edited attributes and no past', () => {
			const state = {
				currentPost: {
					title: 'The Meat Eater\'s Guide to Delicious Meats',
				},
				editor: getEditorState( [
					{
						edits: {
							title: 'The Meat Eater\'s Guide to Delicious Meats',
						},
						blocksByUid: {},
						blockOrder: [],
					},
				] ),
			};

			expect( isEditedPostDirty( state ) ).toBe( false );
		} );

		it( 'should return false when the post has no edited attributes', () => {
			const state = {
				currentPost: {
					title: 'The Meat Eater\'s Guide to Delicious Meats',
				},
				editor: getEditorState( [
					{
						edits: {
							title: 'The Meat Eater\'s Guide to Delicious Meats',
						},
						blocksByUid: {},
						blockOrder: [],
					},
					{
						edits: {
							title: 'The Meat Eater\'s Guide to Delicious Meats',
						},
						blocksByUid: {
							123: {
								name: 'core/food',
								attributes: { name: 'Chicken', delicious: false },
							},
						},
						blockOrder: [
							123,
						],
					},
					{
						edits: {
							title: 'The Meat Eater\'s Guide to Delicious Meats',
						},
						blocksByUid: {},
						blockOrder: [],
					},
				] ),
			};

			expect( isEditedPostDirty( state ) ).toBe( false );
		} );

		it( 'should return true when the post has edited block attributes', () => {
			const state = {
				currentPost: {
					title: 'The Meat Eater\'s Guide to Delicious Meats',
				},
				editor: getEditorState( [
					{
						edits: {},
						blocksByUid: {
							123: {
								name: 'core/food',
								attributes: { name: 'Chicken', delicious: false },
							},
						},
						blockOrder: [
							123,
						],
					},
					{
						edits: {
							title: 'The Meat Eater\'s Guide to Delicious Meats',
						},
						blocksByUid: {
							123: {
								name: 'core/food',
								attributes: { name: 'Chicken', delicious: true },
							},
						},
						blockOrder: [
							123,
						],
					},
				] ),
			};

			expect( isEditedPostDirty( state ) ).toBe( true );
		} );

		it( 'should return true when the post has new blocks', () => {
			const state = {
				currentPost: {
					title: 'The Meat Eater\'s Guide to Delicious Meats',
				},
				editor: getEditorState( [
					{
						edits: {},
						blocksByUid: {
							123: {
								name: 'core/food',
								attributes: { name: 'Chicken', delicious: true },
							},
						},
						blockOrder: [
							123,
							456,
						],
					},
					{
						edits: {
							title: 'The Meat Eater\'s Guide to Delicious Meats',
						},
						blocksByUid: {
							123: {
								name: 'core/food',
								attributes: { name: 'Chicken', delicious: true },
							},
							456: {
								name: 'core/food',
								attributes: { name: 'Ribs', delicious: true },
							},
						},
						blockOrder: [
							123,
							456,
						],
					},
				] ),
			};

			expect( isEditedPostDirty( state ) ).toBe( true );
		} );

		it( 'should return true when the post has changed block order', () => {
			const state = {
				currentPost: {
					title: 'The Meat Eater\'s Guide to Delicious Meats',
				},
				editor: getEditorState( [
					{
						edits: {},
						blocksByUid: {
							123: {
								name: 'core/food',
								attributes: { name: 'Chicken', delicious: true },
							},
							456: {
								name: 'core/food',
								attributes: { name: 'Ribs', delicious: true },
							},
						},
						blockOrder: [
							123,
							456,
						],
					},
					{
						edits: {
							title: 'The Meat Eater\'s Guide to Delicious Meats',
						},
						blocksByUid: {
							123: {
								name: 'core/food',
								attributes: { name: 'Chicken', delicious: true },
							},
							456: {
								name: 'core/food',
								attributes: { name: 'Ribs', delicious: true },
							},
						},
						blockOrder: [
							456,
							123,
						],
					},
				] ),
			};

			expect( isEditedPostDirty( state ) ).toBe( true );
		} );

		it( 'should return false when no edits, no changed block attributes, no changed order', () => {
			const state = {
				currentPost: {
					title: 'The Meat Eater\'s Guide to Delicious Meats',
				},
				editor: getEditorState( [
					{
						edits: {},
						blocksByUid: {
							123: {
								name: 'core/food',
								attributes: { name: 'Chicken', delicious: true },
							},
							456: {
								name: 'core/food',
								attributes: { name: 'Ribs', delicious: true },
							},
						},
						blockOrder: [
							456,
							123,
						],
					},
					{
						edits: {
							title: 'The Meat Eater\'s Guide to Delicious Meats',
						},
						blocksByUid: {
							123: {
								name: 'core/food',
								attributes: { name: 'Chicken', delicious: true },
							},
							456: {
								name: 'core/food',
								attributes: { name: 'Ribs', delicious: true },
							},
						},
						blockOrder: [
							456,
							123,
						],
					},
				] ),
			};

			expect( isEditedPostDirty( state ) ).toBe( false );
		} );
	} );

	describe( 'isCleanNewPost', () => {
		it( 'should return true when the post is not dirty and has not been saved before', () => {
			const state = {
				editor: getEditorState( [
					{
						edits: {},
					},
				] ),
				currentPost: {
					id: 1,
					status: 'auto-draft',
				},
			};

			expect( isCleanNewPost( state ) ).toBe( true );
		} );

		it( 'should return false when the post is not dirty but the post has been saved', () => {
			const state = {
				editor: getEditorState( [
					{
						edits: {},
					},
				] ),
				currentPost: {
					id: 1,
					status: 'draft',
				},
			};

			expect( isCleanNewPost( state ) ).toBe( false );
		} );

		it( 'should return false when the post is dirty but the post has not been saved', () => {
			const state = {
				editor: getEditorState( [
					{
						edits: {},
					},
					{
						edits: { title: 'Dirty' },
					},
				] ),
				currentPost: {
					id: 1,
					status: 'auto-draft',
				},
			};

			expect( isCleanNewPost( state ) ).toBe( false );
		} );
	} );

	describe( 'getCurrentPost', () => {
		it( 'should return the current post', () => {
			const state = {
				currentPost: { id: 1 },
			};

			expect( getCurrentPost( state ) ).toEqual( { id: 1 } );
		} );
	} );

	describe( 'getCurrentPostId', () => {
		it( 'should return null if the post has not yet been saved', () => {
			const state = {
				currentPost: {},
			};

			expect( getCurrentPostId( state ) ).toBeNull();
		} );

		it( 'should return the current post ID', () => {
			const state = {
				currentPost: { id: 1 },
			};

			expect( getCurrentPostId( state ) ).toBe( 1 );
		} );
	} );

	describe( 'getCurrentPostType', () => {
		it( 'should return the post type', () => {
			const state = {
				currentPost: {
					type: 'post',
				},
			};

			expect( getCurrentPostType( state ) ).toBe( 'post' );
		} );
	} );

	describe( 'getPostEdits', () => {
		it( 'should return the post edits', () => {
			const state = {
				editor: {
					edits: { title: 'terga' },
				},
			};

			expect( getPostEdits( state ) ).toEqual( { title: 'terga' } );
		} );
	} );

	describe( 'getEditedPostTitle', () => {
		it( 'should return the post saved title if the title is not edited', () => {
			const state = {
				currentPost: {
					title: 'sassel',
				},
				editor: {
					edits: { status: 'private' },
				},
			};

			expect( getEditedPostTitle( state ) ).toBe( 'sassel' );
		} );

		it( 'should return the edited title', () => {
			const state = {
				currentPost: {
					title: 'sassel',
				},
				editor: {
					edits: { title: 'youcha' },
				},
			};

			expect( getEditedPostTitle( state ) ).toBe( 'youcha' );
		} );
	} );

	describe( 'getDocumentTitle', () => {
		it( 'should return current title unedited existing post', () => {
			const state = {
				currentPost: {
					id: 123,
					title: 'The Title',
				},
				editor: getEditorState( [
					{
						edits: {},
					},
				] ),
			};

			expect( getDocumentTitle( state ) ).toBe( 'The Title' );
		} );

		it( 'should return current title for edited existing post', () => {
			const state = {
				currentPost: {
					id: 123,
					title: 'The Title',
				},
				editor: getEditorState( [
					{
						edits: {},
					},
					{
						edits: { title: 'Modified Title' },
					},
				] ),
			};

			expect( getDocumentTitle( state ) ).toBe( 'Modified Title' );
		} );

		it( 'should return new post title when new post is clean', () => {
			const state = {
				currentPost: {
					id: 1,
					status: 'auto-draft',
					title: '',
				},
				editor: getEditorState( [
					{
						edits: {},
					},
				] ),
			};

			expect( getDocumentTitle( state ) ).toBe( __( 'New post' ) );
		} );

		it( 'should return untitled title', () => {
			const state = {
				currentPost: {
					id: 123,
					status: 'draft',
					title: '',
				},
				editor: getEditorState( [
					{
						edits: {},
					},
				] ),
			};

			expect( getDocumentTitle( state ) ).toBe( __( '(Untitled)' ) );
		} );
	} );

	describe( 'getEditedPostExcerpt', () => {
		it( 'should return the post saved excerpt if the excerpt is not edited', () => {
			const state = {
				currentPost: {
					excerpt: 'sassel',
				},
				editor: {
					edits: { status: 'private' },
				},
			};

			expect( getEditedPostExcerpt( state ) ).toBe( 'sassel' );
		} );

		it( 'should return the edited excerpt', () => {
			const state = {
				currentPost: {
					excerpt: 'sassel',
				},
				editor: {
					edits: { excerpt: 'youcha' },
				},
			};

			expect( getEditedPostExcerpt( state ) ).toBe( 'youcha' );
		} );
	} );

	describe( 'getEditedPostVisibility', () => {
		it( 'should return public by default', () => {
			const state = {
				currentPost: {
					status: 'draft',
				},
				editor: {
					edits: {},
				},
			};

			expect( getEditedPostVisibility( state ) ).toBe( 'public' );
		} );

		it( 'should return private for private posts', () => {
			const state = {
				currentPost: {
					status: 'private',
				},
				editor: {
					edits: {},
				},
			};

			expect( getEditedPostVisibility( state ) ).toBe( 'private' );
		} );

		it( 'should return private for password for password protected posts', () => {
			const state = {
				currentPost: {
					status: 'draft',
					password: 'chicken',
				},
				editor: {
					edits: {},
				},
			};

			expect( getEditedPostVisibility( state ) ).toBe( 'password' );
		} );

		it( 'should use the edited status and password if edits present', () => {
			const state = {
				currentPost: {
					status: 'draft',
					password: 'chicken',
				},
				editor: {
					edits: {
						status: 'private',
						password: null,
					},
				},
			};

			expect( getEditedPostVisibility( state ) ).toBe( 'private' );
		} );
	} );

	describe( 'isCurrentPostPublished', () => {
		it( 'should return true for public posts', () => {
			const state = {
				currentPost: {
					status: 'publish',
				},
			};

			expect( isCurrentPostPublished( state ) ).toBe( true );
		} );

		it( 'should return true for private posts', () => {
			const state = {
				currentPost: {
					status: 'private',
				},
			};

			expect( isCurrentPostPublished( state ) ).toBe( true );
		} );

		it( 'should return false for draft posts', () => {
			const state = {
				currentPost: {
					status: 'draft',
				},
			};

			expect( isCurrentPostPublished( state ) ).toBe( false );
		} );

		it( 'should return true for old scheduled posts', () => {
			const state = {
				currentPost: {
					status: 'future',
					date: '2016-05-30T17:21:39',
				},
			};

			expect( isCurrentPostPublished( state ) ).toBe( true );
		} );
	} );

	describe( 'isEditedPostPublishable', () => {
		it( 'should return true for pending posts', () => {
			const state = {
				currentPost: {
					status: 'pending',
				},
				editor: getEditorState( [
					{
						edits: {},
					},
				] ),
			};

			expect( isEditedPostPublishable( state ) ).toBe( true );
		} );

		it( 'should return true for draft posts', () => {
			const state = {
				currentPost: {
					status: 'draft',
				},
				editor: getEditorState( [
					{
						edits: {},
					},
				] ),
			};

			expect( isEditedPostPublishable( state ) ).toBe( true );
		} );

		it( 'should return false for published posts', () => {
			const state = {
				currentPost: {
					status: 'publish',
				},
				editor: getEditorState( [
					{
						edits: {},
					},
				] ),
			};

			expect( isEditedPostPublishable( state ) ).toBe( false );
		} );

		it( 'should return false for private posts', () => {
			const state = {
				currentPost: {
					status: 'private',
				},
				editor: getEditorState( [
					{
						edits: {},
					},
				] ),
			};

			expect( isEditedPostPublishable( state ) ).toBe( false );
		} );

		it( 'should return false for scheduled posts', () => {
			const state = {
				currentPost: {
					status: 'private',
				},
				editor: getEditorState( [
					{
						edits: {},
					},
				] ),
			};

			expect( isEditedPostPublishable( state ) ).toBe( false );
		} );

		it( 'should return true for dirty posts with usable title', () => {
			const state = {
				currentPost: {
					status: 'private',
				},
				editor: getEditorState( [
					{
						edits: {},
					},
					{
						edits: { title: 'Dirty' },
					},
				] ),
			};

			expect( isEditedPostPublishable( state ) ).toBe( true );
		} );
	} );

	describe( 'isEditedPostSaveable', () => {
		it( 'should return false if the post has no title, excerpt, content', () => {
			const state = {
				editor: {
					blocksByUid: {},
					blockOrder: [],
					edits: {},
				},
				currentPost: {},
			};

			expect( isEditedPostSaveable( state ) ).toBe( false );
		} );

		it( 'should return true if the post has a title', () => {
			const state = {
				editor: {
					blocksByUid: {},
					blockOrder: [],
					edits: {},
				},
				currentPost: {
					title: 'sassel',
				},
			};

			expect( isEditedPostSaveable( state ) ).toBe( true );
		} );

		it( 'should return true if the post has an excerpt', () => {
			const state = {
				editor: {
					blocksByUid: {},
					blockOrder: [],
					edits: {},
				},
				currentPost: {
					excerpt: 'sassel',
				},
			};

			expect( isEditedPostSaveable( state ) ).toBe( true );
		} );

		it( 'should return true if the post has content', () => {
			const state = {
				editor: {
					blocksByUid: {
						123: {
							uid: 123,
							name: 'core/test-block',
							attributes: {
								text: '',
							},
						},
					},
					blockOrder: [ 123 ],
					edits: {},
				},
				currentPost: {},
			};

			expect( isEditedPostSaveable( state ) ).toBe( true );
		} );
	} );

	describe( 'isEditedPostBeingScheduled', () => {
		it( 'should return true for posts with a future date', () => {
			const state = {
				editor: {
					edits: { date: moment().add( 7, 'days' ).format( '' ) },
				},
			};

			expect( isEditedPostBeingScheduled( state ) ).toBe( true );
		} );

		it( 'should return false for posts with an old date', () => {
			const state = {
				editor: {
					edits: { date: '2016-05-30T17:21:39' },
				},
			};

			expect( isEditedPostBeingScheduled( state ) ).toBe( false );
		} );
	} );

	describe( 'getEditedPostPreviewLink', () => {
		it( 'should return null if the post has not link yet', () => {
			const state = {
				currentPost: {},
			};

			expect( getEditedPostPreviewLink( state ) ).toBeNull();
		} );

		it( 'should return the correct url adding a preview parameter to the query string', () => {
			const state = {
				currentPost: {
					link: 'https://andalouses.com/beach',
				},
			};

			expect( getEditedPostPreviewLink( state ) ).toBe( 'https://andalouses.com/beach?preview=true' );
		} );
	} );

	describe( 'getBlock', () => {
		it( 'should return the block', () => {
			const state = {
				currentPost: {},
				editor: {
					blocksByUid: {
						123: { uid: 123, name: 'core/paragraph' },
					},
					edits: {},
				},
			};

			expect( getBlock( state, 123 ) ).toEqual( { uid: 123, name: 'core/paragraph' } );
		} );

		it( 'should return null if the block is not present in state', () => {
			const state = {
				currentPost: {},
				editor: {
					blocksByUid: {},
					edits: {},
				},
			};

			expect( getBlock( state, 123 ) ).toBe( null );
		} );

		it( 'should merge meta attributes for the block', () => {
			registerBlockType( 'core/meta-block', {
				save: ( props ) => props.attributes.text,
				category: 'common',
				title: 'test block',
				attributes: {
					foo: {
						type: 'string',
						meta: 'foo',
					},
				},
			} );

			const state = {
				currentPost: {
					meta: {
						foo: 'bar',
					},
				},
				editor: {
					blocksByUid: {
						123: { uid: 123, name: 'core/meta-block' },
					},
					edits: {},
				},
			};

			expect( getBlock( state, 123 ) ).toEqual( {
				uid: 123,
				name: 'core/meta-block',
				attributes: {
					foo: 'bar',
				},
			} );
		} );
	} );

	describe( 'getBlocks', () => {
		it( 'should return the ordered blocks', () => {
			const state = {
				currentPost: {},
				editor: {
					blocksByUid: {
						23: { uid: 23, name: 'core/heading' },
						123: { uid: 123, name: 'core/paragraph' },
					},
					blockOrder: [ 123, 23 ],
					edits: {},
				},
			};

			expect( getBlocks( state ) ).toEqual( [
				{ uid: 123, name: 'core/paragraph' },
				{ uid: 23, name: 'core/heading' },
			] );
		} );
	} );

	describe( 'getBlockCount', () => {
		it( 'should return the number of blocks in the post', () => {
			const state = {
				editor: {
					blocksByUid: {
						23: { uid: 23, name: 'core/heading' },
						123: { uid: 123, name: 'core/paragraph' },
					},
					blockOrder: [ 123, 23 ],
				},
			};

			expect( getBlockCount( state ) ).toBe( 2 );
		} );
	} );

	describe( 'getSelectedBlock', () => {
		it( 'should return null if no block is selected', () => {
			const state = {
				currentPost: {},
				editor: {
					blocksByUid: {
						23: { uid: 23, name: 'core/heading' },
						123: { uid: 123, name: 'core/paragraph' },
					},
					edits: {},
				},
				blockSelection: { start: null, end: null },
			};

			expect( getSelectedBlock( state ) ).toBe( null );
		} );

		it( 'should return null if there is multi selection', () => {
			const state = {
				editor: {
					blocksByUid: {
						23: { uid: 23, name: 'core/heading' },
						123: { uid: 123, name: 'core/paragraph' },
					},
				},
				blockSelection: { start: 23, end: 123 },
			};

			expect( getSelectedBlock( state ) ).toBe( null );
		} );

		it( 'should return the selected block', () => {
			const state = {
				editor: {
					blocksByUid: {
						23: { uid: 23, name: 'core/heading' },
						123: { uid: 123, name: 'core/paragraph' },
					},
				},
				blockSelection: { start: 23, end: 23 },
			};

			expect( getSelectedBlock( state ) ).toBe( state.editor.blocksByUid[ 23 ] );
		} );
	} );

	describe( 'getMultiSelectedBlockUids', () => {
		it( 'should return empty if there is no multi selection', () => {
			const state = {
				editor: {
					blockOrder: [ 123, 23 ],
				},
				blockSelection: { start: null, end: null },
			};

			expect( getMultiSelectedBlockUids( state ) ).toEqual( [] );
		} );

		it( 'should return selected block uids if there is multi selection', () => {
			const state = {
				editor: {
					blockOrder: [ 5, 4, 3, 2, 1 ],
				},
				blockSelection: { start: 2, end: 4 },
			};

			expect( getMultiSelectedBlockUids( state ) ).toEqual( [ 4, 3, 2 ] );
		} );
	} );

	describe( 'getMultiSelectedBlocksStartUid', () => {
		it( 'returns null if there is no multi selection', () => {
			const state = {
				editor: {
					blockOrder: [ 123, 23 ],
				},
				blockSelection: { start: null, end: null },
			};

			expect( getMultiSelectedBlocksStartUid( state ) ).toBeNull();
		} );

		it( 'returns multi selection start', () => {
			const state = {
				editor: {
					blockOrder: [ 5, 4, 3, 2, 1 ],
				},
				blockSelection: { start: 2, end: 4 },
			};

			expect( getMultiSelectedBlocksStartUid( state ) ).toBe( 2 );
		} );
	} );

	describe( 'getMultiSelectedBlocksEndUid', () => {
		it( 'returns null if there is no multi selection', () => {
			const state = {
				editor: {
					blockOrder: [ 123, 23 ],
				},
				blockSelection: { start: null, end: null },
			};

			expect( getMultiSelectedBlocksEndUid( state ) ).toBeNull();
		} );

		it( 'returns multi selection end', () => {
			const state = {
				editor: {
					blockOrder: [ 5, 4, 3, 2, 1 ],
				},
				blockSelection: { start: 2, end: 4 },
			};

			expect( getMultiSelectedBlocksEndUid( state ) ).toBe( 4 );
		} );
	} );

	describe( 'getBlockUids', () => {
		it( 'should return the ordered block UIDs', () => {
			const state = {
				editor: {
					blockOrder: [ 123, 23 ],
				},
			};

			expect( getBlockUids( state ) ).toEqual( [ 123, 23 ] );
		} );
	} );

	describe( 'getBlockIndex', () => {
		it( 'should return the block order', () => {
			const state = {
				editor: {
					blockOrder: [ 123, 23 ],
				},
			};

			expect( getBlockIndex( state, 23 ) ).toBe( 1 );
		} );
	} );

	describe( 'isFirstBlock', () => {
		it( 'should return true when the block is first', () => {
			const state = {
				editor: {
					blockOrder: [ 123, 23 ],
				},
			};

			expect( isFirstBlock( state, 123 ) ).toBe( true );
		} );

		it( 'should return false when the block is not first', () => {
			const state = {
				editor: {
					blockOrder: [ 123, 23 ],
				},
			};

			expect( isFirstBlock( state, 23 ) ).toBe( false );
		} );
	} );

	describe( 'isLastBlock', () => {
		it( 'should return true when the block is last', () => {
			const state = {
				editor: {
					blockOrder: [ 123, 23 ],
				},
			};

			expect( isLastBlock( state, 23 ) ).toBe( true );
		} );

		it( 'should return false when the block is not last', () => {
			const state = {
				editor: {
					blockOrder: [ 123, 23 ],
				},
			};

			expect( isLastBlock( state, 123 ) ).toBe( false );
		} );
	} );

	describe( 'getPreviousBlock', () => {
		it( 'should return the previous block', () => {
			const state = {
				editor: {
					blocksByUid: {
						23: { uid: 23, name: 'core/heading' },
						123: { uid: 123, name: 'core/paragraph' },
					},
					blockOrder: [ 123, 23 ],
				},
			};

			expect( getPreviousBlock( state, 23 ) ).toEqual( { uid: 123, name: 'core/paragraph' } );
		} );

		it( 'should return null for the first block', () => {
			const state = {
				editor: {
					blocksByUid: {
						23: { uid: 23, name: 'core/heading' },
						123: { uid: 123, name: 'core/paragraph' },
					},
					blockOrder: [ 123, 23 ],
				},
			};

			expect( getPreviousBlock( state, 123 ) ).toBeNull();
		} );
	} );

	describe( 'getNextBlock', () => {
		it( 'should return the following block', () => {
			const state = {
				editor: {
					blocksByUid: {
						23: { uid: 23, name: 'core/heading' },
						123: { uid: 123, name: 'core/paragraph' },
					},
					blockOrder: [ 123, 23 ],
				},
			};

			expect( getNextBlock( state, 123 ) ).toEqual( { uid: 23, name: 'core/heading' } );
		} );

		it( 'should return null for the last block', () => {
			const state = {
				editor: {
					blocksByUid: {
						23: { uid: 23, name: 'core/heading' },
						123: { uid: 123, name: 'core/paragraph' },
					},
					blockOrder: [ 123, 23 ],
				},
			};

			expect( getNextBlock( state, 23 ) ).toBeNull();
		} );
	} );

	describe( 'isBlockSelected', () => {
		it( 'should return true if the block is selected', () => {
			const state = {
				blockSelection: { start: 123, end: 123 },
			};

			expect( isBlockSelected( state, 123 ) ).toBe( true );
		} );

		it( 'should return false if the block is not selected', () => {
			const state = {
				blockSelection: { start: null, end: null },
			};

			expect( isBlockSelected( state, 23 ) ).toBe( false );
		} );
	} );

	describe( 'isBlockMultiSelected', () => {
		const state = {
			editor: {
				blockOrder: [ 5, 4, 3, 2, 1 ],
			},
			blockSelection: { start: 2, end: 4 },
		};

		it( 'should return true if the block is multi selected', () => {
			expect( isBlockMultiSelected( state, 3 ) ).toBe( true );
		} );

		it( 'should return false if the block is not multi selected', () => {
			expect( isBlockMultiSelected( state, 5 ) ).toBe( false );
		} );
	} );

	describe( 'isFirstMultiSelectedBlock', () => {
		const state = {
			editor: {
				blockOrder: [ 5, 4, 3, 2, 1 ],
			},
			blockSelection: { start: 2, end: 4 },
		};

		it( 'should return true if the block is first in multi selection', () => {
			expect( isFirstMultiSelectedBlock( state, 4 ) ).toBe( true );
		} );

		it( 'should return false if the block is not first in multi selection', () => {
			expect( isFirstMultiSelectedBlock( state, 3 ) ).toBe( false );
		} );
	} );

	describe( 'isBlockHovered', () => {
		it( 'should return true if the block is hovered', () => {
			const state = {
				hoveredBlock: 123,
			};

			expect( isBlockHovered( state, 123 ) ).toBe( true );
		} );

		it( 'should return false if the block is not hovered', () => {
			const state = {
				hoveredBlock: 123,
			};

			expect( isBlockHovered( state, 23 ) ).toBe( false );
		} );
	} );

	describe( 'getBlockFocus', () => {
		it( 'should return the block focus if the block is selected', () => {
			const state = {
				blockSelection: {
					start: 123,
					end: 123,
					focus: { editable: 'cite' },
				},
			};

			expect( getBlockFocus( state, 123 ) ).toEqual( { editable: 'cite' } );
		} );

		it( 'should return the block focus for the start if the block is multi-selected', () => {
			const state = {
				blockSelection: {
					start: 123,
					end: 124,
					focus: { editable: 'cite' },
				},
			};

			expect( getBlockFocus( state, 123 ) ).toEqual( { editable: 'cite' } );
		} );

		it( 'should return null for the end if the block is multi-selected', () => {
			const state = {
				blockSelection: {
					start: 123,
					end: 124,
					focus: { editable: 'cite' },
				},
			};

			expect( getBlockFocus( state, 124 ) ).toEqual( null );
		} );

		it( 'should return null if the block is not selected', () => {
			const state = {
				blockSelection: {
					start: 123,
					end: 123,
					focus: { editable: 'cite' },
				},
			};

			expect( getBlockFocus( state, 23 ) ).toEqual( null );
		} );
	} );

	describe( 'geteBlockMode', () => {
		it( 'should return "visual" if unset', () => {
			const state = {
				blocksMode: {},
			};

			expect( getBlockMode( state, 123 ) ).toEqual( 'visual' );
		} );

		it( 'should return the block mode', () => {
			const state = {
				blocksMode: {
					123: 'html',
				},
			};

			expect( getBlockMode( state, 123 ) ).toEqual( 'html' );
		} );
	} );

	describe( 'isTyping', () => {
		it( 'should return the isTyping flag if the block is selected', () => {
			const state = {
				isTyping: true,
			};

			expect( isTyping( state ) ).toBe( true );
		} );

		it( 'should return false if the block is not selected', () => {
			const state = {
				isTyping: false,
			};

			expect( isTyping( state ) ).toBe( false );
		} );
	} );

	describe( 'getBlockInsertionPoint', () => {
		it( 'should return the uid of the selected block', () => {
			const state = {
				currentPost: {},
				preferences: { mode: 'visual' },
				blockSelection: {
					start: 2,
					end: 2,
				},
				editor: {
					blocksByUid: {
						2: { uid: 2 },
					},
					blockOrder: [ 1, 2, 3 ],
					edits: {},
				},
			};

			expect( getBlockInsertionPoint( state ) ).toBe( 2 );
		} );

		it( 'should return the last multi selected uid', () => {
			const state = {
				preferences: { mode: 'visual' },
				blockSelection: {
					start: 1,
					end: 2,
				},
				editor: {
					blockOrder: [ 1, 2, 3 ],
				},
			};

			expect( getBlockInsertionPoint( state ) ).toBe( 2 );
		} );

		it( 'should return the last block if no selection', () => {
			const state = {
				preferences: { mode: 'visual' },
				blockSelection: { start: null, end: null },
				editor: {
					blockOrder: [ 1, 2, 3 ],
				},
			};

			expect( getBlockInsertionPoint( state ) ).toBe( 3 );
		} );

		it( 'should return the last block for the text mode', () => {
			const state = {
				preferences: { mode: 'text' },
				blockSelection: { start: 2, end: 2 },
				editor: {
					blockOrder: [ 1, 2, 3 ],
				},
			};

			expect( getBlockInsertionPoint( state ) ).toBe( 3 );
		} );
	} );

	describe( 'isBlockInsertionPointVisible', () => {
		it( 'should return the value in state', () => {
			const state = {
				showInsertionPoint: true,
			};

			expect( isBlockInsertionPointVisible( state ) ).toBe( true );
		} );
	} );

	describe( 'isSavingPost', () => {
		it( 'should return true if the post is currently being saved', () => {
			const state = {
				saving: {
					requesting: true,
				},
			};

			expect( isSavingPost( state ) ).toBe( true );
		} );

		it( 'should return false if the post is currently being saved', () => {
			const state = {
				saving: {
					requesting: false,
				},
			};

			expect( isSavingPost( state ) ).toBe( false );
		} );
	} );

	describe( 'didPostSaveRequestSucceed', () => {
		it( 'should return true if the post save request is successful', () => {
			const state = {
				saving: {
					successful: true,
				},
			};

			expect( didPostSaveRequestSucceed( state ) ).toBe( true );
		} );

		it( 'should return true if the post save request has failed', () => {
			const state = {
				saving: {
					successful: false,
				},
			};

			expect( didPostSaveRequestSucceed( state ) ).toBe( false );
		} );
	} );

	describe( 'didPostSaveRequestFail', () => {
		it( 'should return true if the post save request has failed', () => {
			const state = {
				saving: {
					error: 'error',
				},
			};

			expect( didPostSaveRequestFail( state ) ).toBe( true );
		} );

		it( 'should return true if the post save request is successful', () => {
			const state = {
				saving: {
					error: false,
				},
			};

			expect( didPostSaveRequestFail( state ) ).toBe( false );
		} );
	} );

	describe( 'getSuggestedPostFormat', () => {
		it( 'returns null if cannot be determined', () => {
			const state = {
				editor: {
					blockOrder: [],
					blocksByUid: {},
				},
			};

			expect( getSuggestedPostFormat( state ) ).toBeNull();
		} );

		it( 'returns null if there is more than one block in the post', () => {
			const state = {
				editor: {
					blockOrder: [ 123, 456 ],
					blocksByUid: {
						123: { uid: 123, name: 'core/image' },
						456: { uid: 456, name: 'core/quote' },
					},
				},
			};

			expect( getSuggestedPostFormat( state ) ).toBeNull();
		} );

		it( 'returns Image if the first block is of type `core/image`', () => {
			const state = {
				editor: {
					blockOrder: [ 123 ],
					blocksByUid: {
						123: { uid: 123, name: 'core/image' },
					},
				},
			};

			expect( getSuggestedPostFormat( state ) ).toBe( 'image' );
		} );

		it( 'returns Quote if the first block is of type `core/quote`', () => {
			const state = {
				editor: {
					blockOrder: [ 456 ],
					blocksByUid: {
						456: { uid: 456, name: 'core/quote' },
					},
				},
			};

			expect( getSuggestedPostFormat( state ) ).toBe( 'quote' );
		} );
	} );

	describe( 'getNotices', () => {
		it( 'should return the notices array', () => {
			const state = {
				notices: {
					b: { id: 'b', content: 'Post saved' },
					a: { id: 'a', content: 'Error saving' },
				},
			};

			expect( getNotices( state ) ).toEqual( [
				state.notices.b,
				state.notices.a,
			] );
		} );
	} );

	describe( 'getMostFrequentlyUsedBlocks', () => {
		it( 'should have paragraph and image to bring frequently used blocks up to three blocks', () => {
			const noUsage = { preferences: { blockUsage: {} } };
			const someUsage = { preferences: { blockUsage: { 'core/paragraph': 1 } } };

			expect( getMostFrequentlyUsedBlocks( noUsage ).map( ( block ) => block.name ) )
				.toEqual( [ 'core/paragraph', 'core/image' ] );

			expect( getMostFrequentlyUsedBlocks( someUsage ).map( ( block ) => block.name ) )
				.toEqual( [ 'core/paragraph', 'core/image' ] );
		} );
		it( 'should return the top 3 most recently used blocks', () => {
			const state = {
				preferences: {
					blockUsage: {
						'core/paragraph': 4,
						'core/image': 11,
						'core/quote': 2,
						'core/gallery': 1,
					},
				},
			};

			expect( getMostFrequentlyUsedBlocks( state ).map( ( block ) => block.name ) )
				.toEqual( [ 'core/image', 'core/paragraph', 'core/quote' ] );
		} );
	} );
} );
