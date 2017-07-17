/**
 * External dependencies
 */
import moment from 'moment';

/**
 * Internal dependencies
 */
import {
	getEditorMode,
	isEditorSidebarOpened,
	hasEditorUndo,
	hasEditorRedo,
	isEditedPostNew,
	isEditedPostDirty,
	getCurrentPost,
	getCurrentPostId,
	getCurrentPostType,
	getPostEdits,
	getEditedPostTitle,
	getEditedPostExcerpt,
	getEditedPostVisibility,
	isEditedPostPublished,
	isEditedPostPublishable,
	isEditedPostSaveable,
	isEditedPostBeingScheduled,
	getEditedPostPreviewLink,
	getBlock,
	getBlocks,
	getBlockCount,
	getSelectedBlock,
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
	isTyping,
	getBlockInsertionPoint,
	isBlockInsertionPointVisible,
	isSavingPost,
	didPostSaveRequestSucceed,
	didPostSaveRequestFail,
	getSuggestedPostFormat,
	getNotices,
} from '../selectors';

describe( 'selectors', () => {
	describe( 'getEditorMode', () => {
		it( 'should return the selected editor mode', () => {
			const state = {
				mode: 'visual',
			};

			expect( getEditorMode( state ) ).toEqual( 'visual' );
		} );
	} );

	describe( 'isEditorSidebarOpened', () => {
		it( 'should return true when the sidebar is opened', () => {
			const state = {
				isSidebarOpened: true,
			};

			expect( isEditorSidebarOpened( state ) ).toBe( true );
		} );

		it( 'should return false when the sidebar is opened', () => {
			const state = {
				isSidebarOpened: false,
			};

			expect( isEditorSidebarOpened( state ) ).toBe( false );
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
				currentPost: {},
			};

			expect( isEditedPostNew( state ) ).toBe( true );
		} );

		it( 'should return false when the post has an ID', () => {
			const state = {
				currentPost: {
					id: 1,
				},
			};

			expect( isEditedPostNew( state ) ).toBe( false );
		} );
	} );

	describe( 'isEditedPostDirty', () => {
		it( 'should return true when the post is dirty', () => {
			const state = {
				editor: {
					dirty: true,
				},
			};

			expect( isEditedPostDirty( state ) ).toBe( true );
		} );

		it( 'should return false when the post is not dirty', () => {
			const state = {
				editor: {
					dirty: false,
				},
			};

			expect( isEditedPostDirty( state ) ).toBe( false );
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
					title: { raw: 'sassel' },
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
					title: { raw: 'sassel' },
				},
				editor: {
					edits: { title: 'youcha' },
				},
			};

			expect( getEditedPostTitle( state ) ).toBe( 'youcha' );
		} );
	} );

	describe( 'getEditedPostExcerpt', () => {
		it( 'should return the post saved excerpt if the excerpt is not edited', () => {
			const state = {
				currentPost: {
					excerpt: { raw: 'sassel' },
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
					excerpt: { raw: 'sassel' },
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

	describe( 'isEditedPostPublished', () => {
		it( 'should return true for public posts', () => {
			const state = {
				currentPost: {
					status: 'publish',
				},
			};

			expect( isEditedPostPublished( state ) ).toBe( true );
		} );

		it( 'should return true for private posts', () => {
			const state = {
				currentPost: {
					status: 'private',
				},
			};

			expect( isEditedPostPublished( state ) ).toBe( true );
		} );

		it( 'should return false for draft posts', () => {
			const state = {
				currentPost: {
					status: 'draft',
				},
			};

			expect( isEditedPostPublished( state ) ).toBe( false );
		} );

		it( 'should return true for old scheduled posts', () => {
			const state = {
				currentPost: {
					status: 'future',
					date: '2016-05-30T17:21:39',
				},
			};

			expect( isEditedPostPublished( state ) ).toBe( true );
		} );
	} );

	describe( 'isEditedPostPublishable', () => {
		it( 'should return true for pending posts', () => {
			const state = {
				currentPost: {
					status: 'pending',
				},
				editor: {
					dirty: false,
				},
			};

			expect( isEditedPostPublishable( state ) ).toBe( true );
		} );

		it( 'should return true for draft posts', () => {
			const state = {
				currentPost: {
					status: 'draft',
				},
				editor: {
					dirty: false,
				},
			};

			expect( isEditedPostPublishable( state ) ).toBe( true );
		} );

		it( 'should return false for published posts', () => {
			const state = {
				currentPost: {
					status: 'publish',
				},
				editor: {
					dirty: false,
				},
			};

			expect( isEditedPostPublishable( state ) ).toBe( false );
		} );

		it( 'should return false for private posts', () => {
			const state = {
				currentPost: {
					status: 'private',
				},
				editor: {
					dirty: false,
				},
			};

			expect( isEditedPostPublishable( state ) ).toBe( false );
		} );

		it( 'should return false for scheduled posts', () => {
			const state = {
				currentPost: {
					status: 'private',
				},
				editor: {
					dirty: false,
				},
			};

			expect( isEditedPostPublishable( state ) ).toBe( false );
		} );

		it( 'should return true for dirty posts', () => {
			const state = {
				currentPost: {
					status: 'private',
				},
				editor: {
					dirty: true,
				},
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
					title: { raw: 'sassel' },
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
					excerpt: { raw: 'sassel' },
				},
			};

			expect( isEditedPostSaveable( state ) ).toBe( true );
		} );

		it( 'should return true if the post has content', () => {
			const state = {
				editor: {
					blocksByUid: {
						123: { uid: 123, name: 'core/text' },
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
				editor: {
					blocksByUid: {
						123: { uid: 123, name: 'core/text' },
					},
				},
			};

			expect( getBlock( state, 123 ) ).toEqual( { uid: 123, name: 'core/text' } );
		} );
	} );

	describe( 'getBlocks', () => {
		it( 'should return the ordered blocks', () => {
			const state = {
				editor: {
					blocksByUid: {
						23: { uid: 23, name: 'core/heading' },
						123: { uid: 123, name: 'core/text' },
					},
					blockOrder: [ 123, 23 ],
				},
			};

			expect( getBlocks( state ) ).toEqual( [
				{ uid: 123, name: 'core/text' },
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
						123: { uid: 123, name: 'core/text' },
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
				editor: {
					blocksByUid: {
						23: { uid: 23, name: 'core/heading' },
						123: { uid: 123, name: 'core/text' },
					},
				},
				selectedBlock: { uid: null },
				multiSelectedBlocks: {},
			};

			expect( getSelectedBlock( state ) ).toBe( null );
		} );

		it( 'should return null if there is multi selection', () => {
			const state = {
				editor: {
					blocksByUid: {
						23: { uid: 23, name: 'core/heading' },
						123: { uid: 123, name: 'core/text' },
					},
				},
				selectedBlock: { uid: 23 },
				multiSelectedBlocks: { start: 23, end: 123 },
			};

			expect( getSelectedBlock( state ) ).toBe( null );
		} );

		it( 'should return the selected block', () => {
			const state = {
				editor: {
					blocksByUid: {
						23: { uid: 23, name: 'core/heading' },
						123: { uid: 123, name: 'core/text' },
					},
				},
				selectedBlock: { uid: 23 },
				multiSelectedBlocks: {},
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
				multiSelectedBlocks: { start: null, end: null },
			};

			expect( getMultiSelectedBlockUids( state ) ).toEqual( [] );
		} );

		it( 'should return selected block uids if there is multi selection', () => {
			const state = {
				editor: {
					blockOrder: [ 5, 4, 3, 2, 1 ],
				},
				multiSelectedBlocks: { start: 2, end: 4 },
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
				multiSelectedBlocks: { start: null, end: null },
			};

			expect( getMultiSelectedBlocksStartUid( state ) ).toBeNull();
		} );

		it( 'returns multi selection start', () => {
			const state = {
				editor: {
					blockOrder: [ 5, 4, 3, 2, 1 ],
				},
				multiSelectedBlocks: { start: 2, end: 4 },
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
				multiSelectedBlocks: { start: null, end: null },
			};

			expect( getMultiSelectedBlocksEndUid( state ) ).toBeNull();
		} );

		it( 'returns multi selection end', () => {
			const state = {
				editor: {
					blockOrder: [ 5, 4, 3, 2, 1 ],
				},
				multiSelectedBlocks: { start: 2, end: 4 },
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
						123: { uid: 123, name: 'core/text' },
					},
					blockOrder: [ 123, 23 ],
				},
			};

			expect( getPreviousBlock( state, 23 ) ).toEqual( { uid: 123, name: 'core/text' } );
		} );

		it( 'should return null for the first block', () => {
			const state = {
				editor: {
					blocksByUid: {
						23: { uid: 23, name: 'core/heading' },
						123: { uid: 123, name: 'core/text' },
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
						123: { uid: 123, name: 'core/text' },
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
						123: { uid: 123, name: 'core/text' },
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
				selectedBlock: { uid: 123 },
				multiSelectedBlocks: {},
			};

			expect( isBlockSelected( state, 123 ) ).toBe( true );
		} );

		it( 'should return false if the block is not selected', () => {
			const state = {
				selectedBlock: { uid: 123 },
				multiSelectedBlocks: {},
			};

			expect( isBlockSelected( state, 23 ) ).toBe( false );
		} );
	} );

	describe( 'isBlockMultiSelected', () => {
		const state = {
			editor: {
				blockOrder: [ 5, 4, 3, 2, 1 ],
			},
			multiSelectedBlocks: { start: 2, end: 4 },
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
			multiSelectedBlocks: { start: 2, end: 4 },
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
				selectedBlock: {
					uid: 123,
					focus: { editable: 'cite' },
				},
				multiSelectedBlocks: {},
			};

			expect( getBlockFocus( state, 123 ) ).toEqual( { editable: 'cite' } );
		} );

		it( 'should return null if the block is not selected', () => {
			const state = {
				selectedBlock: {
					uid: 123,
					focus: { editable: 'cite' },
				},
				multiSelectedBlocks: {},
			};

			expect( getBlockFocus( state, 23 ) ).toEqual( null );
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
				mode: 'visual',
				selectedBlock: {
					uid: 2,
				},
				multiSelectedBlocks: {},
				editor: {
					blocksByUid: {
						2: { uid: 2 },
					},
					blockOrder: [ 1, 2, 3 ],
				},
			};

			expect( getBlockInsertionPoint( state ) ).toBe( 2 );
		} );

		it( 'should return the last multi selected uid', () => {
			const state = {
				mode: 'visual',
				selectedBlock: {},
				multiSelectedBlocks: {
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
				mode: 'visual',
				selectedBlock: {},
				multiSelectedBlocks: {},
				editor: {
					blockOrder: [ 1, 2, 3 ],
				},
			};

			expect( getBlockInsertionPoint( state ) ).toBe( 3 );
		} );

		it( 'should return the last block for the text mode', () => {
			const state = {
				mode: 'text',
				selectedBlock: {
					uid: 2,
				},
				multiSelectedBlocks: {},
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

			expect( getSuggestedPostFormat( state ) ).toBe( 'Image' );
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

			expect( getSuggestedPostFormat( state ) ).toBe( 'Quote' );
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
} );
