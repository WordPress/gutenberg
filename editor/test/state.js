/**
 * External dependencies
 */
import { expect } from 'chai';
import { values } from 'lodash';
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	editor,
	currentPost,
	hoveredBlock,
	selectedBlock,
	mode,
	isSidebarOpened,
	saving,
	insertionPoint,
	createReduxStore,
} from '../state';

describe( 'state', () => {
	describe( 'editor()', () => {
		before( () => {
			wp.blocks.registerBlock( 'core/test-block', {} );
		} );

		after( () => {
			wp.blocks.unregisterBlock( 'core/test-block' );
		} );

		it( 'should return empty blocksByUid, blockOrder, history by default', () => {
			const state = editor( undefined, {} );

			expect( state.blocksByUid ).to.eql( {} );
			expect( state.blockOrder ).to.eql( [] );
			expect( state ).to.have.keys( 'history' );
		} );

		it( 'should key by replaced blocks uid', () => {
			const original = editor( undefined, {} );
			const state = editor( original, {
				type: 'RESET_BLOCKS',
				blocks: [ { uid: 'bananas' } ],
			} );

			expect( Object.keys( state.blocksByUid ) ).to.have.lengthOf( 1 );
			expect( values( state.blocksByUid )[ 0 ].uid ).to.equal( 'bananas' );
			expect( state.blockOrder ).to.eql( [ 'bananas' ] );
		} );

		it( 'should return with block updates', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'kumquat',
					attributes: {},
				} ],
			} );
			const state = editor( original, {
				type: 'UPDATE_BLOCK',
				uid: 'kumquat',
				updates: {
					attributes: {
						updated: true,
					},
				},
			} );

			expect( state.blocksByUid.kumquat.attributes.updated ).to.be.true();
		} );

		it( 'should insert block', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'chicken',
					blockType: 'core/test-block',
					attributes: {},
				} ],
			} );
			const state = editor( original, {
				type: 'INSERT_BLOCK',
				block: {
					uid: 'ribs',
					blockType: 'core/freeform',
				},
			} );

			expect( Object.keys( state.blocksByUid ) ).to.have.lengthOf( 2 );
			expect( values( state.blocksByUid )[ 1 ].uid ).to.equal( 'ribs' );
			expect( state.blockOrder ).to.eql( [ 'chicken', 'ribs' ] );
		} );

		it( 'should replace the block', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'chicken',
					blockType: 'core/test-block',
					attributes: {},
				} ],
			} );
			const state = editor( original, {
				type: 'REPLACE_BLOCKS',
				uids: [ 'chicken' ],
				blocks: [ {
					uid: 'wings',
					blockType: 'core/freeform',
				} ],
			} );

			expect( Object.keys( state.blocksByUid ) ).to.have.lengthOf( 1 );
			expect( values( state.blocksByUid )[ 0 ].blockType ).to.equal( 'core/freeform' );
			expect( values( state.blocksByUid )[ 0 ].uid ).to.equal( 'wings' );
			expect( state.blockOrder ).to.eql( [ 'wings' ] );
		} );

		it( 'should move the block up', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'chicken',
					blockType: 'core/test-block',
					attributes: {},
				}, {
					uid: 'ribs',
					blockType: 'core/test-block',
					attributes: {},
				} ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCK_UP',
				uid: 'ribs',
			} );

			expect( state.blockOrder ).to.eql( [ 'ribs', 'chicken' ] );
		} );

		it( 'should not move the first block up', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'chicken',
					blockType: 'core/test-block',
					attributes: {},
				}, {
					uid: 'ribs',
					blockType: 'core/test-block',
					attributes: {},
				} ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCK_UP',
				uid: 'chicken',
			} );

			expect( state.blockOrder ).to.equal( original.blockOrder );
		} );

		it( 'should move the block down', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'chicken',
					blockType: 'core/test-block',
					attributes: {},
				}, {
					uid: 'ribs',
					blockType: 'core/test-block',
					attributes: {},
				} ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCK_DOWN',
				uid: 'chicken',
			} );

			expect( state.blockOrder ).to.eql( [ 'ribs', 'chicken' ] );
		} );

		it( 'should not move the last block down', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'chicken',
					blockType: 'core/test-block',
					attributes: {},
				}, {
					uid: 'ribs',
					blockType: 'core/test-block',
					attributes: {},
				} ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCK_DOWN',
				uid: 'ribs',
			} );

			expect( state.blockOrder ).to.equal( original.blockOrder );
		} );

		it( 'should remove the block', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'chicken',
					blockType: 'core/test-block',
					attributes: {},
				}, {
					uid: 'ribs',
					blockType: 'core/test-block',
					attributes: {},
				} ],
			} );
			const state = editor( original, {
				type: 'REMOVE_BLOCK',
				uid: 'chicken',
			} );

			expect( state.blockOrder ).to.eql( [ 'ribs' ] );
			expect( state.blocksByUid ).to.eql( {
				ribs: {
					uid: 'ribs',
					blockType: 'core/test-block',
					attributes: {},
				},
			} );
		} );

		it( 'should insert after the specified block uid', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'kumquat',
					blockType: 'core/test-block',
					attributes: {},
				}, {
					uid: 'loquat',
					blockType: 'core/test-block',
					attributes: {},
				} ],
			} );

			const state = editor( original, {
				type: 'INSERT_BLOCK',
				after: 'kumquat',
				block: {
					uid: 'persimmon',
					blockType: 'core/freeform',
				},
			} );

			expect( Object.keys( state.blocksByUid ) ).to.have.lengthOf( 3 );
			expect( state.blockOrder ).to.eql( [ 'kumquat', 'persimmon', 'loquat' ] );
		} );

		describe( 'edits()', () => {
			it( 'should save newly edited properties', () => {
				const original = editor( undefined, {
					type: 'EDIT_POST',
					edits: {
						status: 'draft',
						title: 'post title',
					},
				} );

				const state = editor( original, {
					type: 'EDIT_POST',
					edits: {
						tags: [ 1 ],
					},
				} );

				expect( state.edits ).to.eql( {
					status: 'draft',
					title: 'post title',
					tags: [ 1 ],
				} );
			} );

			it( 'should save modified properties', () => {
				const original = editor( undefined, {
					type: 'EDIT_POST',
					edits: {
						status: 'draft',
						title: 'post title',
						tags: [ 1 ],
					},
				} );

				const state = editor( original, {
					type: 'EDIT_POST',
					edits: {
						title: 'modified title',
						tags: [ 2 ],
					},
				} );

				expect( state.edits ).to.eql( {
					status: 'draft',
					title: 'modified title',
					tags: [ 2 ],
				} );
			} );

			it( 'should save initial post state', () => {
				const state = editor( undefined, {
					type: 'SETUP_NEW_POST',
					edits: {
						status: 'draft',
						title: 'post title',
					},
				} );

				expect( state.edits ).to.eql( {
					status: 'draft',
					title: 'post title',
				} );
			} );
		} );

		describe( 'dirty()', () => {
			it( 'should be true when the post is edited', () => {
				const state = editor( undefined, {
					type: 'EDIT_POST',
					edits: {},
				} );

				expect( state.dirty ).to.be.true();
			} );

			it( 'should change to false when the post is reset', () => {
				const original = editor( undefined, {
					type: 'EDIT_POST',
					edits: {},
				} );

				const state = editor( original, {
					type: 'RESET_BLOCKS',
					post: {},
					blocks: [],
				} );

				expect( state.dirty ).to.be.false();
			} );

			it( 'should not change from true when an unrelated action occurs', () => {
				const original = editor( undefined, {
					type: 'EDIT_POST',
					edits: {},
				} );

				const state = editor( original, {
					type: 'BRISKET_READY',
				} );

				expect( state.dirty ).to.be.true();
			} );

			it( 'should not change from false when an unrelated action occurs', () => {
				const original = editor( undefined, {
					type: 'RESET_BLOCKS',
					post: {},
					blocks: [],
				} );

				expect( original.dirty ).to.be.false();

				const state = editor( original, {
					type: 'BRISKET_READY',
				} );

				expect( state.dirty ).to.be.false();
			} );

			it( 'should be false when the post is initialized', () => {
				const state = editor( undefined, {
					type: 'SETUP_NEW_POST',
					edits: {},
				} );

				expect( state.dirty ).to.be.false();
			} );
		} );
	} );

	describe( 'currentPost()', () => {
		it( 'should remember a post object sent with RESET_BLOCKS', () => {
			const original = deepFreeze( { title: 'unmodified' } );

			const state = currentPost( original, {
				type: 'RESET_BLOCKS',
				post: {
					title: 'new post',
				},
			} );

			expect( state ).to.eql( {
				title: 'new post',
			} );
		} );

		it( 'should ignore RESET_BLOCKS without a post object', () => {
			const original = deepFreeze( { title: 'unmodified' } );

			const state = currentPost( original, {
				type: 'RESET_BLOCKS',
				post: null,
			} );

			expect( state ).to.equal( original );
		} );

		it( 'should remember a post object sent with REQUEST_POST_UPDATE_SUCCESS', () => {
			const original = deepFreeze( { title: 'unmodified' } );

			const state = currentPost( original, {
				type: 'REQUEST_POST_UPDATE_SUCCESS',
				post: {
					title: 'updated post object from server',
				},
			} );

			expect( state ).to.eql( {
				title: 'updated post object from server',
			} );
		} );
	} );

	describe( 'hoveredBlock()', () => {
		it( 'should return with block uid as hovered', () => {
			const state = hoveredBlock( null, {
				type: 'TOGGLE_BLOCK_HOVERED',
				uid: 'kumquat',
				hovered: true,
			} );

			expect( state ).to.equal( 'kumquat' );
		} );

		it( 'should return null when a block is selected', () => {
			const state = hoveredBlock( 'kumquat', {
				type: 'TOGGLE_BLOCK_SELECTED',
				uid: 'kumquat',
				selected: true,
			} );

			expect( state ).to.be.null();
		} );

		it( 'should replace the hovered block', () => {
			const state = hoveredBlock( 'chicken', {
				type: 'REPLACE_BLOCKS',
				uids: [ 'chicken' ],
				blocks: [ {
					uid: 'wings',
					blockType: 'core/freeform',
				} ],
			} );

			expect( state ).to.equal( 'wings' );
		} );

		it( 'should keep the hovered block', () => {
			const state = hoveredBlock( 'chicken', {
				type: 'REPLACE_BLOCKS',
				uids: [ 'ribs' ],
				blocks: [ {
					uid: 'wings',
					blockType: 'core/freeform',
				} ],
			} );

			expect( state ).to.equal( 'chicken' );
		} );
	} );

	describe( 'insertionPoint', () => {
		it( 'should set the insertion point', () => {
			const state = insertionPoint( {}, {
				type: 'SET_INSERTION_POINT',
				uid: 'kumquat',
			} );

			expect( state ).to.eql( {
				show: true,
				uid: 'kumquat',
			} );
		} );

		it( 'should clear the insertion point', () => {
			const state = insertionPoint( {}, {
				type: 'CLEAR_INSERTION_POINT',
			} );

			expect( state ).to.eql( {
				show: false,
			} );
		} );
	} );

	describe( 'selectedBlock()', () => {
		it( 'should return with block uid as selected', () => {
			const state = selectedBlock( undefined, {
				type: 'TOGGLE_BLOCK_SELECTED',
				uid: 'kumquat',
				selected: true,
			} );

			expect( state ).to.eql( { uid: 'kumquat', typing: false, focus: {} } );
		} );

		it( 'returns an empty object when clearing selected block', () => {
			const original = deepFreeze( { uid: 'kumquat', typing: false, focus: {} } );
			const state = selectedBlock( original, {
				type: 'CLEAR_SELECTED_BLOCK',
			} );

			expect( state ).to.eql( {} );
		} );

		it( 'should not update the state if already selected and not typing', () => {
			const original = deepFreeze( { uid: 'kumquat', typing: false, focus: {} } );
			const state = selectedBlock( original, {
				type: 'TOGGLE_BLOCK_SELECTED',
				uid: 'kumquat',
				selected: true,
			} );

			expect( state ).to.equal( original );
		} );

		it( 'should update the state if already selected and typing', () => {
			const original = deepFreeze( { uid: 'kumquat', typing: true, focus: { editable: 'content' } } );
			const state = selectedBlock( original, {
				type: 'TOGGLE_BLOCK_SELECTED',
				uid: 'kumquat',
				selected: true,
			} );

			expect( state ).to.eql( {
				uid: 'kumquat',
				typing: false,
				focus: { editable: 'content' },
			} );
		} );

		it( 'should unselect the block if currently selected', () => {
			const original = deepFreeze( { uid: 'kumquat', typing: true, focus: {} } );
			const state = selectedBlock( original, {
				type: 'TOGGLE_BLOCK_SELECTED',
				uid: 'kumquat',
				selected: false,
			} );

			expect( state ).to.eql( {} );
		} );

		it( 'should not unselect the block if another block is selected', () => {
			const original = deepFreeze( { uid: 'loquat', typing: true, focus: {} } );
			const state = selectedBlock( original, {
				type: 'TOGGLE_BLOCK_SELECTED',
				uid: 'kumquat',
				selected: false,
			} );

			expect( state ).to.equal( original );
		} );

		it( 'should return with inserted block', () => {
			const state = selectedBlock( undefined, {
				type: 'INSERT_BLOCK',
				block: {
					uid: 'ribs',
					blockType: 'core/freeform',
				},
			} );

			expect( state ).to.eql( { uid: 'ribs', typing: false, focus: {} } );
		} );

		it( 'should return with block moved up', () => {
			const state = selectedBlock( undefined, {
				type: 'MOVE_BLOCK_UP',
				uid: 'ribs',
			} );

			expect( state ).to.eql( { uid: 'ribs', typing: false, focus: {} } );
		} );

		it( 'should return with block moved down', () => {
			const state = selectedBlock( undefined, {
				type: 'MOVE_BLOCK_DOWN',
				uid: 'chicken',
			} );

			expect( state ).to.eql( { uid: 'chicken', typing: false, focus: {} } );
		} );

		it( 'should not update the state if the block moved is already selected', () => {
			const original = deepFreeze( { uid: 'ribs', typing: true, focus: {} } );
			const state = selectedBlock( original, {
				type: 'MOVE_BLOCK_UP',
				uid: 'ribs',
			} );

			expect( state ).to.equal( original );
		} );

		it( 'should update the focus and selects the block', () => {
			const state = selectedBlock( undefined, {
				type: 'UPDATE_FOCUS',
				uid: 'chicken',
				config: { editable: 'citation' },
			} );

			expect( state ).to.eql( { uid: 'chicken', typing: false, focus: { editable: 'citation' } } );
		} );

		it( 'should update the focus and merge the existing state', () => {
			const original = deepFreeze( { uid: 'ribs', typing: true, focus: {} } );
			const state = selectedBlock( original, {
				type: 'UPDATE_FOCUS',
				uid: 'ribs',
				config: { editable: 'citation' },
			} );

			expect( state ).to.eql( { uid: 'ribs', typing: true, focus: { editable: 'citation' } } );
		} );

		it( 'should set the typing flag and selects the block', () => {
			const state = selectedBlock( undefined, {
				type: 'START_TYPING',
				uid: 'chicken',
			} );

			expect( state ).to.eql( { uid: 'chicken', typing: true, focus: {} } );
		} );

		it( 'should set the typing flag and merge the existing state', () => {
			const original = deepFreeze( { uid: 'ribs', typing: false, focus: { editable: 'citation' } } );
			const state = selectedBlock( original, {
				type: 'START_TYPING',
				uid: 'ribs',
			} );

			expect( state ).to.eql( { uid: 'ribs', typing: true, focus: { editable: 'citation' } } );
		} );

		it( 'should replace the selected block', () => {
			const original = deepFreeze( { uid: 'chicken', typing: false, focus: { editable: 'citation' } } );
			const state = selectedBlock( original, {
				type: 'REPLACE_BLOCKS',
				uids: [ 'chicken' ],
				blocks: [ {
					uid: 'wings',
					blockType: 'core/freeform',
				} ],
			} );

			expect( state ).to.eql( { uid: 'wings', typing: false, focus: {} } );
		} );

		it( 'should keep the selected block', () => {
			const original = deepFreeze( { uid: 'chicken', typing: false, focus: { editable: 'citation' } } );
			const state = selectedBlock( original, {
				type: 'REPLACE_BLOCKS',
				uids: [ 'ribs' ],
				blocks: [ {
					uid: 'wings',
					blockType: 'core/freeform',
				} ],
			} );

			expect( state ).to.equal( original );
		} );
	} );

	describe( 'mode()', () => {
		it( 'should return "visual" by default', () => {
			const state = mode( undefined, {} );

			expect( state ).to.equal( 'visual' );
		} );

		it( 'should return switched mode', () => {
			const state = mode( null, {
				type: 'SWITCH_MODE',
				mode: 'text',
			} );

			expect( state ).to.equal( 'text' );
		} );
	} );

	describe( 'isSidebarOpened()', () => {
		it( 'should be closed by default', () => {
			const state = isSidebarOpened( undefined, {} );

			expect( state ).to.be.false();
		} );

		it( 'should toggle the sidebar open flag', () => {
			const state = isSidebarOpened( false, {
				type: 'TOGGLE_SIDEBAR',
			} );

			expect( state ).to.be.true();
		} );
	} );

	describe( 'saving()', () => {
		it( 'should update when a request is started', () => {
			const state = saving( null, {
				type: 'REQUEST_POST_UPDATE',
				isNew: true,
			} );
			expect( state ).to.eql( {
				requesting: true,
				successful: false,
				error: null,
				isNew: true,
			} );
		} );

		it( 'should update when a request succeeds', () => {
			const state = saving( null, {
				type: 'REQUEST_POST_UPDATE_SUCCESS',
				isNew: true,
			} );
			expect( state ).to.eql( {
				requesting: false,
				successful: true,
				error: null,
				isNew: false,
			} );
		} );

		it( 'should update when a request fails', () => {
			const state = saving( null, {
				type: 'REQUEST_POST_UPDATE_FAILURE',
				isNew: true,
				error: {
					code: 'pretend_error',
					message: 'update failed',
				},
			} );
			expect( state ).to.eql( {
				requesting: false,
				successful: false,
				error: {
					code: 'pretend_error',
					message: 'update failed',
				},
				isNew: true,
			} );
		} );
	} );

	describe( 'createReduxStore()', () => {
		it( 'should return a redux store', () => {
			const store = createReduxStore();

			expect( store.dispatch ).to.be.a( 'function' );
			expect( store.getState ).to.be.a( 'function' );
		} );

		it( 'should have expected reducer keys', () => {
			const store = createReduxStore();
			const state = store.getState();

			expect( Object.keys( state ) ).to.have.members( [
				'editor',
				'currentPost',
				'selectedBlock',
				'hoveredBlock',
				'mode',
				'isSidebarOpened',
				'saving',
				'insertionPoint',
			] );
		} );
	} );
} );
