/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import {
	getEditorMode,
	isEditorSidebarOpened,
	hasEditorUndo,
	hasEditorRedo,
	isEditedPostDirty,
	getCurrentPost,
	getPostEdits,
	getEditedPostTitle,
	getEditedPostPreviewLink,
	getBlock,
	getBlocks,
	getBlockUids,
	getBlockOrder,
	isFirstBlock,
	isLastBlock,
	getPreviousBlock,
	isBlockSelected,
	isBlockHovered,
	getBlockFocus,
	isTypingInBlock,
	isSavingPost,
	didPostSaveRequestSucceed,
	didPostSaveRequestFail,
	isSavingNewPost,
} from '../selectors';

describe( 'selectors', () => {
	describe( 'getEditorMode', () => {
		it( 'should return the selected editor mode', () => {
			const state = {
				mode: 'visual',
			};

			expect( getEditorMode( state ) ).to.eql( 'visual' );
		} );
	} );

	describe( 'isEditorSidebarOpened', () => {
		it( 'should return true when the sidebar is opened', () => {
			const state = {
				isSidebarOpened: true,
			};

			expect( isEditorSidebarOpened( state ) ).to.be.true();
		} );

		it( 'should return false when the sidebar is opened', () => {
			const state = {
				isSidebarOpened: false,
			};

			expect( isEditorSidebarOpened( state ) ).to.be.false();
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

			expect( hasEditorUndo( state ) ).to.be.true();
		} );

		it( 'should return false when the past history is empty', () => {
			const state = {
				editor: {
					history: {
						past: [],
					},
				},
			};

			expect( hasEditorUndo( state ) ).to.be.false();
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

			expect( hasEditorRedo( state ) ).to.be.true();
		} );

		it( 'should return false when the future history is empty', () => {
			const state = {
				editor: {
					history: {
						future: [],
					},
				},
			};

			expect( hasEditorRedo( state ) ).to.be.false();
		} );
	} );

	describe( 'isEditedPostDirty', () => {
		it( 'should return true when the post is dirty', () => {
			const state = {
				editor: {
					dirty: true,
				},
			};

			expect( isEditedPostDirty( state ) ).to.be.true();
		} );

		it( 'should return false when the post is not dirty', () => {
			const state = {
				editor: {
					dirty: false,
				},
			};

			expect( isEditedPostDirty( state ) ).to.be.false();
		} );
	} );

	describe( 'getCurrentPost', () => {
		it( 'should return the current post', () => {
			const state = {
				currentPost: { ID: 1 },
			};

			expect( getCurrentPost( state ) ).to.eql( { ID: 1 } );
		} );
	} );

	describe( 'getPostEdits', () => {
		it( 'should return the post edits', () => {
			const state = {
				editor: {
					edits: { title: 'terga' },
				},
			};

			expect( getPostEdits( state ) ).to.eql( { title: 'terga' } );
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

			expect( getEditedPostTitle( state ) ).to.equal( 'sassel' );
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

			expect( getEditedPostTitle( state ) ).to.equal( 'youcha' );
		} );
	} );

	describe( 'getEditedPostPreviewLink', () => {
		it( 'should return null if the post has not link yet', () => {
			const state = {
				currentPost: {},
			};

			expect( getEditedPostPreviewLink( state ) ).to.be.null();
		} );

		it( 'should return the correct url adding a preview parameter to the query string', () => {
			const state = {
				currentPost: {
					link: 'https://andalouses.com/beach',
				},
			};

			expect( getEditedPostPreviewLink( state ) ).to.equal( 'https://andalouses.com/beach?preview=true' );
		} );
	} );

	describe( 'getBlock', () => {
		it( 'should return the block', () => {
			const state = {
				editor: {
					blocksByUid: {
						123: { uid: 123, blockType: 'core/text' },
					},
				},
			};

			expect( getBlock( state, 123 ) ).to.eql( { uid: 123, blockType: 'core/text' } );
		} );
	} );

	describe( 'getBlocks', () => {
		it( 'should return the ordered blocks', () => {
			const state = {
				editor: {
					blocksByUid: {
						23: { uid: 23, blockType: 'core/heading' },
						123: { uid: 123, blockType: 'core/text' },
					},
					blockOrder: [ 123, 23 ],
				},
			};

			expect( getBlocks( state ) ).to.eql( [
				{ uid: 123, blockType: 'core/text' },
				{ uid: 23, blockType: 'core/heading' },
			] );
		} );
	} );

	describe( 'getBlockUids', () => {
		it( 'should return the ordered block UIDs', () => {
			const state = {
				editor: {
					blockOrder: [ 123, 23 ],
				},
			};

			expect( getBlockUids( state ) ).to.eql( [ 123, 23 ] );
		} );
	} );

	describe( 'getBlockOrder', () => {
		it( 'should return the block order', () => {
			const state = {
				editor: {
					blockOrder: [ 123, 23 ],
				},
			};

			expect( getBlockOrder( state, 23 ) ).to.equal( 1 );
		} );
	} );

	describe( 'isFirstBlock', () => {
		it( 'should return true when the block is first', () => {
			const state = {
				editor: {
					blockOrder: [ 123, 23 ],
				},
			};

			expect( isFirstBlock( state, 123 ) ).to.be.true();
		} );

		it( 'should return false when the block is not first', () => {
			const state = {
				editor: {
					blockOrder: [ 123, 23 ],
				},
			};

			expect( isFirstBlock( state, 23 ) ).to.be.false();
		} );
	} );

	describe( 'isLastBlock', () => {
		it( 'should return true when the block is last', () => {
			const state = {
				editor: {
					blockOrder: [ 123, 23 ],
				},
			};

			expect( isLastBlock( state, 23 ) ).to.be.true();
		} );

		it( 'should return false when the block is not last', () => {
			const state = {
				editor: {
					blockOrder: [ 123, 23 ],
				},
			};

			expect( isLastBlock( state, 123 ) ).to.be.false();
		} );
	} );

	describe( 'getPreviousBlock', () => {
		it( 'should return the previous block', () => {
			const state = {
				editor: {
					blocksByUid: {
						23: { uid: 23, blockType: 'core/heading' },
						123: { uid: 123, blockType: 'core/text' },
					},
					blockOrder: [ 123, 23 ],
				},
			};

			expect( getPreviousBlock( state, 23 ) ).to.eql(
				{ uid: 123, blockType: 'core/text' },
			);
		} );

		it( 'should return null for the first block', () => {
			const state = {
				editor: {
					blocksByUid: {
						23: { uid: 23, blockType: 'core/heading' },
						123: { uid: 123, blockType: 'core/text' },
					},
					blockOrder: [ 123, 23 ],
				},
			};

			expect( getPreviousBlock( state, 123 ) ).to.be.null();
		} );
	} );

	describe( 'isBlockSelected', () => {
		it( 'should return true if the block is selected', () => {
			const state = {
				selectedBlock: { uid: 123 },
			};

			expect( isBlockSelected( state, 123 ) ).to.be.true();
		} );

		it( 'should return false if the block is not selected', () => {
			const state = {
				selectedBlock: { uid: 123 },
			};

			expect( isBlockSelected( state, 23 ) ).to.be.false();
		} );
	} );

	describe( 'isBlockHovered', () => {
		it( 'should return true if the block is hovered', () => {
			const state = {
				hoveredBlock: 123,
			};

			expect( isBlockHovered( state, 123 ) ).to.be.true();
		} );

		it( 'should return false if the block is not hovered', () => {
			const state = {
				hoveredBlock: 123,
			};

			expect( isBlockHovered( state, 23 ) ).to.be.false();
		} );
	} );

	describe( 'getBlockFocus', () => {
		it( 'should return the block focus if the block is selected', () => {
			const state = {
				selectedBlock: {
					uid: 123,
					focus: { editable: 'cite' },
				},
			};

			expect( getBlockFocus( state, 123 ) ).to.be.eql( { editable: 'cite' } );
		} );

		it( 'should return null if the block is not selected', () => {
			const state = {
				selectedBlock: {
					uid: 123,
					focus: { editable: 'cite' },
				},
			};

			expect( getBlockFocus( state, 23 ) ).to.be.eql( null );
		} );
	} );

	describe( 'isTypingInBlock', () => {
		it( 'should return the isTyping flag if the block is selected', () => {
			const state = {
				selectedBlock: {
					uid: 123,
					typing: true,
				},
			};

			expect( isTypingInBlock( state, 123 ) ).to.be.true();
		} );

		it( 'should return false if the block is not selected', () => {
			const state = {
				selectedBlock: {
					uid: 123,
					typing: true,
				},
			};

			expect( isTypingInBlock( state, 23 ) ).to.be.false();
		} );
	} );

	describe( 'isSavingPost', () => {
		it( 'should return true if the post is currently being saved', () => {
			const state = {
				saving: {
					requesting: true,
				},
			};

			expect( isSavingPost( state ) ).to.be.true();
		} );

		it( 'should return false if the post is currently being saved', () => {
			const state = {
				saving: {
					requesting: false,
				},
			};

			expect( isSavingPost( state ) ).to.be.false();
		} );
	} );

	describe( 'didPostSaveRequestSucceed', () => {
		it( 'should return true if the post save request is successful', () => {
			const state = {
				saving: {
					successful: true,
				},
			};

			expect( didPostSaveRequestSucceed( state ) ).to.be.true();
		} );

		it( 'should return true if the post save request has failed', () => {
			const state = {
				saving: {
					successful: false,
				},
			};

			expect( didPostSaveRequestSucceed( state ) ).to.be.false();
		} );
	} );

	describe( 'didPostSaveRequestFail', () => {
		it( 'should return true if the post save request has failed', () => {
			const state = {
				saving: {
					error: 'error',
				},
			};

			expect( didPostSaveRequestFail( state ) ).to.be.true();
		} );

		it( 'should return true if the post save request is successful', () => {
			const state = {
				saving: {
					error: false,
				},
			};

			expect( didPostSaveRequestFail( state ) ).to.be.false();
		} );
	} );

	describe( 'isSavingNewPost', () => {
		it( 'should return true if the post being saved is new', () => {
			const state = {
				saving: {
					isNew: true,
				},
			};

			expect( isSavingNewPost( state ) ).to.be.true();
		} );

		it( 'should return false if the post being saved is not new', () => {
			const state = {
				saving: {
					isNew: false,
				},
			};

			expect( isSavingNewPost( state ) ).to.be.false();
		} );
	} );
} );
