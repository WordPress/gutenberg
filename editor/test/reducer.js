/**
 * External dependencies
 */
import { values, noop } from 'lodash';
import deepFreeze from 'deep-freeze';

/**
 * WordPress dependencies
 */
import { registerBlockType, unregisterBlockType, getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
	getPostRawValue,
	editor,
	currentPost,
	hoveredBlock,
	isTyping,
	blockSelection,
	preferences,
	saving,
	notices,
	blocksMode,
	blockInsertionPoint,
	metaBoxes,
	reusableBlocks,
} from '../reducer';

describe( 'state', () => {
	describe( 'getPostRawValue', () => {
		it( 'returns original value for non-rendered content', () => {
			const value = getPostRawValue( '' );

			expect( value ).toBe( '' );
		} );

		it( 'returns raw value for rendered content', () => {
			const value = getPostRawValue( { raw: '' } );

			expect( value ).toBe( '' );
		} );
	} );

	describe( 'editor()', () => {
		beforeAll( () => {
			registerBlockType( 'core/test-block', {
				save: noop,
				edit: noop,
				category: 'common',
				title: 'test block',
			} );
		} );

		afterAll( () => {
			unregisterBlockType( 'core/test-block' );
		} );

		it( 'should return history (empty edits, blocksByUid, blockOrder), dirty flag by default', () => {
			const state = editor( undefined, {} );

			expect( state.past ).toEqual( [] );
			expect( state.future ).toEqual( [] );
			expect( state.present.edits ).toEqual( {} );
			expect( state.present.blocksByUid ).toEqual( {} );
			expect( state.present.blockOrder ).toEqual( [] );
			expect( state.isDirty ).toBe( false );
		} );

		it( 'should key by replaced blocks uid', () => {
			const original = editor( undefined, {} );
			const state = editor( original, {
				type: 'RESET_BLOCKS',
				blocks: [ { uid: 'bananas' } ],
			} );

			expect( Object.keys( state.present.blocksByUid ) ).toHaveLength( 1 );
			expect( values( state.present.blocksByUid )[ 0 ].uid ).toBe( 'bananas' );
			expect( state.present.blockOrder ).toEqual( [ 'bananas' ] );
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
				type: 'INSERT_BLOCKS',
				blocks: [ {
					uid: 'ribs',
					name: 'core/freeform',
				} ],
			} );

			expect( Object.keys( state.present.blocksByUid ) ).toHaveLength( 2 );
			expect( values( state.present.blocksByUid )[ 1 ].uid ).toBe( 'ribs' );
			expect( state.present.blockOrder ).toEqual( [ 'chicken', 'ribs' ] );
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

			expect( Object.keys( state.present.blocksByUid ) ).toHaveLength( 1 );
			expect( values( state.present.blocksByUid )[ 0 ].name ).toBe( 'core/freeform' );
			expect( values( state.present.blocksByUid )[ 0 ].uid ).toBe( 'wings' );
			expect( state.present.blockOrder ).toEqual( [ 'wings' ] );
		} );

		it( 'should update the block', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'chicken',
					name: 'core/test-block',
					attributes: {},
					isValid: false,
				} ],
			} );
			const state = editor( deepFreeze( original ), {
				type: 'UPDATE_BLOCK',
				uid: 'chicken',
				updates: {
					attributes: { content: 'ribs' },
					isValid: true,
				},
			} );

			expect( state.present.blocksByUid.chicken ).toEqual( {
				uid: 'chicken',
				name: 'core/test-block',
				attributes: { content: 'ribs' },
				isValid: true,
			} );
		} );

		it( 'should update the reusable block reference if the temporary id is swapped', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'chicken',
					name: 'core/block',
					attributes: {
						ref: 'random-uid',
					},
					isValid: false,
				} ],
			} );

			const state = editor( deepFreeze( original ), {
				type: 'SAVE_REUSABLE_BLOCK_SUCCESS',
				id: 'random-uid',
				updatedId: 3,
			} );

			expect( state.present.blocksByUid.chicken ).toEqual( {
				uid: 'chicken',
				name: 'core/block',
				attributes: {
					ref: 3,
				},
				isValid: false,
			} );
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

			expect( state.present.blockOrder ).toEqual( [ 'ribs', 'chicken' ] );
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

			expect( state.present.blockOrder ).toEqual( [ 'ribs', 'veggies', 'chicken' ] );
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

			expect( state.present.blockOrder ).toBe( original.present.blockOrder );
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

			expect( state.present.blockOrder ).toEqual( [ 'ribs', 'chicken' ] );
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

			expect( state.present.blockOrder ).toEqual( [ 'veggies', 'chicken', 'ribs' ] );
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

			expect( state.present.blockOrder ).toBe( original.present.blockOrder );
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

			expect( state.present.blockOrder ).toEqual( [ 'ribs' ] );
			expect( state.present.blocksByUid ).toEqual( {
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

			expect( state.present.blockOrder ).toEqual( [ 'ribs' ] );
			expect( state.present.blocksByUid ).toEqual( {
				ribs: {
					uid: 'ribs',
					name: 'core/test-block',
					attributes: {},
				},
			} );
		} );

		it( 'should insert at the specified position', () => {
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
				type: 'INSERT_BLOCKS',
				position: 1,
				blocks: [ {
					uid: 'persimmon',
					name: 'core/freeform',
				} ],
			} );

			expect( Object.keys( state.present.blocksByUid ) ).toHaveLength( 3 );
			expect( state.present.blockOrder ).toEqual( [ 'kumquat', 'persimmon', 'loquat' ] );
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

				expect( state.present.edits ).toEqual( {
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

				expect( state.present.edits ).toBe( original.present.edits );
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

				expect( state.present.edits ).toEqual( {
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

				expect( state.present.edits ).toEqual( {
					status: 'draft',
					title: 'post title',
				} );
			} );

			it( 'should omit content when resetting', () => {
				// Use case: When editing in Text mode, we defer to content on
				// the property, but we reset blocks by parse when switching
				// back to Visual mode.
				const original = deepFreeze( editor( undefined, {} ) );
				let state = editor( original, {
					type: 'EDIT_POST',
					edits: {
						content: 'bananas',
					},
				} );

				expect( state.present.edits ).toHaveProperty( 'content' );

				state = editor( original, {
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

				expect( state.present.edits ).not.toHaveProperty( 'content' );
			} );
		} );

		describe( 'blocksByUid', () => {
			it( 'should return with attribute block updates', () => {
				const original = deepFreeze( editor( undefined, {
					type: 'RESET_BLOCKS',
					blocks: [ {
						uid: 'kumquat',
						attributes: {},
					} ],
				} ) );
				const state = editor( original, {
					type: 'UPDATE_BLOCK_ATTRIBUTES',
					uid: 'kumquat',
					attributes: {
						updated: true,
					},
				} );

				expect( state.present.blocksByUid.kumquat.attributes.updated ).toBe( true );
			} );

			it( 'should accumulate attribute block updates', () => {
				const original = deepFreeze( editor( undefined, {
					type: 'RESET_BLOCKS',
					blocks: [ {
						uid: 'kumquat',
						attributes: {
							updated: true,
						},
					} ],
				} ) );
				const state = editor( original, {
					type: 'UPDATE_BLOCK_ATTRIBUTES',
					uid: 'kumquat',
					attributes: {
						moreUpdated: true,
					},
				} );

				expect( state.present.blocksByUid.kumquat.attributes ).toEqual( {
					updated: true,
					moreUpdated: true,
				} );
			} );

			it( 'should ignore updates to non-existant block', () => {
				const original = deepFreeze( editor( undefined, {
					type: 'RESET_BLOCKS',
					blocks: [],
				} ) );
				const state = editor( original, {
					type: 'UPDATE_BLOCK_ATTRIBUTES',
					uid: 'kumquat',
					attributes: {
						updated: true,
					},
				} );

				expect( state.present.blocksByUid ).toBe( original.present.blocksByUid );
			} );

			it( 'should return with same reference if no changes in updates', () => {
				const original = deepFreeze( editor( undefined, {
					type: 'RESET_BLOCKS',
					blocks: [ {
						uid: 'kumquat',
						attributes: {
							updated: true,
						},
					} ],
				} ) );
				const state = editor( original, {
					type: 'UPDATE_BLOCK_ATTRIBUTES',
					uid: 'kumquat',
					attributes: {
						updated: true,
					},
				} );

				expect( state.present.blocksByUid ).toBe( state.present.blocksByUid );
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

			expect( state ).toEqual( {
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

			expect( state ).toEqual( {
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

			expect( state ).toBe( 'kumquat' );
		} );

		it( 'should return null when a block is selected', () => {
			const state = hoveredBlock( 'kumquat', {
				type: 'SELECT_BLOCK',
				uid: 'kumquat',
			} );

			expect( state ).toBeNull();
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

			expect( state ).toBe( 'wings' );
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

			expect( state ).toBe( 'chicken' );
		} );
	} );

	describe( 'blockInsertionPoint', () => {
		it( 'should default to an empty object', () => {
			const state = blockInsertionPoint( undefined, {} );

			expect( state ).toEqual( {} );
		} );

		it( 'should set insertion point position', () => {
			const state = blockInsertionPoint( undefined, {
				type: 'SET_BLOCK_INSERTION_POINT',
				position: 5,
			} );

			expect( state ).toEqual( {
				position: 5,
			} );
		} );

		it( 'should clear insertion point position', () => {
			const original = blockInsertionPoint( undefined, {
				type: 'SET_BLOCK_INSERTION_POINT',
				position: 5,
			} );

			const state = blockInsertionPoint( deepFreeze( original ), {
				type: 'CLEAR_BLOCK_INSERTION_POINT',
			} );

			expect( state ).toEqual( {
				position: null,
			} );
		} );

		it( 'should show the insertion point', () => {
			const state = blockInsertionPoint( undefined, {
				type: 'SHOW_INSERTION_POINT',
			} );

			expect( state ).toEqual( { visible: true } );
		} );

		it( 'should clear the insertion point', () => {
			const state = blockInsertionPoint( deepFreeze( {} ), {
				type: 'HIDE_INSERTION_POINT',
			} );

			expect( state ).toEqual( { visible: false } );
		} );

		it( 'should merge position and visible', () => {
			const original = blockInsertionPoint( undefined, {
				type: 'SHOW_INSERTION_POINT',
			} );

			const state = blockInsertionPoint( deepFreeze( original ), {
				type: 'SET_BLOCK_INSERTION_POINT',
				position: 5,
			} );

			expect( state ).toEqual( {
				visible: true,
				position: 5,
			} );
		} );
	} );

	describe( 'isTyping()', () => {
		it( 'should set the typing flag to true', () => {
			const state = isTyping( false, {
				type: 'START_TYPING',
			} );

			expect( state ).toBe( true );
		} );

		it( 'should set the typing flag to false', () => {
			const state = isTyping( false, {
				type: 'STOP_TYPING',
			} );

			expect( state ).toBe( false );
		} );
	} );

	describe( 'blockSelection()', () => {
		it( 'should return with block uid as selected', () => {
			const state = blockSelection( undefined, {
				type: 'SELECT_BLOCK',
				uid: 'kumquat',
			} );

			expect( state ).toEqual( {
				start: 'kumquat',
				end: 'kumquat',
				focus: {},
				isMultiSelecting: false,
				isEnabled: true,
			} );
		} );

		it( 'should set multi selection', () => {
			const original = deepFreeze( { focus: { editable: 'citation' }, isMultiSelecting: false } );
			const state = blockSelection( original, {
				type: 'MULTI_SELECT',
				start: 'ribs',
				end: 'chicken',
			} );

			expect( state ).toEqual( { start: 'ribs', end: 'chicken', focus: null, isMultiSelecting: false } );
		} );

		it( 'should set continuous multi selection', () => {
			const original = deepFreeze( { focus: { editable: 'citation' }, isMultiSelecting: true } );
			const state = blockSelection( original, {
				type: 'MULTI_SELECT',
				start: 'ribs',
				end: 'chicken',
			} );

			expect( state ).toEqual( { start: 'ribs', end: 'chicken', focus: { editable: 'citation' }, isMultiSelecting: true } );
		} );

		it( 'should start multi selection', () => {
			const original = deepFreeze( { start: 'ribs', end: 'ribs', focus: { editable: 'citation' }, isMultiSelecting: false } );
			const state = blockSelection( original, {
				type: 'START_MULTI_SELECT',
			} );

			expect( state ).toEqual( { start: 'ribs', end: 'ribs', focus: { editable: 'citation' }, isMultiSelecting: true } );
		} );

		it( 'should end multi selection with selection', () => {
			const original = deepFreeze( { start: 'ribs', end: 'chicken', focus: { editable: 'citation' }, isMultiSelecting: true } );
			const state = blockSelection( original, {
				type: 'STOP_MULTI_SELECT',
			} );

			expect( state ).toEqual( { start: 'ribs', end: 'chicken', focus: null, isMultiSelecting: false } );
		} );

		it( 'should end multi selection without selection', () => {
			const original = deepFreeze( { start: 'ribs', end: 'ribs', focus: { editable: 'citation' }, isMultiSelecting: true } );
			const state = blockSelection( original, {
				type: 'STOP_MULTI_SELECT',
			} );

			expect( state ).toEqual( { start: 'ribs', end: 'ribs', focus: { editable: 'citation' }, isMultiSelecting: false } );
		} );

		it( 'should not update the state if the block is already selected', () => {
			const original = deepFreeze( { start: 'ribs', end: 'ribs' } );

			const state1 = blockSelection( original, {
				type: 'SELECT_BLOCK',
				uid: 'ribs',
			} );

			expect( state1 ).toBe( original );
		} );

		it( 'should unset multi selection and select inserted block', () => {
			const original = deepFreeze( { start: 'ribs', end: 'chicken' } );

			const state1 = blockSelection( original, {
				type: 'CLEAR_SELECTED_BLOCK',
			} );

			expect( state1 ).toEqual( { start: null, end: null, focus: null, isMultiSelecting: false } );

			const state3 = blockSelection( original, {
				type: 'INSERT_BLOCKS',
				blocks: [ {
					uid: 'ribs',
					name: 'core/freeform',
				} ],
			} );

			expect( state3 ).toEqual( { start: 'ribs', end: 'ribs', focus: {}, isMultiSelecting: false } );
		} );

		it( 'should not update the state if the block moved is already selected', () => {
			const original = deepFreeze( { start: 'ribs', end: 'ribs', focus: {} } );
			const state = blockSelection( original, {
				type: 'MOVE_BLOCKS_UP',
				uids: [ 'ribs' ],
			} );

			expect( state ).toBe( original );
		} );

		it( 'should update the focus and selects the block', () => {
			const state = blockSelection( undefined, {
				type: 'UPDATE_FOCUS',
				uid: 'chicken',
				config: { editable: 'citation' },
			} );

			expect( state ).toEqual( {
				start: 'chicken',
				end: 'chicken',
				focus: { editable: 'citation' },
				isMultiSelecting: false,
				isEnabled: true,
			} );
		} );

		it( 'should update the focus and merge the existing state', () => {
			const original = deepFreeze( { start: 'ribs', end: 'ribs', focus: {}, isMultiSelecting: true } );
			const state = blockSelection( original, {
				type: 'UPDATE_FOCUS',
				uid: 'ribs',
				config: { editable: 'citation' },
			} );

			expect( state ).toEqual( { start: 'ribs', end: 'ribs', focus: { editable: 'citation' }, isMultiSelecting: true } );
		} );

		it( 'should replace the selected block', () => {
			const original = deepFreeze( { start: 'chicken', end: 'chicken', focus: { editable: 'citation' } } );
			const state = blockSelection( original, {
				type: 'REPLACE_BLOCKS',
				uids: [ 'chicken' ],
				blocks: [ {
					uid: 'wings',
					name: 'core/freeform',
				} ],
			} );

			expect( state ).toEqual( { start: 'wings', end: 'wings', focus: {}, isMultiSelecting: false } );
		} );

		it( 'should keep the selected block', () => {
			const original = deepFreeze( { start: 'chicken', end: 'chicken', focus: { editable: 'citation' } } );
			const state = blockSelection( original, {
				type: 'REPLACE_BLOCKS',
				uids: [ 'ribs' ],
				blocks: [ {
					uid: 'wings',
					name: 'core/freeform',
				} ],
			} );

			expect( state ).toBe( original );
		} );
	} );

	describe( 'preferences()', () => {
		it( 'should apply all defaults', () => {
			const state = preferences( undefined, {} );

			expect( state ).toEqual( {
				blockUsage: {},
				recentlyUsedBlocks: [],
				mode: 'visual',
				isSidebarOpened: true,
				isSidebarOpenedMobile: false,
				panels: { 'post-status': true },
				features: { fixedToolbar: false },
			} );
		} );

		it( 'should toggle the sidebar open flag', () => {
			const state = preferences( deepFreeze( { isSidebarOpened: false } ), {
				type: 'TOGGLE_SIDEBAR',
			} );

			expect( state ).toEqual( { isSidebarOpened: true } );
		} );

		it( 'should toggle the mobile sidebar open flag', () => {
			const state = preferences( deepFreeze( { isSidebarOpenedMobile: false } ), {
				type: 'TOGGLE_SIDEBAR',
				isMobile: true,
			} );

			expect( state ).toEqual( { isSidebarOpenedMobile: true } );
		} );

		it( 'should set the sidebar panel open flag to true if unset', () => {
			const state = preferences( deepFreeze( { isSidebarOpened: false } ), {
				type: 'TOGGLE_SIDEBAR_PANEL',
				panel: 'post-taxonomies',
			} );

			expect( state ).toEqual( { isSidebarOpened: false, panels: { 'post-taxonomies': true } } );
		} );

		it( 'should toggle the sidebar panel open flag', () => {
			const state = preferences( deepFreeze( { isSidebarOpened: false, panels: { 'post-taxonomies': true } } ), {
				type: 'TOGGLE_SIDEBAR_PANEL',
				panel: 'post-taxonomies',
			} );

			expect( state ).toEqual( { isSidebarOpened: false, panels: { 'post-taxonomies': false } } );
		} );

		it( 'should return switched mode', () => {
			const state = preferences( deepFreeze( { isSidebarOpened: false } ), {
				type: 'SWITCH_MODE',
				mode: 'text',
			} );

			expect( state ).toEqual( { isSidebarOpened: false, mode: 'text' } );
		} );

		it( 'should record recently used blocks', () => {
			const state = preferences( deepFreeze( { recentlyUsedBlocks: [], blockUsage: {} } ), {
				type: 'INSERT_BLOCKS',
				blocks: [ {
					uid: 'bacon',
					name: 'core-embed/twitter',
				} ],
			} );

			expect( state.recentlyUsedBlocks[ 0 ] ).toEqual( 'core-embed/twitter' );

			const twoRecentBlocks = preferences( deepFreeze( { recentlyUsedBlocks: [], blockUsage: {} } ), {
				type: 'INSERT_BLOCKS',
				blocks: [ {
					uid: 'eggs',
					name: 'core-embed/twitter',
				}, {
					uid: 'bacon',
					name: 'core-embed/youtube',
				} ],
			} );

			expect( twoRecentBlocks.recentlyUsedBlocks[ 0 ] ).toEqual( 'core-embed/youtube' );
			expect( twoRecentBlocks.recentlyUsedBlocks[ 1 ] ).toEqual( 'core-embed/twitter' );
		} );

		it( 'should record block usage', () => {
			const state = preferences( deepFreeze( { recentlyUsedBlocks: [], blockUsage: {} } ), {
				type: 'INSERT_BLOCKS',
				blocks: [ {
					uid: 'eggs',
					name: 'core-embed/twitter',
				}, {
					uid: 'bacon',
					name: 'core-embed/youtube',
				}, {
					uid: 'milk',
					name: 'core-embed/youtube',
				} ],
			} );

			expect( state.blockUsage ).toEqual( { 'core-embed/youtube': 2, 'core-embed/twitter': 1 } );
		} );

		it( 'should populate recentlyUsedBlocks, filling up with common blocks, on editor setup', () => {
			const state = preferences( deepFreeze( { recentlyUsedBlocks: [ 'core-embed/twitter', 'core-embed/youtube' ] } ), {
				type: 'SETUP_EDITOR',
			} );

			expect( state.recentlyUsedBlocks[ 0 ] ).toEqual( 'core-embed/twitter' );
			expect( state.recentlyUsedBlocks[ 1 ] ).toEqual( 'core-embed/youtube' );

			state.recentlyUsedBlocks.slice( 2 ).forEach(
				block => expect( getBlockType( block ).category ).toEqual( 'common' )
			);
			expect( state.recentlyUsedBlocks ).toHaveLength( 8 );
		} );

		it( 'should remove unregistered blocks from persisted recent usage', () => {
			const state = preferences( deepFreeze( { recentlyUsedBlocks: [ 'core-embed/i-do-not-exist', 'core-embed/youtube' ] } ), {
				type: 'SETUP_EDITOR',
			} );
			expect( state.recentlyUsedBlocks[ 0 ] ).toEqual( 'core-embed/youtube' );
		} );

		it( 'should remove unregistered blocks from persisted block usage stats', () => {
			const state = preferences( deepFreeze( { recentlyUsedBlocks: [], blockUsage: { 'core/i-do-not-exist': 42, 'core-embed/youtube': 88 } } ), {
				type: 'SETUP_EDITOR',
			} );
			expect( state.blockUsage ).toEqual( { 'core-embed/youtube': 88 } );
		} );

		it( 'should toggle a feature flag', () => {
			const state = preferences( deepFreeze( { features: { chicken: true } } ), {
				type: 'TOGGLE_FEATURE',
				feature: 'chicken',
			} );
			expect( state ).toEqual( { features: { chicken: false } } );
		} );
	} );

	describe( 'saving()', () => {
		it( 'should update when a request is started', () => {
			const state = saving( null, {
				type: 'REQUEST_POST_UPDATE',
			} );
			expect( state ).toEqual( {
				requesting: true,
				successful: false,
				error: null,
			} );
		} );

		it( 'should update when a request succeeds', () => {
			const state = saving( null, {
				type: 'REQUEST_POST_UPDATE_SUCCESS',
			} );
			expect( state ).toEqual( {
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
			expect( state ).toEqual( {
				requesting: false,
				successful: false,
				error: {
					code: 'pretend_error',
					message: 'update failed',
				},
			} );
		} );
	} );

	describe( 'notices()', () => {
		it( 'should create a notice', () => {
			const originalState = [
				{
					id: 'b',
					content: 'Error saving',
					status: 'error',
				},
			];
			const state = notices( deepFreeze( originalState ), {
				type: 'CREATE_NOTICE',
				notice: {
					id: 'a',
					content: 'Post saved',
					status: 'success',
				},
			} );
			expect( state ).toEqual( [
				originalState[ 0 ],
				{
					id: 'a',
					content: 'Post saved',
					status: 'success',
				},
			] );
		} );

		it( 'should remove a notice', () => {
			const originalState = [
				{
					id: 'a',
					content: 'Post saved',
					status: 'success',
				},
				{
					id: 'b',
					content: 'Error saving',
					status: 'error',
				},
			];
			const state = notices( deepFreeze( originalState ), {
				type: 'REMOVE_NOTICE',
				noticeId: 'a',
			} );
			expect( state ).toEqual( [
				originalState[ 1 ],
			] );
		} );

		it( 'should dedupe distinct ids', () => {
			const originalState = [
				{
					id: 'a',
					content: 'Post saved',
					status: 'success',
				},
				{
					id: 'b',
					content: 'Error saving',
					status: 'error',
				},
			];
			const state = notices( deepFreeze( originalState ), {
				type: 'CREATE_NOTICE',
				notice: {
					id: 'a',
					content: 'Post updated',
					status: 'success',
				},
			} );
			expect( state ).toEqual( [
				{
					id: 'b',
					content: 'Error saving',
					status: 'error',
				},
				{
					id: 'a',
					content: 'Post updated',
					status: 'success',
				},
			] );
		} );
	} );

	describe( 'blocksMode', () => {
		it( 'should set mode to html if not set', () => {
			const action = {
				type: 'TOGGLE_BLOCK_MODE',
				uid: 'chicken',
			};
			const value = blocksMode( deepFreeze( {} ), action );

			expect( value ).toEqual( { chicken: 'html' } );
		} );

		it( 'should toggle mode to visual if set as html', () => {
			const action = {
				type: 'TOGGLE_BLOCK_MODE',
				uid: 'chicken',
			};
			const value = blocksMode( deepFreeze( { chicken: 'html' } ), action );

			expect( value ).toEqual( { chicken: 'visual' } );
		} );
	} );

	describe( 'metaBoxes()', () => {
		it( 'should return default state', () => {
			const actual = metaBoxes( undefined, {} );
			const expected = {
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

			expect( actual ).toEqual( expected );
		} );
		it( 'should set the sidebar to active', () => {
			const theMetaBoxes = {
				normal: false,
				advanced: false,
				side: true,
			};

			const action = {
				type: 'INITIALIZE_META_BOX_STATE',
				metaBoxes: theMetaBoxes,
			};

			const actual = metaBoxes( undefined, action );
			const expected = {
				normal: {
					isActive: false,
					isDirty: false,
					isUpdating: false,
					isLoaded: false,
				},
				side: {
					isActive: true,
					isDirty: false,
					isUpdating: false,
					isLoaded: false,
				},
			};

			expect( actual ).toEqual( expected );
		} );
		it( 'should switch updating to off', () => {
			const action = {
				type: 'HANDLE_META_BOX_RELOAD',
				location: 'normal',
			};

			const theMetaBoxes = metaBoxes( { normal: { isUpdating: true, isActive: false, isDirty: true } }, action );
			const actual = theMetaBoxes.normal;
			const expected = {
				isActive: false,
				isUpdating: false,
				isDirty: false,
			};

			expect( actual ).toEqual( expected );
		} );
		it( 'should switch updating to on', () => {
			const action = {
				type: 'REQUEST_META_BOX_UPDATES',
				locations: [ 'normal' ],
			};

			const theMetaBoxes = metaBoxes( undefined, action );
			const actual = theMetaBoxes.normal;
			const expected = {
				isActive: false,
				isUpdating: true,
				isDirty: false,
			};

			expect( actual ).toEqual( expected );
		} );
		it( 'should return with the isDirty flag as true', () => {
			const action = {
				type: 'META_BOX_STATE_CHANGED',
				location: 'normal',
				hasChanged: true,
			};
			const theMetaBoxes = metaBoxes( undefined, action );
			const actual = theMetaBoxes.normal;
			const expected = {
				isActive: false,
				isDirty: true,
				isUpdating: false,
			};

			expect( actual ).toEqual( expected );
		} );
	} );

	describe( 'reusableBlocks()', () => {
		it( 'should start out empty', () => {
			const state = reusableBlocks( undefined, {} );
			expect( state ).toEqual( {
				data: {},
				isSaving: {},
			} );
		} );

		it( 'should add fetched reusable blocks', () => {
			const reusableBlock = {
				id: '358b59ee-bab3-4d6f-8445-e8c6971a5605',
				name: 'My cool block',
				type: 'core/paragraph',
				attributes: {
					content: 'Hello!',
				},
			};

			const state = reusableBlocks( {}, {
				type: 'FETCH_REUSABLE_BLOCKS_SUCCESS',
				reusableBlocks: [ reusableBlock ],
			} );

			expect( state ).toEqual( {
				data: {
					[ reusableBlock.id ]: reusableBlock,
				},
				isSaving: {},
			} );
		} );

		it( 'should add a reusable block', () => {
			const reusableBlock = {
				id: '358b59ee-bab3-4d6f-8445-e8c6971a5605',
				name: 'My cool block',
				type: 'core/paragraph',
				attributes: {
					content: 'Hello!',
				},
			};

			const state = reusableBlocks( {}, {
				type: 'UPDATE_REUSABLE_BLOCK',
				id: reusableBlock.id,
				reusableBlock,
			} );

			expect( state ).toEqual( {
				data: {
					[ reusableBlock.id ]: reusableBlock,
				},
				isSaving: {},
			} );
		} );

		it( 'should update a reusable block', () => {
			const id = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
			const initialState = {
				data: {
					[ id ]: {
						id,
						name: 'My cool block',
						type: 'core/paragraph',
						attributes: {
							content: 'Hello!',
							dropCap: true,
						},
					},
				},
				isSaving: {},
			};

			const state = reusableBlocks( initialState, {
				type: 'UPDATE_REUSABLE_BLOCK',
				id,
				reusableBlock: {
					name: 'My better block',
					attributes: {
						content: 'Yo!',
					},
				},
			} );

			expect( state ).toEqual( {
				data: {
					[ id ]: {
						id,
						name: 'My better block',
						type: 'core/paragraph',
						attributes: {
							content: 'Yo!',
							dropCap: true,
						},
					},
				},
				isSaving: {},
			} );
		} );

		it( 'should update the reusable block\'s id if it was temporary', () => {
			const id = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
			const initialState = {
				data: {
					[ id ]: {
						id,
						isTemporary: true,
						name: 'My cool block',
						type: 'core/paragraph',
						attributes: {
							content: 'Hello!',
							dropCap: true,
						},
					},
				},
				isSaving: {},
			};

			const state = reusableBlocks( initialState, {
				type: 'SAVE_REUSABLE_BLOCK_SUCCESS',
				id,
				updatedId: 3,
			} );

			expect( state ).toEqual( {
				data: {
					3: {
						id: 3,
						name: 'My cool block',
						type: 'core/paragraph',
						attributes: {
							content: 'Hello!',
							dropCap: true,
						},
					},
				},
				isSaving: {},
			} );
		} );

		it( 'should indicate that a reusable block is saving', () => {
			const id = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
			const initialState = {
				data: {},
				isSaving: {},
			};

			const state = reusableBlocks( initialState, {
				type: 'SAVE_REUSABLE_BLOCK',
				id,
			} );

			expect( state ).toEqual( {
				data: {},
				isSaving: {
					[ id ]: true,
				},
			} );
		} );

		it( 'should stop indicating that a reusable block is saving when the save succeeded', () => {
			const id = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
			const initialState = {
				data: {
					[ id ]: { id },
				},
				isSaving: {
					[ id ]: true,
				},
			};

			const state = reusableBlocks( initialState, {
				type: 'SAVE_REUSABLE_BLOCK_SUCCESS',
				id,
				updatedId: id,
			} );

			expect( state ).toEqual( {
				data: {
					[ id ]: { id },
				},
				isSaving: {},
			} );
		} );

		it( 'should stop indicating that a reusable block is saving when there is an error', () => {
			const id = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
			const initialState = {
				data: {},
				isSaving: {
					[ id ]: true,
				},
			};

			const state = reusableBlocks( initialState, {
				type: 'SAVE_REUSABLE_BLOCK_FAILURE',
				id,
			} );

			expect( state ).toEqual( {
				data: {},
				isSaving: {},
			} );
		} );
	} );
} );
