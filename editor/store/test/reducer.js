/**
 * External dependencies
 */
import { values, noop } from 'lodash';
import deepFreeze from 'deep-freeze';

/**
 * WordPress dependencies
 */
import {
	registerCoreBlocks,
	registerBlockType,
	unregisterBlockType,
	createBlock,
} from '@wordpress/blocks';

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
	isInsertionPointVisible,
	isSavingMetaBoxes,
	metaBoxes,
	reusableBlocks,
} from '../reducer';

jest.mock( '../../utils/meta-boxes', () => {
	return {
		getMetaBoxContainer: () => ( { innerHTML: 'meta boxes content' } ),
	};
} );

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
			expect( state.present.blockOrder ).toEqual( {} );
			expect( state.isDirty ).toBe( false );
		} );

		it( 'should key by reset blocks uid', () => {
			const original = editor( undefined, {} );
			const state = editor( original, {
				type: 'RESET_BLOCKS',
				blocks: [ { uid: 'bananas', innerBlocks: [] } ],
			} );

			expect( Object.keys( state.present.blocksByUid ) ).toHaveLength( 1 );
			expect( values( state.present.blocksByUid )[ 0 ].uid ).toBe( 'bananas' );
			expect( state.present.blockOrder ).toEqual( {
				'': [ 'bananas' ],
				bananas: [],
			} );
		} );

		it( 'should key by reset blocks uid, including inner blocks', () => {
			const original = editor( undefined, {} );
			const state = editor( original, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'bananas',
					innerBlocks: [ { uid: 'apples', innerBlocks: [] } ],
				} ],
			} );

			expect( Object.keys( state.present.blocksByUid ) ).toHaveLength( 2 );
			expect( state.present.blockOrder ).toEqual( {
				'': [ 'bananas' ],
				apples: [],
				bananas: [ 'apples' ],
			} );
		} );

		it( 'should insert block', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'chicken',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
			const state = editor( original, {
				type: 'INSERT_BLOCKS',
				blocks: [ {
					uid: 'ribs',
					name: 'core/freeform',
					innerBlocks: [],
				} ],
			} );

			expect( Object.keys( state.present.blocksByUid ) ).toHaveLength( 2 );
			expect( values( state.present.blocksByUid )[ 1 ].uid ).toBe( 'ribs' );
			expect( state.present.blockOrder ).toEqual( {
				'': [ 'chicken', 'ribs' ],
				chicken: [],
				ribs: [],
			} );
		} );

		it( 'should replace the block', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'chicken',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
			const state = editor( original, {
				type: 'REPLACE_BLOCKS',
				uids: [ 'chicken' ],
				blocks: [ {
					uid: 'wings',
					name: 'core/freeform',
					innerBlocks: [],
				} ],
			} );

			expect( Object.keys( state.present.blocksByUid ) ).toHaveLength( 1 );
			expect( values( state.present.blocksByUid )[ 0 ].name ).toBe( 'core/freeform' );
			expect( values( state.present.blocksByUid )[ 0 ].uid ).toBe( 'wings' );
			expect( state.present.blockOrder ).toEqual( {
				'': [ 'wings' ],
				wings: [],
			} );
		} );

		it( 'should replace the nested block', () => {
			const nestedBlock = createBlock( 'core/test-block' );
			const wrapperBlock = createBlock( 'core/test-block', {}, [ nestedBlock ] );
			const replacementBlock = createBlock( 'core/test-block' );
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ wrapperBlock ],
			} );

			const state = editor( original, {
				type: 'REPLACE_BLOCKS',
				uids: [ nestedBlock.uid ],
				blocks: [ replacementBlock ],
			} );

			expect( state.present.blockOrder ).toEqual( {
				'': [ wrapperBlock.uid ],
				[ wrapperBlock.uid ]: [ replacementBlock.uid ],
				[ replacementBlock.uid ]: [],
			} );
		} );

		it( 'should update the block', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'chicken',
					name: 'core/test-block',
					attributes: {},
					isValid: false,
					innerBlocks: [],
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
					innerBlocks: [],
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
					innerBlocks: [],
				}, {
					uid: 'ribs',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCKS_UP',
				uids: [ 'ribs' ],
			} );

			expect( state.present.blockOrder[ '' ] ).toEqual( [ 'ribs', 'chicken' ] );
		} );

		it( 'should move the nested block up', () => {
			const movedBlock = createBlock( 'core/test-block' );
			const siblingBlock = createBlock( 'core/test-block' );
			const wrapperBlock = createBlock( 'core/test-block', {}, [ siblingBlock, movedBlock ] );
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ wrapperBlock ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCKS_UP',
				uids: [ movedBlock.uid ],
				rootUID: wrapperBlock.uid,
			} );

			expect( state.present.blockOrder ).toEqual( {
				'': [ wrapperBlock.uid ],
				[ wrapperBlock.uid ]: [ movedBlock.uid, siblingBlock.uid ],
				[ movedBlock.uid ]: [],
				[ siblingBlock.uid ]: [],
			} );
		} );

		it( 'should move multiple blocks up', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'chicken',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					uid: 'ribs',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					uid: 'veggies',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCKS_UP',
				uids: [ 'ribs', 'veggies' ],
			} );

			expect( state.present.blockOrder[ '' ] ).toEqual( [ 'ribs', 'veggies', 'chicken' ] );
		} );

		it( 'should move multiple nested blocks up', () => {
			const movedBlockA = createBlock( 'core/test-block' );
			const movedBlockB = createBlock( 'core/test-block' );
			const siblingBlock = createBlock( 'core/test-block' );
			const wrapperBlock = createBlock( 'core/test-block', {}, [ siblingBlock, movedBlockA, movedBlockB ] );
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ wrapperBlock ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCKS_UP',
				uids: [ movedBlockA.uid, movedBlockB.uid ],
				rootUID: wrapperBlock.uid,
			} );

			expect( state.present.blockOrder ).toEqual( {
				'': [ wrapperBlock.uid ],
				[ wrapperBlock.uid ]: [ movedBlockA.uid, movedBlockB.uid, siblingBlock.uid ],
				[ movedBlockA.uid ]: [],
				[ movedBlockB.uid ]: [],
				[ siblingBlock.uid ]: [],
			} );
		} );

		it( 'should not move the first block up', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'chicken',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					uid: 'ribs',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
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
					innerBlocks: [],
				}, {
					uid: 'ribs',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCKS_DOWN',
				uids: [ 'chicken' ],
			} );

			expect( state.present.blockOrder[ '' ] ).toEqual( [ 'ribs', 'chicken' ] );
		} );

		it( 'should move the nested block down', () => {
			const movedBlock = createBlock( 'core/test-block' );
			const siblingBlock = createBlock( 'core/test-block' );
			const wrapperBlock = createBlock( 'core/test-block', {}, [ movedBlock, siblingBlock ] );
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ wrapperBlock ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCKS_DOWN',
				uids: [ movedBlock.uid ],
				rootUID: wrapperBlock.uid,
			} );

			expect( state.present.blockOrder ).toEqual( {
				'': [ wrapperBlock.uid ],
				[ wrapperBlock.uid ]: [ siblingBlock.uid, movedBlock.uid ],
				[ movedBlock.uid ]: [],
				[ siblingBlock.uid ]: [],
			} );
		} );

		it( 'should move multiple blocks down', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'chicken',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					uid: 'ribs',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					uid: 'veggies',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCKS_DOWN',
				uids: [ 'chicken', 'ribs' ],
			} );

			expect( state.present.blockOrder[ '' ] ).toEqual( [ 'veggies', 'chicken', 'ribs' ] );
		} );

		it( 'should move multiple nested blocks down', () => {
			const movedBlockA = createBlock( 'core/test-block' );
			const movedBlockB = createBlock( 'core/test-block' );
			const siblingBlock = createBlock( 'core/test-block' );
			const wrapperBlock = createBlock( 'core/test-block', {}, [ movedBlockA, movedBlockB, siblingBlock ] );
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ wrapperBlock ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCKS_DOWN',
				uids: [ movedBlockA.uid, movedBlockB.uid ],
				rootUID: wrapperBlock.uid,
			} );

			expect( state.present.blockOrder ).toEqual( {
				'': [ wrapperBlock.uid ],
				[ wrapperBlock.uid ]: [ siblingBlock.uid, movedBlockA.uid, movedBlockB.uid ],
				[ movedBlockA.uid ]: [],
				[ movedBlockB.uid ]: [],
				[ siblingBlock.uid ]: [],
			} );
		} );

		it( 'should not move the last block down', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'chicken',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					uid: 'ribs',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
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
					innerBlocks: [],
				}, {
					uid: 'ribs',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
			const state = editor( original, {
				type: 'REMOVE_BLOCKS',
				uids: [ 'chicken' ],
			} );

			expect( state.present.blockOrder[ '' ] ).toEqual( [ 'ribs' ] );
			expect( state.present.blockOrder ).not.toHaveProperty( 'chicken' );
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
					innerBlocks: [],
				}, {
					uid: 'ribs',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					uid: 'veggies',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
			const state = editor( original, {
				type: 'REMOVE_BLOCKS',
				uids: [ 'chicken', 'veggies' ],
			} );

			expect( state.present.blockOrder[ '' ] ).toEqual( [ 'ribs' ] );
			expect( state.present.blockOrder ).not.toHaveProperty( 'chicken' );
			expect( state.present.blockOrder ).not.toHaveProperty( 'veggies' );
			expect( state.present.blocksByUid ).toEqual( {
				ribs: {
					uid: 'ribs',
					name: 'core/test-block',
					attributes: {},
				},
			} );
		} );

		it( 'should insert at the specified index', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'kumquat',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					uid: 'loquat',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );

			const state = editor( original, {
				type: 'INSERT_BLOCKS',
				index: 1,
				blocks: [ {
					uid: 'persimmon',
					name: 'core/freeform',
					innerBlocks: [],
				} ],
			} );

			expect( Object.keys( state.present.blocksByUid ) ).toHaveLength( 3 );
			expect( state.present.blockOrder[ '' ] ).toEqual( [ 'kumquat', 'persimmon', 'loquat' ] );
		} );

		it( 'should remove associated blocks when deleting a reusable block', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'chicken',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					uid: 'ribs',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
			const state = editor( original, {
				type: 'REMOVE_REUSABLE_BLOCK',
				id: 123,
				associatedBlockUids: [ 'chicken', 'veggies' ],
			} );

			expect( state.present.blockOrder[ '' ] ).toEqual( [ 'ribs' ] );
			expect( state.present.blocksByUid ).toEqual( {
				ribs: {
					uid: 'ribs',
					name: 'core/test-block',
					attributes: {},
				},
			} );
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
						innerBlocks: [],
					}, {
						uid: 'loquat',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
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
						innerBlocks: [],
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
						innerBlocks: [],
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
						innerBlocks: [],
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
					innerBlocks: [],
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
					innerBlocks: [],
				} ],
			} );

			expect( state ).toBe( 'chicken' );
		} );
	} );

	describe( 'isInsertionPointVisible', () => {
		it( 'should default to false', () => {
			const state = isInsertionPointVisible( undefined, {} );

			expect( state ).toBe( false );
		} );

		it( 'should set insertion point visible', () => {
			const state = isInsertionPointVisible( false, {
				type: 'SHOW_INSERTION_POINT',
			} );

			expect( state ).toBe( true );
		} );

		it( 'should clear the insertion point', () => {
			const state = isInsertionPointVisible( true, {
				type: 'HIDE_INSERTION_POINT',
			} );

			expect( state ).toBe( false );
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

		it( 'should return same reference if already multi-selecting', () => {
			const original = deepFreeze( { start: 'ribs', end: 'ribs', focus: { editable: 'citation' }, isMultiSelecting: true } );
			const state = blockSelection( original, {
				type: 'START_MULTI_SELECT',
			} );

			expect( state ).toBe( original );
		} );

		it( 'should end multi selection with selection', () => {
			const original = deepFreeze( { start: 'ribs', end: 'chicken', focus: { editable: 'citation' }, isMultiSelecting: true } );
			const state = blockSelection( original, {
				type: 'STOP_MULTI_SELECT',
			} );

			expect( state ).toEqual( { start: 'ribs', end: 'chicken', focus: null, isMultiSelecting: false } );
		} );

		it( 'should return same reference if already ended multi-selecting', () => {
			const original = deepFreeze( { start: 'ribs', end: 'chicken', focus: null, isMultiSelecting: false } );
			const state = blockSelection( original, {
				type: 'STOP_MULTI_SELECT',
			} );

			expect( state ).toBe( original );
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

		it( 'should unset multi selection', () => {
			const original = deepFreeze( { start: 'ribs', end: 'chicken' } );

			const state1 = blockSelection( original, {
				type: 'CLEAR_SELECTED_BLOCK',
			} );

			expect( state1 ).toEqual( { start: null, end: null, focus: null, isMultiSelecting: false } );
		} );

		it( 'should return same reference if clearing selection but no selection', () => {
			const original = deepFreeze( { start: null, end: null, focus: null, isMultiSelecting: false } );

			const state1 = blockSelection( original, {
				type: 'CLEAR_SELECTED_BLOCK',
			} );

			expect( state1 ).toBe( original );
		} );

		it( 'should select inserted block', () => {
			const original = deepFreeze( { start: 'ribs', end: 'chicken' } );

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
		beforeAll( () => {
			registerCoreBlocks();
		} );

		it( 'should apply all defaults', () => {
			const state = preferences( undefined, {} );

			expect( state ).toEqual( {
				recentInserts: [],
			} );
		} );

		it( 'should record recently used blocks', () => {
			const state = preferences( deepFreeze( { recentInserts: [] } ), {
				type: 'INSERT_BLOCKS',
				blocks: [ {
					uid: 'bacon',
					name: 'core-embed/twitter',
				} ],
			} );

			expect( state ).toEqual( {
				recentInserts: [
					{ name: 'core-embed/twitter' },
				],
			} );

			const twoRecentBlocks = preferences( deepFreeze( { recentInserts: [] } ), {
				type: 'INSERT_BLOCKS',
				blocks: [ {
					uid: 'eggs',
					name: 'core-embed/twitter',
				}, {
					uid: 'bacon',
					name: 'core/block',
					attributes: { ref: 123 },
				} ],
			} );

			expect( twoRecentBlocks ).toEqual( {
				recentInserts: [
					{ name: 'core/block', ref: 123 },
					{ name: 'core-embed/twitter' },
				],
			} );
		} );

		it( 'should remove recorded reusable blocks that are deleted', () => {
			const initialState = {
				recentInserts: [
					{ name: 'core-embed/twitter' },
					{ name: 'core/block', ref: 123 },
					{ name: 'core/block', ref: 456 },
				],
			};

			const state = preferences( deepFreeze( initialState ), {
				type: 'REMOVE_REUSABLE_BLOCK',
				id: 123,
			} );

			expect( state ).toEqual( {
				recentInserts: [
					{ name: 'core-embed/twitter' },
					{ name: 'core/block', ref: 456 },
				],
			} );
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

	describe( 'isSavingMetaBoxes', () => {
		it( 'should return default state', () => {
			const actual = isSavingMetaBoxes( undefined, {} );
			expect( actual ).toBe( false );
		} );

		it( 'should set saving flag to true', () => {
			const action = {
				type: 'REQUEST_META_BOX_UPDATES',
			};
			const actual = isSavingMetaBoxes( false, action );

			expect( actual ).toBe( true );
		} );

		it( 'should set saving flag to false', () => {
			const action = {
				type: 'META_BOX_UPDATES_SUCCESS',
			};
			const actual = isSavingMetaBoxes( true, action );

			expect( actual ).toBe( false );
		} );
	} );

	describe( 'metaBoxes()', () => {
		it( 'should return default state', () => {
			const actual = metaBoxes( undefined, {} );
			const expected = {
				normal: {
					isActive: false,
				},
				side: {
					isActive: false,
				},
				advanced: {
					isActive: false,
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
				},
				side: {
					isActive: true,
				},
				advanced: {
					isActive: false,
				},
			};

			expect( actual ).toEqual( expected );
		} );

		it( 'should set the meta boxes saved data', () => {
			const action = {
				type: 'META_BOX_SET_SAVED_DATA',
				dataPerLocation: {
					side: 'a=b',
				},
			};

			const theMetaBoxes = metaBoxes( { normal: { isActive: true }, side: { isActive: false } }, action );
			expect( theMetaBoxes ).toEqual( {
				advanced: { data: undefined },
				normal: { isActive: true, data: undefined },
				side: { isActive: false, data: 'a=b' },
			} );
		} );
	} );

	describe( 'reusableBlocks()', () => {
		it( 'should start out empty', () => {
			const state = reusableBlocks( undefined, {} );
			expect( state ).toEqual( {
				data: {},
				isFetching: {},
				isSaving: {},
			} );
		} );

		it( 'should add fetched reusable blocks', () => {
			const reusableBlock = {
				id: 123,
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
				isFetching: {},
				isSaving: {},
			} );
		} );

		it( 'should add a reusable block', () => {
			const reusableBlock = {
				id: 123,
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
				isFetching: {},
				isSaving: {},
			} );
		} );

		it( 'should update a reusable block', () => {
			const id = 123;
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
				isFetching: {},
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
				isFetching: {},
				isSaving: {},
			} );
		} );

		it( 'should update the reusable block\'s id if it was temporary', () => {
			const id = 123;
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
				isFetching: {},
				isSaving: {},
			} );
		} );

		it( 'should remove a reusable block', () => {
			const id = 123;
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
				isFetching: {},
				isSaving: {},
			};

			const state = reusableBlocks( deepFreeze( initialState ), {
				type: 'REMOVE_REUSABLE_BLOCK',
				id,
			} );

			expect( state ).toEqual( {
				data: {},
				isFetching: {},
				isSaving: {},
			} );
		} );

		it( 'should indicate that a reusable block is fetching', () => {
			const id = 123;
			const initialState = {
				data: {},
				isFetching: {},
				isSaving: {},
			};

			const state = reusableBlocks( initialState, {
				type: 'FETCH_REUSABLE_BLOCKS',
				id,
			} );

			expect( state ).toEqual( {
				data: {},
				isFetching: {
					[ id ]: true,
				},
				isSaving: {},
			} );
		} );

		it( 'should stop indicating that a reusable block is saving when the fetch succeeded', () => {
			const id = 123;
			const initialState = {
				data: {
					[ id ]: { id },
				},
				isFetching: {
					[ id ]: true,
				},
				isSaving: {},
			};

			const state = reusableBlocks( initialState, {
				type: 'FETCH_REUSABLE_BLOCKS_SUCCESS',
				id,
				updatedId: id,
			} );

			expect( state ).toEqual( {
				data: {
					[ id ]: { id },
				},
				isFetching: {},
				isSaving: {},
			} );
		} );

		it( 'should stop indicating that a reusable block is fetching when there is an error', () => {
			const id = 123;
			const initialState = {
				data: {},
				isFetching: {
					[ id ]: true,
				},
				isSaving: {},
			};

			const state = reusableBlocks( initialState, {
				type: 'FETCH_REUSABLE_BLOCKS_FAILURE',
				id,
			} );

			expect( state ).toEqual( {
				data: {},
				isFetching: {},
				isSaving: {},
			} );
		} );

		it( 'should indicate that a reusable block is saving', () => {
			const id = 123;
			const initialState = {
				data: {},
				isFetching: {},
				isSaving: {},
			};

			const state = reusableBlocks( initialState, {
				type: 'SAVE_REUSABLE_BLOCK',
				id,
			} );

			expect( state ).toEqual( {
				data: {},
				isFetching: {},
				isSaving: {
					[ id ]: true,
				},
			} );
		} );

		it( 'should stop indicating that a reusable block is saving when the save succeeded', () => {
			const id = 123;
			const initialState = {
				data: {
					[ id ]: { id },
				},
				isFetching: {},
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
				isFetching: {},
				isSaving: {},
			} );
		} );

		it( 'should stop indicating that a reusable block is saving when there is an error', () => {
			const id = 123;
			const initialState = {
				data: {},
				isFetching: {},
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
				isFetching: {},
				isSaving: {},
			} );
		} );
	} );
} );
