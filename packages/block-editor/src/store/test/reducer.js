/**
 * External dependencies
 */
import { values, noop } from 'lodash';
import deepFreeze from 'deep-freeze';

/**
 * WordPress dependencies
 */
import {
	registerBlockType,
	unregisterBlockType,
	createBlock,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
	editor,
	isTyping,
	isCaretWithinFormattedText,
	blockSelection,
	preferences,
	blocksMode,
	insertionPoint,
	template,
	blockListSettings,
} from '../reducer';

describe( 'state', () => {
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

		it( 'should return empty edits, blocks by default', () => {
			const state = editor( undefined, {} );

			expect( state.blocks.byClientId ).toEqual( {} );
			expect( state.blocks.order ).toEqual( {} );
		} );

		it( 'should key by reset blocks clientId', () => {
			[
				undefined,
				editor( undefined, {} ),
			].forEach( ( original ) => {
				const state = editor( original, {
					type: 'RESET_BLOCKS',
					blocks: [ { clientId: 'bananas', innerBlocks: [] } ],
				} );

				expect( Object.keys( state.blocks.byClientId ) ).toHaveLength( 1 );
				expect( values( state.blocks.byClientId )[ 0 ].clientId ).toBe( 'bananas' );
				expect( state.blocks.order ).toEqual( {
					'': [ 'bananas' ],
					bananas: [],
				} );
			} );
		} );

		it( 'should key by reset blocks clientId, including inner blocks', () => {
			const original = editor( undefined, {} );
			const state = editor( original, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					clientId: 'bananas',
					innerBlocks: [ { clientId: 'apples', innerBlocks: [] } ],
				} ],
			} );

			expect( Object.keys( state.blocks.byClientId ) ).toHaveLength( 2 );
			expect( state.blocks.order ).toEqual( {
				'': [ 'bananas' ],
				apples: [],
				bananas: [ 'apples' ],
			} );
		} );

		it( 'should insert block', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					clientId: 'chicken',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
			const state = editor( original, {
				type: 'INSERT_BLOCKS',
				blocks: [ {
					clientId: 'ribs',
					name: 'core/freeform',
					innerBlocks: [],
				} ],
			} );

			expect( Object.keys( state.blocks.byClientId ) ).toHaveLength( 2 );
			expect( values( state.blocks.byClientId )[ 1 ].clientId ).toBe( 'ribs' );
			expect( state.blocks.order ).toEqual( {
				'': [ 'chicken', 'ribs' ],
				chicken: [],
				ribs: [],
			} );
		} );

		it( 'should replace the block', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					clientId: 'chicken',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
			const state = editor( original, {
				type: 'REPLACE_BLOCKS',
				clientIds: [ 'chicken' ],
				blocks: [ {
					clientId: 'wings',
					name: 'core/freeform',
					innerBlocks: [],
				} ],
			} );

			expect( Object.keys( state.blocks.byClientId ) ).toHaveLength( 1 );
			expect( values( state.blocks.byClientId )[ 0 ].name ).toBe( 'core/freeform' );
			expect( values( state.blocks.byClientId )[ 0 ].clientId ).toBe( 'wings' );
			expect( state.blocks.order ).toEqual( {
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
				clientIds: [ nestedBlock.clientId ],
				blocks: [ replacementBlock ],
			} );

			expect( state.blocks.order ).toEqual( {
				'': [ wrapperBlock.clientId ],
				[ wrapperBlock.clientId ]: [ replacementBlock.clientId ],
				[ replacementBlock.clientId ]: [],
			} );
		} );

		it( 'should replace the block even if the new block clientId is the same', () => {
			const originalState = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					clientId: 'chicken',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
			const replacedState = editor( originalState, {
				type: 'REPLACE_BLOCKS',
				clientIds: [ 'chicken' ],
				blocks: [ {
					clientId: 'chicken',
					name: 'core/freeform',
					innerBlocks: [],
				} ],
			} );

			expect( Object.keys( replacedState.blocks.byClientId ) ).toHaveLength( 1 );
			expect( values( originalState.blocks.byClientId )[ 0 ].name ).toBe( 'core/test-block' );
			expect( values( replacedState.blocks.byClientId )[ 0 ].name ).toBe( 'core/freeform' );
			expect( values( replacedState.blocks.byClientId )[ 0 ].clientId ).toBe( 'chicken' );
			expect( replacedState.blocks.order ).toEqual( {
				'': [ 'chicken' ],
				chicken: [],
			} );

			const nestedBlock = {
				clientId: 'chicken',
				name: 'core/test-block',
				attributes: {},
				innerBlocks: [],
			};
			const wrapperBlock = createBlock( 'core/test-block', {}, [ nestedBlock ] );
			const replacementNestedBlock = {
				clientId: 'chicken',
				name: 'core/freeform',
				attributes: {},
				innerBlocks: [],
			};

			const originalNestedState = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ wrapperBlock ],
			} );

			const replacedNestedState = editor( originalNestedState, {
				type: 'REPLACE_BLOCKS',
				clientIds: [ nestedBlock.clientId ],
				blocks: [ replacementNestedBlock ],
			} );

			expect( replacedNestedState.blocks.order ).toEqual( {
				'': [ wrapperBlock.clientId ],
				[ wrapperBlock.clientId ]: [ replacementNestedBlock.clientId ],
				[ replacementNestedBlock.clientId ]: [],
			} );

			expect( originalNestedState.blocks.byClientId.chicken.name ).toBe( 'core/test-block' );
			expect( replacedNestedState.blocks.byClientId.chicken.name ).toBe( 'core/freeform' );
		} );

		it( 'should update the block', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					clientId: 'chicken',
					name: 'core/test-block',
					attributes: {},
					isValid: false,
					innerBlocks: [],
				} ],
			} );
			const state = editor( deepFreeze( original ), {
				type: 'UPDATE_BLOCK',
				clientId: 'chicken',
				updates: {
					attributes: { content: 'ribs' },
					isValid: true,
				},
			} );

			expect( state.blocks.byClientId.chicken ).toEqual( {
				clientId: 'chicken',
				name: 'core/test-block',
				isValid: true,
			} );

			expect( state.blocks.attributes.chicken ).toEqual( {
				content: 'ribs',
			} );
		} );

		it( 'should update the reusable block reference if the temporary id is swapped', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					clientId: 'chicken',
					name: 'core/block',
					attributes: {
						ref: 'random-clientId',
					},
					isValid: false,
					innerBlocks: [],
				} ],
			} );

			const state = editor( deepFreeze( original ), {
				type: 'SAVE_REUSABLE_BLOCK_SUCCESS',
				id: 'random-clientId',
				updatedId: 3,
			} );

			expect( state.blocks.byClientId.chicken ).toEqual( {
				clientId: 'chicken',
				name: 'core/block',
				isValid: false,
			} );

			expect( state.blocks.attributes.chicken ).toEqual( {
				ref: 3,
			} );
		} );

		it( 'should move the block up', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					clientId: 'chicken',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					clientId: 'ribs',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCKS_UP',
				clientIds: [ 'ribs' ],
			} );

			expect( state.blocks.order[ '' ] ).toEqual( [ 'ribs', 'chicken' ] );
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
				clientIds: [ movedBlock.clientId ],
				rootClientId: wrapperBlock.clientId,
			} );

			expect( state.blocks.order ).toEqual( {
				'': [ wrapperBlock.clientId ],
				[ wrapperBlock.clientId ]: [ movedBlock.clientId, siblingBlock.clientId ],
				[ movedBlock.clientId ]: [],
				[ siblingBlock.clientId ]: [],
			} );
		} );

		it( 'should move multiple blocks up', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					clientId: 'chicken',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					clientId: 'ribs',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					clientId: 'veggies',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCKS_UP',
				clientIds: [ 'ribs', 'veggies' ],
			} );

			expect( state.blocks.order[ '' ] ).toEqual( [ 'ribs', 'veggies', 'chicken' ] );
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
				clientIds: [ movedBlockA.clientId, movedBlockB.clientId ],
				rootClientId: wrapperBlock.clientId,
			} );

			expect( state.blocks.order ).toEqual( {
				'': [ wrapperBlock.clientId ],
				[ wrapperBlock.clientId ]: [ movedBlockA.clientId, movedBlockB.clientId, siblingBlock.clientId ],
				[ movedBlockA.clientId ]: [],
				[ movedBlockB.clientId ]: [],
				[ siblingBlock.clientId ]: [],
			} );
		} );

		it( 'should not move the first block up', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					clientId: 'chicken',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					clientId: 'ribs',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCKS_UP',
				clientIds: [ 'chicken' ],
			} );

			expect( state.blocks.order ).toBe( original.blocks.order );
		} );

		it( 'should move the block down', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					clientId: 'chicken',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					clientId: 'ribs',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCKS_DOWN',
				clientIds: [ 'chicken' ],
			} );

			expect( state.blocks.order[ '' ] ).toEqual( [ 'ribs', 'chicken' ] );
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
				clientIds: [ movedBlock.clientId ],
				rootClientId: wrapperBlock.clientId,
			} );

			expect( state.blocks.order ).toEqual( {
				'': [ wrapperBlock.clientId ],
				[ wrapperBlock.clientId ]: [ siblingBlock.clientId, movedBlock.clientId ],
				[ movedBlock.clientId ]: [],
				[ siblingBlock.clientId ]: [],
			} );
		} );

		it( 'should move multiple blocks down', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					clientId: 'chicken',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					clientId: 'ribs',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					clientId: 'veggies',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCKS_DOWN',
				clientIds: [ 'chicken', 'ribs' ],
			} );

			expect( state.blocks.order[ '' ] ).toEqual( [ 'veggies', 'chicken', 'ribs' ] );
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
				clientIds: [ movedBlockA.clientId, movedBlockB.clientId ],
				rootClientId: wrapperBlock.clientId,
			} );

			expect( state.blocks.order ).toEqual( {
				'': [ wrapperBlock.clientId ],
				[ wrapperBlock.clientId ]: [ siblingBlock.clientId, movedBlockA.clientId, movedBlockB.clientId ],
				[ movedBlockA.clientId ]: [],
				[ movedBlockB.clientId ]: [],
				[ siblingBlock.clientId ]: [],
			} );
		} );

		it( 'should not move the last block down', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					clientId: 'chicken',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					clientId: 'ribs',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCKS_DOWN',
				clientIds: [ 'ribs' ],
			} );

			expect( state.blocks.order ).toBe( original.blocks.order );
		} );

		it( 'should remove the block', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					clientId: 'chicken',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					clientId: 'ribs',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
			const state = editor( original, {
				type: 'REMOVE_BLOCKS',
				clientIds: [ 'chicken' ],
			} );

			expect( state.blocks.order[ '' ] ).toEqual( [ 'ribs' ] );
			expect( state.blocks.order ).not.toHaveProperty( 'chicken' );
			expect( state.blocks.byClientId ).toEqual( {
				ribs: {
					clientId: 'ribs',
					name: 'core/test-block',
				},
			} );
			expect( state.blocks.attributes ).toEqual( {
				ribs: {},
			} );
		} );

		it( 'should remove multiple blocks', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					clientId: 'chicken',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					clientId: 'ribs',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					clientId: 'veggies',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
			const state = editor( original, {
				type: 'REMOVE_BLOCKS',
				clientIds: [ 'chicken', 'veggies' ],
			} );

			expect( state.blocks.order[ '' ] ).toEqual( [ 'ribs' ] );
			expect( state.blocks.order ).not.toHaveProperty( 'chicken' );
			expect( state.blocks.order ).not.toHaveProperty( 'veggies' );
			expect( state.blocks.byClientId ).toEqual( {
				ribs: {
					clientId: 'ribs',
					name: 'core/test-block',
				},
			} );
			expect( state.blocks.attributes ).toEqual( {
				ribs: {},
			} );
		} );

		it( 'should cascade remove to include inner blocks', () => {
			const block = createBlock( 'core/test-block', {}, [
				createBlock( 'core/test-block', {}, [
					createBlock( 'core/test-block' ),
				] ),
			] );

			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ block ],
			} );

			const state = editor( original, {
				type: 'REMOVE_BLOCKS',
				clientIds: [ block.clientId ],
			} );

			expect( state.blocks.byClientId ).toEqual( {} );
			expect( state.blocks.order ).toEqual( {
				'': [],
			} );
		} );

		it( 'should insert at the specified index', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					clientId: 'kumquat',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					clientId: 'loquat',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );

			const state = editor( original, {
				type: 'INSERT_BLOCKS',
				index: 1,
				blocks: [ {
					clientId: 'persimmon',
					name: 'core/freeform',
					innerBlocks: [],
				} ],
			} );

			expect( Object.keys( state.blocks.byClientId ) ).toHaveLength( 3 );
			expect( state.blocks.order[ '' ] ).toEqual( [ 'kumquat', 'persimmon', 'loquat' ] );
		} );

		it( 'should move block to lower index', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					clientId: 'chicken',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					clientId: 'ribs',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					clientId: 'veggies',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCK_TO_POSITION',
				clientId: 'ribs',
				index: 0,
			} );

			expect( state.blocks.order[ '' ] ).toEqual( [ 'ribs', 'chicken', 'veggies' ] );
		} );

		it( 'should move block to higher index', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					clientId: 'chicken',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					clientId: 'ribs',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					clientId: 'veggies',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCK_TO_POSITION',
				clientId: 'ribs',
				index: 2,
			} );

			expect( state.blocks.order[ '' ] ).toEqual( [ 'chicken', 'veggies', 'ribs' ] );
		} );

		it( 'should not move block if passed same index', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					clientId: 'chicken',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					clientId: 'ribs',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					clientId: 'veggies',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCK_TO_POSITION',
				clientId: 'ribs',
				index: 1,
			} );

			expect( state.blocks.order[ '' ] ).toEqual( [ 'chicken', 'ribs', 'veggies' ] );
		} );

		describe( 'blocks', () => {
			it( 'should not reset any blocks that are not in the post', () => {
				const actions = [
					{
						type: 'RESET_BLOCKS',
						blocks: [
							{
								clientId: 'block1',
								innerBlocks: [
									{ clientId: 'block11', innerBlocks: [] },
									{ clientId: 'block12', innerBlocks: [] },
								],
							},
						],
					},
					{
						type: 'RECEIVE_BLOCKS',
						blocks: [
							{
								clientId: 'block2',
								innerBlocks: [
									{ clientId: 'block21', innerBlocks: [] },
									{ clientId: 'block22', innerBlocks: [] },
								],
							},
						],
					},
				];
				const original = deepFreeze( actions.reduce( editor, undefined ) );

				const state = editor( original, {
					type: 'RESET_BLOCKS',
					blocks: [
						{
							clientId: 'block3',
							innerBlocks: [
								{ clientId: 'block31', innerBlocks: [] },
								{ clientId: 'block32', innerBlocks: [] },
							],
						},
					],
				} );

				expect( state.blocks.byClientId ).toEqual( {
					block2: { clientId: 'block2' },
					block21: { clientId: 'block21' },
					block22: { clientId: 'block22' },
					block3: { clientId: 'block3' },
					block31: { clientId: 'block31' },
					block32: { clientId: 'block32' },
				} );
			} );

			describe( 'byClientId', () => {
				it( 'should ignore updates to non-existent block', () => {
					const original = deepFreeze( editor( undefined, {
						type: 'RESET_BLOCKS',
						blocks: [],
					} ) );
					const state = editor( original, {
						type: 'UPDATE_BLOCK_ATTRIBUTES',
						clientId: 'kumquat',
						attributes: {
							updated: true,
						},
					} );

					expect( state.blocks.byClientId ).toBe( original.blocks.byClientId );
				} );

				it( 'should return with same reference if no changes in updates', () => {
					const original = deepFreeze( editor( undefined, {
						type: 'RESET_BLOCKS',
						blocks: [ {
							clientId: 'kumquat',
							attributes: {
								updated: true,
							},
							innerBlocks: [],
						} ],
					} ) );
					const state = editor( original, {
						type: 'UPDATE_BLOCK_ATTRIBUTES',
						clientId: 'kumquat',
						attributes: {
							updated: true,
						},
					} );

					expect( state.blocks.byClientId ).toBe( state.blocks.byClientId );
				} );
			} );

			describe( 'attributes', () => {
				it( 'should return with attribute block updates', () => {
					const original = deepFreeze( editor( undefined, {
						type: 'RESET_BLOCKS',
						blocks: [ {
							clientId: 'kumquat',
							attributes: {},
							innerBlocks: [],
						} ],
					} ) );
					const state = editor( original, {
						type: 'UPDATE_BLOCK_ATTRIBUTES',
						clientId: 'kumquat',
						attributes: {
							updated: true,
						},
					} );

					expect( state.blocks.attributes.kumquat.updated ).toBe( true );
				} );

				it( 'should accumulate attribute block updates', () => {
					const original = deepFreeze( editor( undefined, {
						type: 'RESET_BLOCKS',
						blocks: [ {
							clientId: 'kumquat',
							attributes: {
								updated: true,
							},
							innerBlocks: [],
						} ],
					} ) );
					const state = editor( original, {
						type: 'UPDATE_BLOCK_ATTRIBUTES',
						clientId: 'kumquat',
						attributes: {
							moreUpdated: true,
						},
					} );

					expect( state.blocks.attributes.kumquat ).toEqual( {
						updated: true,
						moreUpdated: true,
					} );
				} );

				it( 'should ignore updates to non-existent block', () => {
					const original = deepFreeze( editor( undefined, {
						type: 'RESET_BLOCKS',
						blocks: [],
					} ) );
					const state = editor( original, {
						type: 'UPDATE_BLOCK_ATTRIBUTES',
						clientId: 'kumquat',
						attributes: {
							updated: true,
						},
					} );

					expect( state.blocks.attributes ).toBe( original.blocks.attributes );
				} );

				it( 'should return with same reference if no changes in updates', () => {
					const original = deepFreeze( editor( undefined, {
						type: 'RESET_BLOCKS',
						blocks: [ {
							clientId: 'kumquat',
							attributes: {
								updated: true,
							},
							innerBlocks: [],
						} ],
					} ) );
					const state = editor( original, {
						type: 'UPDATE_BLOCK_ATTRIBUTES',
						clientId: 'kumquat',
						attributes: {
							updated: true,
						},
					} );

					expect( state.blocks.attributes ).toBe( state.blocks.attributes );
				} );
			} );
		} );
	} );

	describe( 'insertionPoint', () => {
		it( 'should default to null', () => {
			const state = insertionPoint( undefined, {} );

			expect( state ).toBe( null );
		} );

		it( 'should set insertion point', () => {
			const state = insertionPoint( null, {
				type: 'SHOW_INSERTION_POINT',
				rootClientId: 'clientId1',
				index: 0,
			} );

			expect( state ).toEqual( {
				rootClientId: 'clientId1',
				index: 0,
			} );
		} );

		it( 'should clear the insertion point', () => {
			const original = deepFreeze( {
				rootClientId: 'clientId1',
				index: 0,
			} );
			const state = insertionPoint( original, {
				type: 'HIDE_INSERTION_POINT',
			} );

			expect( state ).toBe( null );
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

	describe( 'isCaretWithinFormattedText()', () => {
		it( 'should set the flag to true', () => {
			const state = isCaretWithinFormattedText( false, {
				type: 'ENTER_FORMATTED_TEXT',
			} );

			expect( state ).toBe( true );
		} );

		it( 'should set the flag to false', () => {
			const state = isCaretWithinFormattedText( true, {
				type: 'EXIT_FORMATTED_TEXT',
			} );

			expect( state ).toBe( false );
		} );
	} );

	describe( 'blockSelection()', () => {
		it( 'should return with block clientId as selected', () => {
			const state = blockSelection( undefined, {
				type: 'SELECT_BLOCK',
				clientId: 'kumquat',
				initialPosition: -1,
			} );

			expect( state ).toEqual( {
				start: 'kumquat',
				end: 'kumquat',
				initialPosition: -1,
				isMultiSelecting: false,
				isEnabled: true,
			} );
		} );

		it( 'should set multi selection', () => {
			const original = deepFreeze( { isMultiSelecting: false } );
			const state = blockSelection( original, {
				type: 'MULTI_SELECT',
				start: 'ribs',
				end: 'chicken',
			} );

			expect( state ).toEqual( {
				start: 'ribs',
				end: 'chicken',
				initialPosition: null,
				isMultiSelecting: false,
			} );
		} );

		it( 'should set continuous multi selection', () => {
			const original = deepFreeze( { isMultiSelecting: true } );
			const state = blockSelection( original, {
				type: 'MULTI_SELECT',
				start: 'ribs',
				end: 'chicken',
			} );

			expect( state ).toEqual( {
				start: 'ribs',
				end: 'chicken',
				initialPosition: null,
				isMultiSelecting: true,
			} );
		} );

		it( 'should start multi selection', () => {
			const original = deepFreeze( { start: 'ribs', end: 'ribs', isMultiSelecting: false } );
			const state = blockSelection( original, {
				type: 'START_MULTI_SELECT',
			} );

			expect( state ).toEqual( {
				start: 'ribs',
				end: 'ribs',
				initialPosition: null,
				isMultiSelecting: true,
			} );
		} );

		it( 'should return same reference if already multi-selecting', () => {
			const original = deepFreeze( { start: 'ribs', end: 'ribs', isMultiSelecting: true } );
			const state = blockSelection( original, {
				type: 'START_MULTI_SELECT',
			} );

			expect( state ).toBe( original );
		} );

		it( 'should end multi selection with selection', () => {
			const original = deepFreeze( { start: 'ribs', end: 'chicken', isMultiSelecting: true } );
			const state = blockSelection( original, {
				type: 'STOP_MULTI_SELECT',
			} );

			expect( state ).toEqual( {
				start: 'ribs',
				end: 'chicken',
				initialPosition: null,
				isMultiSelecting: false,
			} );
		} );

		it( 'should return same reference if already ended multi-selecting', () => {
			const original = deepFreeze( { start: 'ribs', end: 'chicken', isMultiSelecting: false } );
			const state = blockSelection( original, {
				type: 'STOP_MULTI_SELECT',
			} );

			expect( state ).toBe( original );
		} );

		it( 'should end multi selection without selection', () => {
			const original = deepFreeze( { start: 'ribs', end: 'ribs', isMultiSelecting: true } );
			const state = blockSelection( original, {
				type: 'STOP_MULTI_SELECT',
			} );

			expect( state ).toEqual( {
				start: 'ribs',
				end: 'ribs',
				initialPosition: null,
				isMultiSelecting: false,
			} );
		} );

		it( 'should not update the state if the block is already selected', () => {
			const original = deepFreeze( { start: 'ribs', end: 'ribs' } );

			const state1 = blockSelection( original, {
				type: 'SELECT_BLOCK',
				clientId: 'ribs',
			} );

			expect( state1 ).toBe( original );
		} );

		it( 'should unset multi selection', () => {
			const original = deepFreeze( { start: 'ribs', end: 'chicken' } );

			const state1 = blockSelection( original, {
				type: 'CLEAR_SELECTED_BLOCK',
			} );

			expect( state1 ).toEqual( {
				start: null,
				end: null,
				initialPosition: null,
				isMultiSelecting: false,
			} );
		} );

		it( 'should return same reference if clearing selection but no selection', () => {
			const original = deepFreeze( { start: null, end: null, isMultiSelecting: false } );

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
					clientId: 'ribs',
					name: 'core/freeform',
				} ],
				updateSelection: true,
			} );

			expect( state3 ).toEqual( {
				start: 'ribs',
				end: 'ribs',
				initialPosition: null,
				isMultiSelecting: false,
			} );
		} );

		it( 'should not select inserted block if updateSelection flag is false', () => {
			const original = deepFreeze( { start: 'a', end: 'b' } );

			const state3 = blockSelection( original, {
				type: 'INSERT_BLOCKS',
				blocks: [ {
					clientId: 'ribs',
					name: 'core/freeform',
				} ],
				updateSelection: false,
			} );

			expect( state3 ).toEqual( {
				start: 'a',
				end: 'b',
			} );
		} );

		it( 'should not update the state if the block moved is already selected', () => {
			const original = deepFreeze( { start: 'ribs', end: 'ribs' } );
			const state = blockSelection( original, {
				type: 'MOVE_BLOCKS_UP',
				clientIds: [ 'ribs' ],
			} );

			expect( state ).toBe( original );
		} );

		it( 'should replace the selected block', () => {
			const original = deepFreeze( { start: 'chicken', end: 'chicken' } );
			const state = blockSelection( original, {
				type: 'REPLACE_BLOCKS',
				clientIds: [ 'chicken' ],
				blocks: [ {
					clientId: 'wings',
					name: 'core/freeform',
				} ],
			} );

			expect( state ).toEqual( {
				start: 'wings',
				end: 'wings',
				initialPosition: null,
				isMultiSelecting: false,
			} );
		} );

		it( 'should not replace the selected block if we keep it at the end when replacing blocks', () => {
			const original = deepFreeze( { start: 'wings', end: 'wings' } );
			const state = blockSelection( original, {
				type: 'REPLACE_BLOCKS',
				clientIds: [ 'wings' ],
				blocks: [
					{
						clientId: 'chicken',
						name: 'core/freeform',
					},
					{
						clientId: 'wings',
						name: 'core/freeform',
					} ],
			} );

			expect( state ).toBe( original );
		} );

		it( 'should replace the selected block if we keep it not at the end when replacing blocks', () => {
			const original = deepFreeze( { start: 'chicken', end: 'chicken' } );
			const state = blockSelection( original, {
				type: 'REPLACE_BLOCKS',
				clientIds: [ 'chicken' ],
				blocks: [
					{
						clientId: 'chicken',
						name: 'core/freeform',
					},
					{
						clientId: 'wings',
						name: 'core/freeform',
					} ],
			} );

			expect( state ).toEqual( {
				start: 'wings',
				end: 'wings',
				initialPosition: null,
				isMultiSelecting: false,
			} );
		} );

		it( 'should reset if replacing with empty set', () => {
			const original = deepFreeze( { start: 'chicken', end: 'chicken' } );
			const state = blockSelection( original, {
				type: 'REPLACE_BLOCKS',
				clientIds: [ 'chicken' ],
				blocks: [],
			} );

			expect( state ).toEqual( {
				start: null,
				end: null,
				initialPosition: null,
				isMultiSelecting: false,
			} );
		} );

		it( 'should keep the selected block', () => {
			const original = deepFreeze( { start: 'chicken', end: 'chicken' } );
			const state = blockSelection( original, {
				type: 'REPLACE_BLOCKS',
				clientIds: [ 'ribs' ],
				blocks: [ {
					clientId: 'wings',
					name: 'core/freeform',
				} ],
			} );

			expect( state ).toBe( original );
		} );

		it( 'should remove the selection if we are removing the selected block', () => {
			const original = deepFreeze( {
				start: 'chicken',
				end: 'chicken',
				initialPosition: null,
				isMultiSelecting: false,
			} );
			const state = blockSelection( original, {
				type: 'REMOVE_BLOCKS',
				clientIds: [ 'chicken' ],
			} );

			expect( state ).toEqual( {
				start: null,
				end: null,
				initialPosition: null,
				isMultiSelecting: false,
			} );
		} );

		it( 'should keep the selection if we are not removing the selected block', () => {
			const original = deepFreeze( {
				start: 'chicken',
				end: 'chicken',
				initialPosition: null,
				isMultiSelecting: false,
			} );
			const state = blockSelection( original, {
				type: 'REMOVE_BLOCKS',
				clientIds: [ 'ribs' ],
			} );

			expect( state ).toBe( original );
		} );
	} );

	describe( 'preferences()', () => {
		it( 'should apply all defaults', () => {
			const state = preferences( undefined, {} );

			expect( state ).toEqual( {
				insertUsage: {},
			} );
		} );
		it( 'should record recently used blocks', () => {
			const state = preferences( deepFreeze( { insertUsage: {} } ), {
				type: 'INSERT_BLOCKS',
				blocks: [ {
					clientId: 'bacon',
					name: 'core-embed/twitter',
				} ],
				time: 123456,
			} );

			expect( state ).toEqual( {
				insertUsage: {
					'core-embed/twitter': {
						time: 123456,
						count: 1,
						insert: { name: 'core-embed/twitter' },
					},
				},
			} );

			const twoRecentBlocks = preferences( deepFreeze( {
				insertUsage: {
					'core-embed/twitter': {
						time: 123456,
						count: 1,
						insert: { name: 'core-embed/twitter' },
					},
				},
			} ), {
				type: 'INSERT_BLOCKS',
				blocks: [ {
					clientId: 'eggs',
					name: 'core-embed/twitter',
				}, {
					clientId: 'bacon',
					name: 'core/block',
					attributes: { ref: 123 },
				} ],
				time: 123457,
			} );

			expect( twoRecentBlocks ).toEqual( {
				insertUsage: {
					'core-embed/twitter': {
						time: 123457,
						count: 2,
						insert: { name: 'core-embed/twitter' },
					},
					'core/block/123': {
						time: 123457,
						count: 1,
						insert: { name: 'core/block', ref: 123 },
					},
				},
			} );
		} );
	} );

	describe( 'blocksMode', () => {
		it( 'should set mode to html if not set', () => {
			const action = {
				type: 'TOGGLE_BLOCK_MODE',
				clientId: 'chicken',
			};
			const value = blocksMode( deepFreeze( {} ), action );

			expect( value ).toEqual( { chicken: 'html' } );
		} );

		it( 'should toggle mode to visual if set as html', () => {
			const action = {
				type: 'TOGGLE_BLOCK_MODE',
				clientId: 'chicken',
			};
			const value = blocksMode( deepFreeze( { chicken: 'html' } ), action );

			expect( value ).toEqual( { chicken: 'visual' } );
		} );
	} );

	describe( 'template', () => {
		it( 'should default to visible', () => {
			const state = template( undefined, {} );

			expect( state ).toEqual( { isValid: true } );
		} );

		it( 'should reset the validity flag', () => {
			const original = deepFreeze( { isValid: false, template: [] } );
			const state = template( original, {
				type: 'SET_TEMPLATE_VALIDITY',
				isValid: true,
			} );

			expect( state ).toEqual( { isValid: true, template: [] } );
		} );
	} );

	describe( 'blockListSettings', () => {
		it( 'should add new settings', () => {
			const original = deepFreeze( {} );

			const state = blockListSettings( original, {
				type: 'UPDATE_BLOCK_LIST_SETTINGS',
				clientId: '9db792c6-a25a-495d-adbd-97d56a4c4189',
				settings: {
					allowedBlocks: [ 'core/paragraph' ],
				},
			} );

			expect( state ).toEqual( {
				'9db792c6-a25a-495d-adbd-97d56a4c4189': {
					allowedBlocks: [ 'core/paragraph' ],
				},
			} );
		} );

		it( 'should return same reference if updated as the same', () => {
			const original = deepFreeze( {
				'9db792c6-a25a-495d-adbd-97d56a4c4189': {
					allowedBlocks: [ 'core/paragraph' ],
				},
			} );

			const state = blockListSettings( original, {
				type: 'UPDATE_BLOCK_LIST_SETTINGS',
				clientId: '9db792c6-a25a-495d-adbd-97d56a4c4189',
				settings: {
					allowedBlocks: [ 'core/paragraph' ],
				},
			} );

			expect( state ).toBe( original );
		} );

		it( 'should return same reference if updated settings not assigned and id not exists', () => {
			const original = deepFreeze( {} );

			const state = blockListSettings( original, {
				type: 'UPDATE_BLOCK_LIST_SETTINGS',
				clientId: '9db792c6-a25a-495d-adbd-97d56a4c4189',
			} );

			expect( state ).toBe( original );
		} );

		it( 'should update the settings of a block', () => {
			const original = deepFreeze( {
				'9db792c6-a25a-495d-adbd-97d56a4c4189': {
					allowedBlocks: [ 'core/paragraph' ],
				},
				'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1': {
					allowedBlocks: true,
				},
			} );

			const state = blockListSettings( original, {
				type: 'UPDATE_BLOCK_LIST_SETTINGS',
				clientId: '9db792c6-a25a-495d-adbd-97d56a4c4189',
				settings: {
					allowedBlocks: [ 'core/list' ],
				},
			} );

			expect( state ).toEqual( {
				'9db792c6-a25a-495d-adbd-97d56a4c4189': {
					allowedBlocks: [ 'core/list' ],
				},
				'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1': {
					allowedBlocks: true,
				},
			} );
		} );

		it( 'should remove existing settings if updated settings not assigned', () => {
			const original = deepFreeze( {
				'9db792c6-a25a-495d-adbd-97d56a4c4189': {
					allowedBlocks: [ 'core/paragraph' ],
				},
			} );

			const state = blockListSettings( original, {
				type: 'UPDATE_BLOCK_LIST_SETTINGS',
				clientId: '9db792c6-a25a-495d-adbd-97d56a4c4189',
			} );

			expect( state ).toEqual( {} );
		} );

		it( 'should remove the settings of a block when it is replaced', () => {
			const original = deepFreeze( {
				'9db792c6-a25a-495d-adbd-97d56a4c4189': {
					allowedBlocks: [ 'core/paragraph' ],
				},
				'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1': {
					allowedBlocks: true,
				},
			} );

			const state = blockListSettings( original, {
				type: 'REPLACE_BLOCKS',
				clientIds: [ 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1' ],
			} );

			expect( state ).toEqual( {
				'9db792c6-a25a-495d-adbd-97d56a4c4189': {
					allowedBlocks: [ 'core/paragraph' ],
				},
			} );
		} );

		it( 'should remove the settings of a block when it is removed', () => {
			const original = deepFreeze( {
				'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1': {
					allowedBlocks: true,
				},
			} );

			const state = blockListSettings( original, {
				type: 'REMOVE_BLOCKS',
				clientIds: [ 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1' ],
			} );

			expect( state ).toEqual( {} );
		} );
	} );
} );
