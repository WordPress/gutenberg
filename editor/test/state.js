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
	multiSelectedBlocks,
	mode,
	isSidebarOpened,
	saving,
	showInsertionPoint,
	createReduxStore,
} from '../state';

describe( 'state', () => {
	describe( 'editor()', () => {
		before( () => {
			wp.blocks.registerBlockType( 'core/test-block', {} );
		} );

		after( () => {
			wp.blocks.unregisterBlockType( 'core/test-block' );
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

		it( 'should insert block', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'chicken',
					name: 'core/test-block',
					attributes: {},
				} ],
			} );
			const state = editor( original, {
				type: 'INSERT_BLOCK',
				block: {
					uid: 'ribs',
					name: 'core/freeform',
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
					name: 'core/test-block',
					attributes: {},
				} ],
			} );
			const state = editor( original, {
				type: 'REPLACE_BLOCKS',
				uids: [ 'chicken' ],
				blocks: [ {
					uid: 'wings',
					name: 'core/freeform',
				} ],
			} );

			expect( Object.keys( state.blocksByUid ) ).to.have.lengthOf( 1 );
			expect( values( state.blocksByUid )[ 0 ].name ).to.equal( 'core/freeform' );
			expect( values( state.blocksByUid )[ 0 ].uid ).to.equal( 'wings' );
			expect( state.blockOrder ).to.eql( [ 'wings' ] );
		} );

		it( 'should move the block up', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'chicken',
					name: 'core/test-block',
					attributes: {},
				}, {
					uid: 'ribs',
					name: 'core/test-block',
					attributes: {},
				} ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCKS_UP',
				uids: [ 'ribs' ],
			} );

			expect( state.blockOrder ).to.eql( [ 'ribs', 'chicken' ] );
		} );

		it( 'should move multiple blocks up', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'chicken',
					name: 'core/test-block',
					attributes: {},
				}, {
					uid: 'ribs',
					name: 'core/test-block',
					attributes: {},
				}, {
					uid: 'veggies',
					name: 'core/test-block',
					attributes: {},
				} ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCKS_UP',
				uids: [ 'ribs', 'veggies' ],
			} );

			expect( state.blockOrder ).to.eql( [ 'ribs', 'veggies', 'chicken' ] );
		} );

		it( 'should not move the first block up', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'chicken',
					name: 'core/test-block',
					attributes: {},
				}, {
					uid: 'ribs',
					name: 'core/test-block',
					attributes: {},
				} ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCKS_UP',
				uids: [ 'chicken' ],
			} );

			expect( state.blockOrder ).to.equal( original.blockOrder );
		} );

		it( 'should move the block down', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'chicken',
					name: 'core/test-block',
					attributes: {},
				}, {
					uid: 'ribs',
					name: 'core/test-block',
					attributes: {},
				} ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCKS_DOWN',
				uids: [ 'chicken' ],
			} );

			expect( state.blockOrder ).to.eql( [ 'ribs', 'chicken' ] );
		} );

		it( 'should move multiple blocks down', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'chicken',
					name: 'core/test-block',
					attributes: {},
				}, {
					uid: 'ribs',
					name: 'core/test-block',
					attributes: {},
				}, {
					uid: 'veggies',
					name: 'core/test-block',
					attributes: {},
				} ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCKS_DOWN',
				uids: [ 'chicken', 'ribs' ],
			} );

			expect( state.blockOrder ).to.eql( [ 'veggies', 'chicken', 'ribs' ] );
		} );

		it( 'should not move the last block down', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'chicken',
					name: 'core/test-block',
					attributes: {},
				}, {
					uid: 'ribs',
					name: 'core/test-block',
					attributes: {},
				} ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCKS_DOWN',
				uids: [ 'ribs' ],
			} );

			expect( state.blockOrder ).to.equal( original.blockOrder );
		} );

		it( 'should remove the block', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'chicken',
					name: 'core/test-block',
					attributes: {},
				}, {
					uid: 'ribs',
					name: 'core/test-block',
					attributes: {},
				} ],
			} );
			const state = editor( original, {
				type: 'REMOVE_BLOCKS',
				uids: [ 'chicken' ],
			} );

			expect( state.blockOrder ).to.eql( [ 'ribs' ] );
			expect( state.blocksByUid ).to.eql( {
				ribs: {
					uid: 'ribs',
					name: 'core/test-block',
					attributes: {},
				},
			} );
		} );

		it( 'should remove multiple blocks', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'chicken',
					name: 'core/test-block',
					attributes: {},
				}, {
					uid: 'ribs',
					name: 'core/test-block',
					attributes: {},
				}, {
					uid: 'veggies',
					name: 'core/test-block',
					attributes: {},
				} ],
			} );
			const state = editor( original, {
				type: 'REMOVE_BLOCKS',
				uids: [ 'chicken', 'veggies' ],
			} );

			expect( state.blockOrder ).to.eql( [ 'ribs' ] );
			expect( state.blocksByUid ).to.eql( {
				ribs: {
					uid: 'ribs',
					name: 'core/test-block',
					attributes: {},
				},
			} );
		} );

		it( 'should insert after the specified block uid', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'kumquat',
					name: 'core/test-block',
					attributes: {},
				}, {
					uid: 'loquat',
					name: 'core/test-block',
					attributes: {},
				} ],
			} );

			const state = editor( original, {
				type: 'INSERT_BLOCK',
				after: 'kumquat',
				block: {
					uid: 'persimmon',
					name: 'core/freeform',
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

			it( 'should return same reference if no changed properties', () => {
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
						status: 'draft',
					},
				} );

				expect( state.edits ).to.equal( original.edits );
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

			it( 'should reset modified properties', () => {
				const original = editor( undefined, {
					type: 'EDIT_POST',
					edits: {
						status: 'draft',
						title: 'post title',
						tags: [ 1 ],
					},
				} );

				const state = editor( original, {
					type: 'CLEAR_POST_EDITS',
				} );

				expect( state.edits ).to.eql( {} );
			} );

			it( 'should return same reference if clearing non-edited', () => {
				const original = editor( undefined, {
					type: 'EDIT_POST',
					edits: {},
				} );

				const state = editor( original, {
					type: 'CLEAR_POST_EDITS',
				} );

				expect( state.edits ).to.equal( original.edits );
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

		describe( 'blocksByUid', () => {
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

			it( 'should ignore updates to non-existant block', () => {
				const original = editor( undefined, {
					type: 'RESET_BLOCKS',
					blocks: [],
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

				expect( state.blocksByUid ).to.equal( original.blocksByUid );
			} );

			it( 'should return with same reference if no changes in updates', () => {
				const original = editor( undefined, {
					type: 'RESET_BLOCKS',
					blocks: [ {
						uid: 'kumquat',
						attributes: {
							updated: true,
						},
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

				expect( state.blocksByUid ).to.equal( state.blocksByUid );
			} );
		} );
	} );

	describe( 'currentPost()', () => {
		it( 'should reset a post object', () => {
			const original = deepFreeze( { title: 'unmodified' } );

			const state = currentPost( original, {
				type: 'RESET_POST',
				post: {
					title: 'new post',
				},
			} );

			expect( state ).to.eql( {
				title: 'new post',
			} );
		} );

		it( 'should update the post object with UPDATE_POST', () => {
			const original = deepFreeze( { title: 'unmodified', status: 'publish' } );

			const state = currentPost( original, {
				type: 'UPDATE_POST',
				edits: {
					title: 'updated post object from server',
				},
			} );

			expect( state ).to.eql( {
				title: 'updated post object from server',
				status: 'publish',
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
					name: 'core/freeform',
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
					name: 'core/freeform',
				} ],
			} );

			expect( state ).to.equal( 'chicken' );
		} );
	} );

	describe( 'showInsertionPoint', () => {
		it( 'should show the insertion point', () => {
			const state = showInsertionPoint( undefined, {
				type: 'SHOW_INSERTION_POINT',
			} );

			expect( state ).to.be.true();
		} );

		it( 'should clear the insertion point', () => {
			const state = showInsertionPoint( {}, {
				type: 'HIDE_INSERTION_POINT',
			} );

			expect( state ).to.be.false();
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
					name: 'core/freeform',
				},
			} );

			expect( state ).to.eql( { uid: 'ribs', typing: false, focus: {} } );
		} );

		it( 'should return with block moved up', () => {
			const state = selectedBlock( undefined, {
				type: 'MOVE_BLOCKS_UP',
				uids: [ 'ribs' ],
			} );

			expect( state ).to.eql( { uid: 'ribs', typing: false, focus: {} } );
		} );

		it( 'should return with block moved down', () => {
			const state = selectedBlock( undefined, {
				type: 'MOVE_BLOCKS_DOWN',
				uids: [ 'chicken' ],
			} );

			expect( state ).to.eql( { uid: 'chicken', typing: false, focus: {} } );
		} );

		it( 'should not update the state if the block moved is already selected', () => {
			const original = deepFreeze( { uid: 'ribs', typing: true, focus: {} } );
			const state = selectedBlock( original, {
				type: 'MOVE_BLOCKS_UP',
				uids: [ 'ribs' ],
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

		it( 'should do nothing if typing stopped not within selected block', () => {
			const original = selectedBlock( undefined, {} );
			const state = selectedBlock( original, {
				type: 'STOP_TYPING',
				uid: 'chicken',
			} );

			expect( state ).to.equal( original );
		} );

		it( 'should reset typing flag if typing stopped within selected block', () => {
			const original = selectedBlock( undefined, {
				type: 'START_TYPING',
				uid: 'chicken',
			} );
			const state = selectedBlock( original, {
				type: 'STOP_TYPING',
				uid: 'chicken',
			} );

			expect( state ).to.eql( { uid: 'chicken', typing: false, focus: {} } );
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
					name: 'core/freeform',
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
					name: 'core/freeform',
				} ],
			} );

			expect( state ).to.equal( original );
		} );
	} );

	describe( 'multiSelectedBlocks()', () => {
		it( 'should set multi selection', () => {
			const state = multiSelectedBlocks( undefined, {
				type: 'MULTI_SELECT',
				start: 'ribs',
				end: 'chicken',
			} );

			expect( state ).to.eql( { start: 'ribs', end: 'chicken' } );
		} );

		it( 'should unset multi selection', () => {
			const original = deepFreeze( { start: 'ribs', end: 'chicken' } );

			const state1 = multiSelectedBlocks( original, {
				type: 'CLEAR_SELECTED_BLOCK',
			} );

			expect( state1 ).to.eql( { start: null, end: null } );

			const state2 = multiSelectedBlocks( original, {
				type: 'TOGGLE_BLOCK_SELECTED',
			} );

			expect( state2 ).to.eql( { start: null, end: null } );

			const state3 = multiSelectedBlocks( original, {
				type: 'INSERT_BLOCK',
				block: {
					uid: 'ribs',
					name: 'core/freeform',
				},
			} );

			expect( state3 ).to.eql( { start: null, end: null } );
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
		it( 'should be opened by default', () => {
			const state = isSidebarOpened( undefined, {} );

			expect( state ).to.be.true();
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
			} );
			expect( state ).to.eql( {
				requesting: true,
				successful: false,
				error: null,
			} );
		} );

		it( 'should update when a request succeeds', () => {
			const state = saving( null, {
				type: 'REQUEST_POST_UPDATE_SUCCESS',
			} );
			expect( state ).to.eql( {
				requesting: false,
				successful: true,
				error: null,
			} );
		} );

		it( 'should update when a request fails', () => {
			const state = saving( null, {
				type: 'REQUEST_POST_UPDATE_FAILURE',
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
				'optimist',
				'editor',
				'currentPost',
				'selectedBlock',
				'multiSelectedBlocks',
				'hoveredBlock',
				'mode',
				'isSidebarOpened',
				'saving',
				'showInsertionPoint',
			] );
		} );
	} );
} );
