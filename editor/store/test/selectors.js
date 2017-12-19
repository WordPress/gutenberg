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
	getCurrentPostLastRevisionId,
	getCurrentPostRevisionsCount,
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
	isMobile,
	getEditedPostPreviewLink,
	getBlock,
	getBlocks,
	getBlockCount,
	getSelectedBlock,
	getEditedPostContent,
	getMultiSelectedBlockUids,
	getMultiSelectedBlocks,
	getMultiSelectedBlocksStartUid,
	getMultiSelectedBlocksEndUid,
	getBlockUids,
	getBlockIndex,
	isFirstBlock,
	isLastBlock,
	getPreviousBlock,
	getNextBlock,
	isBlockSelected,
	isBlockWithinSelection,
	isBlockMultiSelected,
	isFirstMultiSelectedBlock,
	isBlockHovered,
	getBlockFocus,
	getBlockMode,
	isTyping,
	getBlockInsertionPoint,
	getBlockSiblingInserterPosition,
	isBlockInsertionPointVisible,
	isSavingPost,
	didPostSaveRequestSucceed,
	didPostSaveRequestFail,
	getSuggestedPostFormat,
	getNotices,
	getMostFrequentlyUsedBlocks,
	getRecentlyUsedBlocks,
	getMetaBoxes,
	getDirtyMetaBoxes,
	getMetaBox,
	isMetaBoxStateDirty,
	getReusableBlock,
	isSavingReusableBlock,
	isSelectionEnabled,
	getReusableBlocks,
	getStateBeforeOptimisticTransaction,
	isPublishingPost,
	POST_UPDATE_TRANSACTION_ID,
} from '../selectors';

jest.mock( '../constants', () => ( {
	BREAK_MEDIUM: 500,
} ) );

describe( 'selectors', () => {
	beforeAll( () => {
		registerBlockType( 'core/test-block', {
			save: ( props ) => props.attributes.text,
			category: 'common',
			title: 'test block',
		} );
	} );

	beforeEach( () => {
		getDirtyMetaBoxes.clear();
		getBlock.clear();
		getBlocks.clear();
		getEditedPostContent.clear();
		getMultiSelectedBlockUids.clear();
		getMultiSelectedBlocks.clear();
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

	describe( 'getDirtyMetaBoxes', () => {
		it( 'should return array of just the side location', () => {
			const state = {
				metaBoxes: {
					normal: {
						isActive: false,
						isDirty: false,
						isUpdating: false,
					},
					side: {
						isActive: true,
						isDirty: true,
						isUpdating: false,
					},
				},
			};

			expect( getDirtyMetaBoxes( state ) ).toEqual( [ 'side' ] );
		} );
	} );

	describe( 'getMetaBoxes', () => {
		it( 'should return the state of all meta boxes', () => {
			const state = {
				metaBoxes: {
					normal: {
						isDirty: false,
						isUpdating: false,
					},
					side: {
						isDirty: false,
						isUpdating: false,
					},
				},
			};

			expect( getMetaBoxes( state ) ).toEqual( {
				normal: {
					isDirty: false,
					isUpdating: false,
				},
				side: {
					isDirty: false,
					isUpdating: false,
				},
			} );
		} );
	} );

	describe( 'getMetaBox', () => {
		it( 'should return the state of selected meta box', () => {
			const state = {
				metaBoxes: {
					normal: {
						isActive: false,
						isDirty: false,
						isUpdating: false,
					},
					side: {
						isActive: true,
						isDirty: false,
						isUpdating: false,
					},
				},
			};

			expect( getMetaBox( state, 'side' ) ).toEqual( {
				isActive: true,
				isDirty: false,
				isUpdating: false,
			} );
		} );
	} );

	describe( 'isMetaBoxStateDirty', () => {
		it( 'should return false', () => {
			const state = {
				metaBoxes: {
					normal: {
						isActive: false,
						isDirty: false,
						isUpdating: false,
					},
					side: {
						isActive: false,
						isDirty: false,
						isUpdating: false,
					},
				},
			};

			expect( isMetaBoxStateDirty( state ) ).toEqual( false );
		} );

		it( 'should return false when a dirty meta box is not active.', () => {
			const state = {
				metaBoxes: {
					normal: {
						isActive: false,
						isDirty: true,
						isUpdating: false,
					},
					side: {
						isActive: false,
						isDirty: false,
						isUpdating: false,
					},
				},
			};

			expect( isMetaBoxStateDirty( state ) ).toEqual( false );
		} );

		it( 'should return false when both meta boxes are dirty but inactive.', () => {
			const state = {
				metaBoxes: {
					normal: {
						isActive: false,
						isDirty: true,
						isUpdating: false,
					},
					side: {
						isActive: false,
						isDirty: true,
						isUpdating: false,
					},
				},
			};

			expect( isMetaBoxStateDirty( state ) ).toEqual( false );
		} );

		it( 'should return false when a dirty meta box is active.', () => {
			const state = {
				metaBoxes: {
					normal: {
						isActive: true,
						isDirty: true,
						isUpdating: false,
					},
					side: {
						isActive: false,
						isDirty: false,
						isUpdating: false,
					},
				},
			};

			expect( isMetaBoxStateDirty( state ) ).toEqual( true );
		} );

		it( 'should return false when both meta boxes are dirty and active.', () => {
			const state = {
				metaBoxes: {
					normal: {
						isActive: true,
						isDirty: true,
						isUpdating: false,
					},
					side: {
						isActive: true,
						isDirty: true,
						isUpdating: false,
					},
				},
			};

			expect( isMetaBoxStateDirty( state ) ).toEqual( true );
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
		it( 'should return true when is not mobile and the normal sidebar is opened', () => {
			const state = {
				browser: {
					width: 1000,
				},
				preferences: {
					isSidebarOpened: true,
					isSidebarOpenedMobile: false,
				},
			};

			expect( isEditorSidebarOpened( state ) ).toBe( true );
		} );

		it( 'should return false when is not mobile and the normal sidebar is closed', () => {
			const state = {
				browser: {
					width: 1000,
				},
				preferences: {
					isSidebarOpened: false,
				},
			};

			expect( isEditorSidebarOpened( state ) ).toBe( false );
		} );

		it( 'should return true when is mobile and the mobile sidebar is opened', () => {
			const state = {
				browser: {
					width: 100,
				},
				preferences: {
					isSidebarOpened: false,
					isSidebarOpenedMobile: true,
				},
			};

			expect( isEditorSidebarOpened( state ) ).toBe( true );
		} );

		it( 'should return false when is mobile and the mobile sidebar is closed', () => {
			const state = {
				browser: {
					width: 100,
				},
				preferences: {
					isSidebarOpened: true,
					isSidebarOpenedMobile: false,
				},
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
					past: [
						{},
					],
				},
			};

			expect( hasEditorUndo( state ) ).toBe( true );
		} );

		it( 'should return false when the past history is empty', () => {
			const state = {
				editor: {
					past: [],
				},
			};

			expect( hasEditorUndo( state ) ).toBe( false );
		} );
	} );

	describe( 'hasEditorRedo', () => {
		it( 'should return true when the future history is not empty', () => {
			const state = {
				editor: {
					future: [
						{},
					],
				},
			};

			expect( hasEditorRedo( state ) ).toBe( true );
		} );

		it( 'should return false when the future history is empty', () => {
			const state = {
				editor: {
					future: [],
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
					present: {
						edits: {},
					},
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
					present: {
						edits: {},
					},
				},
			};

			expect( isEditedPostNew( state ) ).toBe( false );
		} );
	} );

	describe( 'isEditedPostDirty', () => {
		const metaBoxes = {
			normal: {
				isActive: false,
				isDirty: false,
				isUpdating: false,
			},
			side: {
				isActive: false,
				isDirty: false,
				isUpdating: false,
			},
		};
		// Those dirty dang meta boxes.
		const dirtyMetaBoxes = {
			normal: {
				isActive: true,
				isDirty: true,
				isUpdating: false,
			},
			side: {
				isActive: false,
				isDirty: false,
				isUpdating: false,
			},
		};

		it( 'should return true when post saved state dirty', () => {
			const state = {
				editor: {
					isDirty: true,
				},
				metaBoxes,
			};

			expect( isEditedPostDirty( state ) ).toBe( true );
		} );

		it( 'should return false when post saved state not dirty', () => {
			const state = {
				editor: {
					isDirty: false,
				},
				metaBoxes,
			};

			expect( isEditedPostDirty( state ) ).toBe( false );
		} );

		it( 'should return true when post saved state not dirty, but meta box state has changed.', () => {
			const state = {
				editor: {
					isDirty: false,
				},
				metaBoxes: dirtyMetaBoxes,
			};

			expect( isEditedPostDirty( state ) ).toBe( true );
		} );
	} );

	describe( 'isCleanNewPost', () => {
		const metaBoxes = { isDirty: false, isUpdating: false };

		it( 'should return true when the post is not dirty and has not been saved before', () => {
			const state = {
				editor: {
					isDirty: false,
				},
				currentPost: {
					id: 1,
					status: 'auto-draft',
				},
				metaBoxes,
			};

			expect( isCleanNewPost( state ) ).toBe( true );
		} );

		it( 'should return false when the post is not dirty but the post has been saved', () => {
			const state = {
				editor: {
					isDirty: false,
				},
				currentPost: {
					id: 1,
					status: 'draft',
				},
				metaBoxes,
			};

			expect( isCleanNewPost( state ) ).toBe( false );
		} );

		it( 'should return false when the post is dirty but the post has not been saved', () => {
			const state = {
				editor: {
					isDirty: true,
				},
				currentPost: {
					id: 1,
					status: 'auto-draft',
				},
				metaBoxes,
			};

			expect( isCleanNewPost( state ) ).toBe( false );
		} );
	} );

	describe( 'isMobile', () => {
		it( 'should return true if resolution is equal or less than medium breakpoint', () => {
			const state = {
				browser: {
					width: 100,
				},
			};

			expect( isMobile( state ) ).toBe( true );
		} );

		it( 'should return true if resolution is greater than medium breakpoint', () => {
			const state = {
				browser: {
					width: 1000,
				},
			};

			expect( isMobile( state ) ).toBe( false );
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

	describe( 'getCurrentPostLastRevisionId', () => {
		it( 'should return null if the post has not yet been saved', () => {
			const state = {
				currentPost: {},
			};

			expect( getCurrentPostLastRevisionId( state ) ).toBeNull();
		} );

		it( 'should return the last revision ID', () => {
			const state = {
				currentPost: {
					revisions: {
						last_id: 123,
					},
				},
			};

			expect( getCurrentPostLastRevisionId( state ) ).toBe( 123 );
		} );
	} );

	describe( 'getCurrentPostRevisionsCount', () => {
		it( 'should return 0 if the post has no revisions', () => {
			const state = {
				currentPost: {},
			};

			expect( getCurrentPostRevisionsCount( state ) ).toBe( 0 );
		} );

		it( 'should return the number of revisions', () => {
			const state = {
				currentPost: {
					revisions: {
						count: 5,
					},
				},
			};

			expect( getCurrentPostRevisionsCount( state ) ).toBe( 5 );
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
					present: {
						edits: { title: 'terga' },
					},
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
					present: {
						edits: { status: 'private' },
					},
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
					present: {
						edits: { title: 'youcha' },
					},
				},
			};

			expect( getEditedPostTitle( state ) ).toBe( 'youcha' );
		} );
	} );

	describe( 'getDocumentTitle', () => {
		const metaBoxes = { isDirty: false, isUpdating: false };
		it( 'should return current title unedited existing post', () => {
			const state = {
				currentPost: {
					id: 123,
					title: 'The Title',
				},
				editor: {
					present: {
						edits: {},
						blocksByUid: {},
						blockOrder: [],
					},
					isDirty: false,
				},
				metaBoxes,
			};

			expect( getDocumentTitle( state ) ).toBe( 'The Title' );
		} );

		it( 'should return current title for edited existing post', () => {
			const state = {
				currentPost: {
					id: 123,
					title: 'The Title',
				},
				editor: {
					present: {
						edits: {
							title: 'Modified Title',
						},
					},
				},
				metaBoxes,
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
				editor: {
					present: {
						edits: {},
						blocksByUid: {},
						blockOrder: [],
					},
					isDirty: false,
				},
				metaBoxes,
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
				editor: {
					present: {
						edits: {},
						blocksByUid: {},
						blockOrder: [],
					},
					isDirty: true,
				},
				metaBoxes,
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
					present: {
						edits: { status: 'private' },
					},
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
					present: {
						edits: { excerpt: 'youcha' },
					},
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
					present: {
						edits: {},
					},
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
					present: {
						edits: {},
					},
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
					present: {
						edits: {},
					},
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
					present: {
						edits: {
							status: 'private',
							password: null,
						},
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
		const metaBoxes = { isDirty: false, isUpdating: false };

		it( 'should return true for pending posts', () => {
			const state = {
				editor: {
					isDirty: false,
				},
				currentPost: {
					status: 'pending',
				},
				metaBoxes,
			};

			expect( isEditedPostPublishable( state ) ).toBe( true );
		} );

		it( 'should return true for draft posts', () => {
			const state = {
				editor: {
					isDirty: false,
				},
				currentPost: {
					status: 'draft',
				},
				metaBoxes,
			};

			expect( isEditedPostPublishable( state ) ).toBe( true );
		} );

		it( 'should return false for published posts', () => {
			const state = {
				editor: {
					isDirty: false,
				},
				currentPost: {
					status: 'publish',
				},
				metaBoxes,
			};

			expect( isEditedPostPublishable( state ) ).toBe( false );
		} );

		it( 'should return true for published, dirty posts', () => {
			const state = {
				editor: {
					isDirty: true,
				},
				currentPost: {
					status: 'publish',
				},
				metaBoxes,
			};

			expect( isEditedPostPublishable( state ) ).toBe( true );
		} );

		it( 'should return false for private posts', () => {
			const state = {
				editor: {
					isDirty: false,
				},
				currentPost: {
					status: 'private',
				},
				metaBoxes,
			};

			expect( isEditedPostPublishable( state ) ).toBe( false );
		} );

		it( 'should return false for scheduled posts', () => {
			const state = {
				editor: {
					isDirty: false,
				},
				currentPost: {
					status: 'future',
				},
				metaBoxes,
			};

			expect( isEditedPostPublishable( state ) ).toBe( false );
		} );

		it( 'should return true for dirty posts with usable title', () => {
			const state = {
				currentPost: {
					status: 'private',
				},
				editor: {
					isDirty: true,
				},
				metaBoxes,
			};

			expect( isEditedPostPublishable( state ) ).toBe( true );
		} );
	} );

	describe( 'isEditedPostSaveable', () => {
		it( 'should return false if the post has no title, excerpt, content', () => {
			const state = {
				editor: {
					present: {
						blocksByUid: {},
						blockOrder: [],
						edits: {},
					},
				},
				currentPost: {},
			};

			expect( isEditedPostSaveable( state ) ).toBe( false );
		} );

		it( 'should return true if the post has a title', () => {
			const state = {
				editor: {
					present: {
						blocksByUid: {},
						blockOrder: [],
						edits: {},
					},
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
					present: {
						blocksByUid: {},
						blockOrder: [],
						edits: {},
					},
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
					present: {
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
					present: {
						edits: { date: moment().add( 7, 'days' ).format( '' ) },
					},
				},
			};

			expect( isEditedPostBeingScheduled( state ) ).toBe( true );
		} );

		it( 'should return false for posts with an old date', () => {
			const state = {
				editor: {
					present: {
						edits: { date: '2016-05-30T17:21:39' },
					},
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
					present: {
						blocksByUid: {
							123: { uid: 123, name: 'core/paragraph' },
						},
						edits: {},
					},
				},
			};

			expect( getBlock( state, 123 ) ).toEqual( { uid: 123, name: 'core/paragraph' } );
		} );

		it( 'should return null if the block is not present in state', () => {
			const state = {
				currentPost: {},
				editor: {
					present: {
						blocksByUid: {},
						edits: {},
					},
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
						source: 'meta',
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
					present: {
						blocksByUid: {
							123: { uid: 123, name: 'core/meta-block' },
						},
						edits: {},
					},
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
					present: {
						blocksByUid: {
							23: { uid: 23, name: 'core/heading' },
							123: { uid: 123, name: 'core/paragraph' },
						},
						blockOrder: [ 123, 23 ],
						edits: {},
					},
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
					present: {
						blocksByUid: {
							23: { uid: 23, name: 'core/heading' },
							123: { uid: 123, name: 'core/paragraph' },
						},
						blockOrder: [ 123, 23 ],
					},
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
					present: {
						blocksByUid: {
							23: { uid: 23, name: 'core/heading' },
							123: { uid: 123, name: 'core/paragraph' },
						},
						edits: {},
					},
				},
				blockSelection: { start: null, end: null },
			};

			expect( getSelectedBlock( state ) ).toBe( null );
		} );

		it( 'should return null if there is multi selection', () => {
			const state = {
				editor: {
					present: {
						blocksByUid: {
							23: { uid: 23, name: 'core/heading' },
							123: { uid: 123, name: 'core/paragraph' },
						},
					},
				},
				blockSelection: { start: 23, end: 123 },
			};

			expect( getSelectedBlock( state ) ).toBe( null );
		} );

		it( 'should return the selected block', () => {
			const state = {
				editor: {
					present: {
						blocksByUid: {
							23: { uid: 23, name: 'core/heading' },
							123: { uid: 123, name: 'core/paragraph' },
						},
					},
				},
				blockSelection: { start: 23, end: 23 },
			};

			expect( getSelectedBlock( state ) ).toBe( state.editor.present.blocksByUid[ 23 ] );
		} );
	} );

	describe( 'getMultiSelectedBlockUids', () => {
		it( 'should return empty if there is no multi selection', () => {
			const state = {
				editor: {
					present: {
						blockOrder: [ 123, 23 ],
					},
				},
				blockSelection: { start: null, end: null },
			};

			expect( getMultiSelectedBlockUids( state ) ).toEqual( [] );
		} );

		it( 'should return selected block uids if there is multi selection', () => {
			const state = {
				editor: {
					present: {
						blockOrder: [ 5, 4, 3, 2, 1 ],
					},
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
					present: {
						blockOrder: [ 123, 23 ],
					},
				},
				blockSelection: { start: null, end: null },
			};

			expect( getMultiSelectedBlocksStartUid( state ) ).toBeNull();
		} );

		it( 'returns multi selection start', () => {
			const state = {
				editor: {
					present: {
						blockOrder: [ 5, 4, 3, 2, 1 ],
					},
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
					present: {
						blockOrder: [ 123, 23 ],
					},
				},
				blockSelection: { start: null, end: null },
			};

			expect( getMultiSelectedBlocksEndUid( state ) ).toBeNull();
		} );

		it( 'returns multi selection end', () => {
			const state = {
				editor: {
					present: {
						blockOrder: [ 5, 4, 3, 2, 1 ],
					},
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
					present: {
						blockOrder: [ 123, 23 ],
					},
				},
			};

			expect( getBlockUids( state ) ).toEqual( [ 123, 23 ] );
		} );
	} );

	describe( 'getBlockIndex', () => {
		it( 'should return the block order', () => {
			const state = {
				editor: {
					present: {
						blockOrder: [ 123, 23 ],
					},
				},
			};

			expect( getBlockIndex( state, 23 ) ).toBe( 1 );
		} );
	} );

	describe( 'isFirstBlock', () => {
		it( 'should return true when the block is first', () => {
			const state = {
				editor: {
					present: {
						blockOrder: [ 123, 23 ],
					},
				},
			};

			expect( isFirstBlock( state, 123 ) ).toBe( true );
		} );

		it( 'should return false when the block is not first', () => {
			const state = {
				editor: {
					present: {
						blockOrder: [ 123, 23 ],
					},
				},
			};

			expect( isFirstBlock( state, 23 ) ).toBe( false );
		} );
	} );

	describe( 'isLastBlock', () => {
		it( 'should return true when the block is last', () => {
			const state = {
				editor: {
					present: {
						blockOrder: [ 123, 23 ],
					},
				},
			};

			expect( isLastBlock( state, 23 ) ).toBe( true );
		} );

		it( 'should return false when the block is not last', () => {
			const state = {
				editor: {
					present: {
						blockOrder: [ 123, 23 ],
					},
				},
			};

			expect( isLastBlock( state, 123 ) ).toBe( false );
		} );
	} );

	describe( 'getPreviousBlock', () => {
		it( 'should return the previous block', () => {
			const state = {
				editor: {
					present: {
						blocksByUid: {
							23: { uid: 23, name: 'core/heading' },
							123: { uid: 123, name: 'core/paragraph' },
						},
						blockOrder: [ 123, 23 ],
					},
				},
			};

			expect( getPreviousBlock( state, 23 ) ).toEqual( { uid: 123, name: 'core/paragraph' } );
		} );

		it( 'should return null for the first block', () => {
			const state = {
				editor: {
					present: {
						blocksByUid: {
							23: { uid: 23, name: 'core/heading' },
							123: { uid: 123, name: 'core/paragraph' },
						},
						blockOrder: [ 123, 23 ],
					},
				},
			};

			expect( getPreviousBlock( state, 123 ) ).toBeNull();
		} );
	} );

	describe( 'getNextBlock', () => {
		it( 'should return the following block', () => {
			const state = {
				editor: {
					present: {
						blocksByUid: {
							23: { uid: 23, name: 'core/heading' },
							123: { uid: 123, name: 'core/paragraph' },
						},
						blockOrder: [ 123, 23 ],
					},
				},
			};

			expect( getNextBlock( state, 123 ) ).toEqual( { uid: 23, name: 'core/heading' } );
		} );

		it( 'should return null for the last block', () => {
			const state = {
				editor: {
					present: {
						blocksByUid: {
							23: { uid: 23, name: 'core/heading' },
							123: { uid: 123, name: 'core/paragraph' },
						},
						blockOrder: [ 123, 23 ],
					},
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

		it( 'should return false if a multi-selection range exists', () => {
			const state = {
				blockSelection: { start: 123, end: 124 },
			};

			expect( isBlockSelected( state, 123 ) ).toBe( false );
		} );

		it( 'should return false if the block is not selected', () => {
			const state = {
				blockSelection: { start: null, end: null },
			};

			expect( isBlockSelected( state, 23 ) ).toBe( false );
		} );
	} );

	describe( 'isBlockWithinSelection', () => {
		it( 'should return true if the block is selected but not the last', () => {
			const state = {
				blockSelection: { start: 5, end: 3 },
				editor: {
					present: {
						blockOrder: [ 5, 4, 3, 2, 1 ],
					},
				},
			};

			expect( isBlockWithinSelection( state, 4 ) ).toBe( true );
		} );

		it( 'should return false if the block is the last selected', () => {
			const state = {
				blockSelection: { start: 5, end: 3 },
				editor: {
					present: {
						blockOrder: [ 5, 4, 3, 2, 1 ],
					},
				},
			};

			expect( isBlockWithinSelection( state, 3 ) ).toBe( false );
		} );

		it( 'should return false if the block is not selected', () => {
			const state = {
				blockSelection: { start: 5, end: 3 },
				editor: {
					present: {
						blockOrder: [ 5, 4, 3, 2, 1 ],
					},
				},
			};

			expect( isBlockWithinSelection( state, 2 ) ).toBe( false );
		} );

		it( 'should return false if there is no selection', () => {
			const state = {
				blockSelection: {},
				editor: {
					present: {
						blockOrder: [ 5, 4, 3, 2, 1 ],
					},
				},
			};

			expect( isBlockWithinSelection( state, 4 ) ).toBe( false );
		} );
	} );

	describe( 'isBlockMultiSelected', () => {
		const state = {
			editor: {
				present: {
					blockOrder: [ 5, 4, 3, 2, 1 ],
				},
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
				present: {
					blockOrder: [ 5, 4, 3, 2, 1 ],
				},
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

	describe( 'isSelectionEnabled', () => {
		it( 'should return true if selection is enable', () => {
			const state = {
				blockSelection: {
					isEnabled: true,
				},
			};

			expect( isSelectionEnabled( state ) ).toBe( true );
		} );

		it( 'should return false if selection is disabled', () => {
			const state = {
				blockSelection: {
					isEnabled: false,
				},
			};

			expect( isSelectionEnabled( state ) ).toBe( false );
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
					present: {
						blocksByUid: {
							2: { uid: 2 },
						},
						blockOrder: [ 1, 2, 3 ],
						edits: {},
					},
				},
				blockInsertionPoint: {},
			};

			expect( getBlockInsertionPoint( state ) ).toBe( 2 );
		} );

		it( 'should return the assigned insertion point', () => {
			const state = {
				preferences: { mode: 'visual' },
				blockSelection: {},
				editor: {
					present: {
						blockOrder: [ 1, 2, 3 ],
					},
				},
				blockInsertionPoint: {
					position: 2,
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
					present: {
						blockOrder: [ 1, 2, 3 ],
					},
				},
				blockInsertionPoint: {},
			};

			expect( getBlockInsertionPoint( state ) ).toBe( 2 );
		} );

		it( 'should return the last block if no selection', () => {
			const state = {
				preferences: { mode: 'visual' },
				blockSelection: { start: null, end: null },
				editor: {
					present: {
						blockOrder: [ 1, 2, 3 ],
					},
				},
				blockInsertionPoint: {},
			};

			expect( getBlockInsertionPoint( state ) ).toBe( 3 );
		} );

		it( 'should return the last block for the text mode', () => {
			const state = {
				preferences: { mode: 'text' },
				blockSelection: { start: 2, end: 2 },
				editor: {
					present: {
						blockOrder: [ 1, 2, 3 ],
					},
				},
				blockInsertionPoint: {},
			};

			expect( getBlockInsertionPoint( state ) ).toBe( 3 );
		} );
	} );

	describe( 'getBlockSiblingInserterPosition', () => {
		it( 'should return null if no sibling insertion point', () => {
			const state = {
				blockInsertionPoint: {},
			};

			expect( getBlockSiblingInserterPosition( state ) ).toBe( null );
		} );

		it( 'should return sibling insertion point', () => {
			const state = {
				blockInsertionPoint: {
					position: 5,
				},
			};

			expect( getBlockSiblingInserterPosition( state ) ).toBe( 5 );
		} );
	} );

	describe( 'isBlockInsertionPointVisible', () => {
		it( 'should return the value in state', () => {
			const state = {
				blockInsertionPoint: {
					visible: true,
				},
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
					present: {
						blockOrder: [],
						blocksByUid: {},
					},
				},
			};

			expect( getSuggestedPostFormat( state ) ).toBeNull();
		} );

		it( 'returns null if there is more than one block in the post', () => {
			const state = {
				editor: {
					present: {
						blockOrder: [ 123, 456 ],
						blocksByUid: {
							123: { uid: 123, name: 'core/image' },
							456: { uid: 456, name: 'core/quote' },
						},
					},
				},
			};

			expect( getSuggestedPostFormat( state ) ).toBeNull();
		} );

		it( 'returns Image if the first block is of type `core/image`', () => {
			const state = {
				editor: {
					present: {
						blockOrder: [ 123 ],
						blocksByUid: {
							123: { uid: 123, name: 'core/image' },
						},
					},
				},
			};

			expect( getSuggestedPostFormat( state ) ).toBe( 'image' );
		} );

		it( 'returns Quote if the first block is of type `core/quote`', () => {
			const state = {
				editor: {
					present: {
						blockOrder: [ 456 ],
						blocksByUid: {
							456: { uid: 456, name: 'core/quote' },
						},
					},
				},
			};

			expect( getSuggestedPostFormat( state ) ).toBe( 'quote' );
		} );

		it( 'returns Video if the first block is of type `core-embed/youtube`', () => {
			const state = {
				editor: {
					present: {
						blockOrder: [ 567 ],
						blocksByUid: {
							567: { uid: 567, name: 'core-embed/youtube' },
						},
					},
				},
			};

			expect( getSuggestedPostFormat( state ) ).toBe( 'video' );
		} );

		it( 'returns Quote if the first block is of type `core/quote` and second is of type `core/paragraph`', () => {
			const state = {
				editor: {
					present: {
						blockOrder: [ 456, 789 ],
						blocksByUid: {
							456: { uid: 456, name: 'core/quote' },
							789: { uid: 789, name: 'core/paragraph' },
						},
					},
				},
			};

			expect( getSuggestedPostFormat( state ) ).toBe( 'quote' );
		} );
	} );

	describe( 'getNotices', () => {
		it( 'should return the notices array', () => {
			const state = {
				notices: [
					{ id: 'b', content: 'Post saved' },
					{ id: 'a', content: 'Error saving' },
				],
			};

			expect( getNotices( state ) ).toEqual( state.notices );
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
						'core/deleted-block': 20,
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

	describe( 'getRecentlyUsedBlocks', () => {
		it( 'should return the most recently used blocks', () => {
			const state = {
				preferences: {
					recentlyUsedBlocks: [ 'core/deleted-block', 'core/paragraph', 'core/image' ],
				},
			};

			expect( getRecentlyUsedBlocks( state ).map( ( block ) => block.name ) )
				.toEqual( [ 'core/paragraph', 'core/image' ] );
		} );
	} );

	describe( 'getReusableBlock', () => {
		it( 'should return a reusable block', () => {
			const id = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
			const expectedReusableBlock = {
				id,
				name: 'My cool block',
				type: 'core/paragraph',
				attributes: {
					content: 'Hello!',
				},
			};
			const state = {
				reusableBlocks: {
					data: {
						[ id ]: expectedReusableBlock,
					},
				},
			};

			const actualReusableBlock = getReusableBlock( state, id );
			expect( actualReusableBlock ).toEqual( expectedReusableBlock );
		} );

		it( 'should return null when no reusable block exists', () => {
			const state = {
				reusableBlocks: {
					data: {},
				},
			};

			const reusableBlock = getReusableBlock( state, '358b59ee-bab3-4d6f-8445-e8c6971a5605' );
			expect( reusableBlock ).toBeNull();
		} );
	} );

	describe( 'isSavingReusableBlock', () => {
		it( 'should return false when the block is not being saved', () => {
			const state = {
				reusableBlocks: {
					isSaving: {},
				},
			};

			const isSaving = isSavingReusableBlock( state, '358b59ee-bab3-4d6f-8445-e8c6971a5605' );
			expect( isSaving ).toBe( false );
		} );

		it( 'should return true when the block is being saved', () => {
			const id = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
			const state = {
				reusableBlocks: {
					isSaving: {
						[ id ]: true,
					},
				},
			};

			const isSaving = isSavingReusableBlock( state, id );
			expect( isSaving ).toBe( true );
		} );
	} );

	describe( 'getReusableBlocks', () => {
		it( 'should return an array of reusable blocks', () => {
			const reusableBlock1 = {
				id: '358b59ee-bab3-4d6f-8445-e8c6971a5605',
				name: 'My cool block',
				type: 'core/paragraph',
				attributes: {
					content: 'Hello!',
				},
			};
			const reusableBlock2 = {
				id: '687e1a87-cca1-41f2-a782-197ddaea9abf',
				name: 'My neat block',
				type: 'core/paragraph',
				attributes: {
					content: 'Goodbye!',
				},
			};
			const state = {
				reusableBlocks: {
					data: {
						[ reusableBlock1.id ]: reusableBlock1,
						[ reusableBlock2.id ]: reusableBlock2,
					},
				},
			};

			const reusableBlocks = getReusableBlocks( state );
			expect( reusableBlocks ).toEqual( [ reusableBlock1, reusableBlock2 ] );
		} );

		it( 'should return an empty array when no reusable blocks exist', () => {
			const state = {
				reusableBlocks: {
					data: {},
				},
			};

			const reusableBlocks = getReusableBlocks( state );
			expect( reusableBlocks ).toEqual( [] );
		} );
	} );

	describe( 'getStateBeforeOptimisticTransaction', () => {
		it( 'should return null if no transaction can be found', () => {
			const beforeState = getStateBeforeOptimisticTransaction( {
				optimist: [],
			}, 'foo' );

			expect( beforeState ).toBe( null );
		} );

		it( 'should return null if a transaction with ID can be found, but lacks before state', () => {
			const beforeState = getStateBeforeOptimisticTransaction( {
				optimist: [
					{
						action: {
							optimist: {
								id: 'foo',
							},
						},
					},
				],
			}, 'foo' );

			expect( beforeState ).toBe( null );
		} );

		it( 'should return the before state matching the given transaction id', () => {
			const expectedBeforeState = {};
			const beforeState = getStateBeforeOptimisticTransaction( {
				optimist: [
					{
						beforeState: expectedBeforeState,
						action: {
							optimist: {
								id: 'foo',
							},
						},
					},
				],
			}, 'foo' );

			expect( beforeState ).toBe( expectedBeforeState );
		} );
	} );

	describe( 'isPublishingPost', () => {
		it( 'should return false if the post is not being saved', () => {
			const isPublishing = isPublishingPost( {
				optimist: [],
				saving: {
					requesting: false,
				},
				editor: {
					edits: {},
				},
				currentPost: {
					status: 'publish',
				},
			} );

			expect( isPublishing ).toBe( false );
		} );

		it( 'should return false if the current post is not considered published', () => {
			const isPublishing = isPublishingPost( {
				optimist: [],
				saving: {
					requesting: true,
				},
				editor: {
					edits: {},
				},
				currentPost: {
					status: 'draft',
				},
			} );

			expect( isPublishing ).toBe( false );
		} );

		it( 'should return false if the optimistic transaction cannot be found', () => {
			const isPublishing = isPublishingPost( {
				optimist: [],
				saving: {
					requesting: true,
				},
				editor: {
					edits: {},
				},
				currentPost: {
					status: 'publish',
				},
			} );

			expect( isPublishing ).toBe( false );
		} );

		it( 'should return false if the current post prior to request was already published', () => {
			const isPublishing = isPublishingPost( {
				optimist: [
					{
						beforeState: {
							saving: {
								requesting: false,
							},
							editor: {
								edits: {},
							},
							currentPost: {
								status: 'publish',
							},
						},
						action: {
							optimist: {
								id: POST_UPDATE_TRANSACTION_ID,
							},
						},
					},
				],
				saving: {
					requesting: true,
				},
				editor: {
					edits: {},
				},
				currentPost: {
					status: 'publish',
				},
			} );

			expect( isPublishing ).toBe( false );
		} );

		it( 'should return true if the current post prior to request was not published', () => {
			const isPublishing = isPublishingPost( {
				optimist: [
					{
						beforeState: {
							saving: {
								requesting: false,
							},
							editor: {
								edits: {
									status: 'publish',
								},
							},
							currentPost: {
								status: 'draft',
							},
						},
						action: {
							optimist: {
								id: POST_UPDATE_TRANSACTION_ID,
							},
						},
					},
				],
				saving: {
					requesting: true,
				},
				editor: {
					edits: {},
				},
				currentPost: {
					status: 'publish',
				},
			} );

			expect( isPublishing ).toBe( true );
		} );
	} );
} );
