/**
 * External dependencies
 */
import { noop } from 'lodash';
import deepFreeze from 'deep-freeze';

/**
 * WordPress dependencies
 */
import { controls, createRegistry } from '@wordpress/data';
import {
	getBlockTypes,
	unregisterBlockType,
	registerBlockType,
	createBlock,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */

import * as selectors from '../selectors';
import reducer from '../reducer';
import * as actions from '../actions';
import { STORE_NAME as blockEditorStoreName } from '../../store/constants';

const {
	clearSelectedBlock,
	enterFormattedText,
	exitFormattedText,
	hideInsertionPoint,
	insertBlock,
	insertBlocks,
	mergeBlocks,
	moveBlocksToPosition,
	multiSelect,
	removeBlock,
	removeBlocks,
	replaceBlock,
	replaceBlocks,
	replaceInnerBlocks,
	resetBlocks,
	selectBlock,
	selectPreviousBlock,
	showInsertionPoint,
	startMultiSelect,
	startTyping,
	stopMultiSelect,
	stopTyping,
	startDraggingBlocks,
	stopDraggingBlocks,
	toggleBlockMode,
	toggleSelection,
	updateBlock,
	updateBlockAttributes,
	updateBlockListSettings,
	updateSettings,
	selectionChange,
	validateBlocksToTemplate,
} = actions;

describe( 'actions', () => {
	const defaultBlockSettings = {
		attributes: {
			content: {},
		},
		save: () => 'Saved',
		category: 'text',
		title: 'block title',
	};

	describe( 'resetBlocks', () => {
		it( 'should yield the RESET_BLOCKS actions', () => {
			const blocks = [];
			const fulfillment = resetBlocks( blocks );
			expect( fulfillment.next().value ).toEqual( {
				type: 'RESET_BLOCKS',
				blocks,
			} );
		} );
	} );

	describe( 'updateBlockAttributes', () => {
		it( 'should return the UPDATE_BLOCK_ATTRIBUTES action (string)', () => {
			const clientId = 'myclientid';
			const attributes = {};
			const result = updateBlockAttributes( clientId, attributes );
			expect( result ).toEqual( {
				type: 'UPDATE_BLOCK_ATTRIBUTES',
				clientIds: [ clientId ],
				attributes,
				uniqueByBlock: false,
			} );
		} );

		it( 'should return the UPDATE_BLOCK_ATTRIBUTES action (array)', () => {
			const clientIds = [ 'myclientid' ];
			const attributes = {};
			const result = updateBlockAttributes( clientIds, attributes );
			expect( result ).toEqual( {
				type: 'UPDATE_BLOCK_ATTRIBUTES',
				clientIds,
				attributes,
				uniqueByBlock: false,
			} );
		} );
	} );

	describe( 'updateBlock', () => {
		it( 'should return the UPDATE_BLOCK action', () => {
			const clientId = 'myclientid';
			const updates = {};
			const result = updateBlock( clientId, updates );
			expect( result ).toEqual( {
				type: 'UPDATE_BLOCK',
				clientId,
				updates,
			} );
		} );
	} );

	describe( 'selectBlock', () => {
		it( 'should return the SELECT_BLOCK action', () => {
			const clientId = 'myclientid';
			const result = selectBlock( clientId, -1 );
			expect( result ).toEqual( {
				type: 'SELECT_BLOCK',
				initialPosition: -1,
				clientId,
			} );
		} );
	} );

	describe( 'startMultiSelect', () => {
		it( 'should return the START_MULTI_SELECT', () => {
			expect( startMultiSelect() ).toEqual( {
				type: 'START_MULTI_SELECT',
			} );
		} );
	} );

	describe( 'stopMultiSelect', () => {
		it( 'should return the Stop_MULTI_SELECT', () => {
			expect( stopMultiSelect() ).toEqual( {
				type: 'STOP_MULTI_SELECT',
			} );
		} );
	} );
	describe( 'multiSelect', () => {
		it( 'should return MULTI_SELECT action', () => {
			const start = 'start';
			const end = 'end';
			const fulfillment = multiSelect( start, end );
			expect( fulfillment.next().value ).toEqual( {
				type: 'MULTI_SELECT',
				start,
				end,
			} );
		} );
	} );

	describe( 'clearSelectedBlock', () => {
		it( 'should return CLEAR_SELECTED_BLOCK action', () => {
			expect( clearSelectedBlock() ).toEqual( {
				type: 'CLEAR_SELECTED_BLOCK',
			} );
		} );
	} );

	describe( 'replaceBlock', () => {
		it( 'should yield the REPLACE_BLOCKS action if the new block can be inserted in the destination root block', () => {
			const block = {
				clientId: 'ribs',
				name: 'core/test-block',
			};

			const replaceBlockGenerator = replaceBlock( 'chicken', block );

			// Skip getSettings select.
			replaceBlockGenerator.next();

			expect( replaceBlockGenerator.next().value ).toEqual(
				controls.select(
					blockEditorStoreName,
					'getBlockRootClientId',
					'chicken'
				)
			);

			expect( replaceBlockGenerator.next().value ).toEqual(
				controls.select(
					blockEditorStoreName,
					'canInsertBlockType',
					'core/test-block',
					undefined
				)
			);

			expect( replaceBlockGenerator.next( true ).value ).toEqual( {
				type: 'REPLACE_BLOCKS',
				clientIds: [ 'chicken' ],
				blocks: [ block ],
				time: expect.any( Number ),
				initialPosition: 0,
			} );

			expect( replaceBlockGenerator.next().value ).toEqual(
				controls.select( blockEditorStoreName, 'getBlockCount' )
			);

			expect( replaceBlockGenerator.next( 1 ) ).toEqual( {
				value: undefined,
				done: true,
			} );
		} );
	} );

	describe( 'replaceBlocks', () => {
		it( 'should not yield the REPLACE_BLOCKS action if the replacement is not possible', () => {
			const blocks = [
				{
					clientId: 'ribs',
					name: 'core/test-ribs',
				},
				{
					clientId: 'chicken',
					name: 'core/test-chicken',
				},
			];

			const replaceBlockGenerator = replaceBlocks(
				[ 'chicken' ],
				blocks
			);

			expect( replaceBlockGenerator.next().value ).toEqual(
				controls.select( blockEditorStoreName, 'getSettings' )
			);

			expect( replaceBlockGenerator.next().value ).toEqual(
				controls.select(
					blockEditorStoreName,
					'getBlockRootClientId',
					'chicken'
				)
			);

			expect( replaceBlockGenerator.next().value ).toEqual(
				controls.select(
					blockEditorStoreName,
					'canInsertBlockType',
					'core/test-ribs',
					undefined
				)
			);

			expect( replaceBlockGenerator.next( true ).value ).toEqual(
				controls.select(
					blockEditorStoreName,
					'canInsertBlockType',
					'core/test-chicken',
					undefined
				)
			);

			expect( replaceBlockGenerator.next( false ) ).toEqual( {
				value: undefined,
				done: true,
			} );
		} );

		it( 'should yield the REPLACE_BLOCKS action if the all the replacement blocks can be inserted in the parent block', () => {
			const blocks = [
				{
					clientId: 'ribs',
					name: 'core/test-ribs',
				},
				{
					clientId: 'chicken',
					name: 'core/test-chicken',
				},
			];

			const replaceBlockGenerator = replaceBlocks(
				[ 'chicken' ],
				blocks
			);

			// Skip getSettings select.
			replaceBlockGenerator.next();

			expect( replaceBlockGenerator.next().value ).toEqual(
				controls.select(
					blockEditorStoreName,
					'getBlockRootClientId',
					'chicken'
				)
			);

			expect( replaceBlockGenerator.next().value ).toEqual(
				controls.select(
					blockEditorStoreName,
					'canInsertBlockType',
					'core/test-ribs',
					undefined
				)
			);

			expect( replaceBlockGenerator.next( true ).value ).toEqual(
				controls.select(
					blockEditorStoreName,
					'canInsertBlockType',
					'core/test-chicken',
					undefined
				)
			);

			expect( replaceBlockGenerator.next( true ).value ).toEqual( {
				type: 'REPLACE_BLOCKS',
				clientIds: [ 'chicken' ],
				blocks,
				time: expect.any( Number ),
				initialPosition: 0,
			} );

			expect( replaceBlockGenerator.next().value ).toEqual(
				controls.select( blockEditorStoreName, 'getBlockCount' )
			);

			expect( replaceBlockGenerator.next( 1 ) ).toEqual( {
				value: undefined,
				done: true,
			} );
		} );

		it( 'should pass patternName through metadata to REPLACE_BLOCKS action', () => {
			const blocks = [
				{
					clientId: 'ribs',
					name: 'core/test-ribs',
				},
				{
					clientId: 'chicken',
					name: 'core/test-chicken',
				},
			];

			const meta = { patternName: 'core/chicken-ribs-pattern' };

			const replaceBlockGenerator = replaceBlocks(
				[ 'chicken' ],
				blocks,
				null,
				null,
				meta
			);

			// Skip to action yield.
			replaceBlockGenerator.next();
			replaceBlockGenerator.next();
			replaceBlockGenerator.next();
			replaceBlockGenerator.next( true );

			expect( replaceBlockGenerator.next( true ).value ).toEqual( {
				type: 'REPLACE_BLOCKS',
				clientIds: [ 'chicken' ],
				blocks,
				time: expect.any( Number ),
				indexToSelect: null,
				initialPosition: null,
				meta: { patternName: 'core/chicken-ribs-pattern' },
			} );
		} );
	} );

	describe( 'insertBlock', () => {
		it( 'should yield the INSERT_BLOCKS action', () => {
			const block = {
				clientId: 'ribs',
				name: 'core/test-block',
			};
			const index = 5;

			const insertBlockGenerator = insertBlock(
				block,
				index,
				'testclientid',
				true
			);

			// Skip getSettings select.
			insertBlockGenerator.next();

			expect( insertBlockGenerator.next().value ).toEqual(
				controls.select(
					blockEditorStoreName,
					'canInsertBlockType',
					'core/test-block',
					'testclientid'
				)
			);

			expect( insertBlockGenerator.next( true ) ).toEqual( {
				done: true,
				value: {
					type: 'INSERT_BLOCKS',
					blocks: [ block ],
					index,
					rootClientId: 'testclientid',
					time: expect.any( Number ),
					updateSelection: true,
					initialPosition: 0,
				},
			} );
		} );
	} );

	describe( 'insertBlocks', () => {
		it( 'should apply default styles to blocks if blocks do not contain a style', () => {
			const ribsBlock = {
				clientId: 'ribs',
				name: 'core/test-ribs',
			};
			const chickenBlock = {
				clientId: 'chicken',
				name: 'core/test-chicken',
			};
			const chickenRibsBlock = {
				clientId: 'chicken-ribs',
				name: 'core/test-chicken-ribs',
			};
			const blocks = [ ribsBlock, chickenBlock, chickenRibsBlock ];

			const insertBlocksGenerator = insertBlocks(
				blocks,
				5,
				'testrootid',
				false
			);

			expect( insertBlocksGenerator.next().value ).toEqual(
				controls.select( blockEditorStoreName, 'getSettings' )
			);

			expect(
				insertBlocksGenerator.next( {
					__experimentalPreferredStyleVariations: {
						value: {
							'core/test-ribs': 'squared',
							'core/test-chicken-ribs': 'colorful',
						},
					},
				} ).value
			).toEqual(
				controls.select(
					blockEditorStoreName,
					'canInsertBlockType',
					'core/test-ribs',
					'testrootid'
				)
			);

			expect( insertBlocksGenerator.next( true ).value ).toEqual(
				controls.select(
					blockEditorStoreName,
					'canInsertBlockType',
					'core/test-chicken',
					'testrootid'
				)
			);

			expect( insertBlocksGenerator.next( true ).value ).toEqual(
				controls.select(
					blockEditorStoreName,
					'canInsertBlockType',
					'core/test-chicken-ribs',
					'testrootid'
				)
			);

			expect( insertBlocksGenerator.next( true ) ).toEqual( {
				done: true,
				value: {
					type: 'INSERT_BLOCKS',
					blocks: [
						{
							...ribsBlock,
							attributes: { className: 'is-style-squared' },
						},
						chickenBlock,
						{
							...chickenRibsBlock,
							attributes: { className: 'is-style-colorful' },
						},
					],
					index: 5,
					rootClientId: 'testrootid',
					time: expect.any( Number ),
					updateSelection: false,
					initialPosition: null,
				},
			} );
		} );

		it( 'should keep styles explicitly set even if different from the default', () => {
			const ribsWithStyleBlock = {
				clientId: 'ribs',
				name: 'core/test-ribs',
				attributes: {
					className: 'is-style-colorful',
				},
			};
			const blocks = [ ribsWithStyleBlock ];

			const insertBlocksGenerator = insertBlocks(
				blocks,
				5,
				'testrootid',
				false
			);

			expect( insertBlocksGenerator.next().value ).toEqual(
				controls.select( blockEditorStoreName, 'getSettings' )
			);

			expect(
				insertBlocksGenerator.next( {
					__experimentalPreferredStyleVariations: {
						value: {
							'core/test-ribs': 'squared',
						},
					},
				} ).value
			).toEqual(
				controls.select(
					blockEditorStoreName,
					'canInsertBlockType',
					'core/test-ribs',
					'testrootid'
				)
			);

			expect( insertBlocksGenerator.next( true ) ).toEqual( {
				done: true,
				value: {
					type: 'INSERT_BLOCKS',
					blocks: [
						{
							...ribsWithStyleBlock,
							attributes: { className: 'is-style-colorful' },
						},
					],
					index: 5,
					rootClientId: 'testrootid',
					time: expect.any( Number ),
					updateSelection: false,
					initialPosition: null,
				},
			} );
		} );
		it( 'should filter the allowed blocks in INSERT_BLOCKS action', () => {
			const ribsBlock = {
				clientId: 'ribs',
				name: 'core/test-ribs',
			};
			const chickenBlock = {
				clientId: 'chicken',
				name: 'core/test-chicken',
			};
			const chickenRibsBlock = {
				clientId: 'chicken-ribs',
				name: 'core/test-chicken-ribs',
			};
			const blocks = [ ribsBlock, chickenBlock, chickenRibsBlock ];

			const insertBlocksGenerator = insertBlocks(
				blocks,
				5,
				'testrootid',
				false
			);

			// Skip getSettings select.
			insertBlocksGenerator.next();

			expect( insertBlocksGenerator.next().value ).toEqual(
				controls.select(
					blockEditorStoreName,
					'canInsertBlockType',
					'core/test-ribs',
					'testrootid'
				)
			);

			expect( insertBlocksGenerator.next( true ).value ).toEqual(
				controls.select(
					blockEditorStoreName,
					'canInsertBlockType',
					'core/test-chicken',
					'testrootid'
				)
			);

			expect( insertBlocksGenerator.next( false ).value ).toEqual(
				controls.select(
					blockEditorStoreName,
					'canInsertBlockType',
					'core/test-chicken-ribs',
					'testrootid'
				)
			);

			expect( insertBlocksGenerator.next( true ) ).toEqual( {
				done: true,
				value: {
					type: 'INSERT_BLOCKS',
					blocks: [ ribsBlock, chickenRibsBlock ],
					index: 5,
					rootClientId: 'testrootid',
					time: expect.any( Number ),
					updateSelection: false,
					initialPosition: null,
				},
			} );
		} );

		it( 'does not yield INSERT_BLOCKS action if all the blocks are impossible to insert', () => {
			const ribsBlock = {
				clientId: 'ribs',
				name: 'core/test-ribs',
			};
			const chickenBlock = {
				clientId: 'chicken',
				name: 'core/test-chicken',
			};
			const blocks = [ ribsBlock, chickenBlock ];

			const insertBlocksGenerator = insertBlocks(
				blocks,
				5,
				'testrootid',
				false
			);

			// Skip getSettings select.
			insertBlocksGenerator.next();

			expect( insertBlocksGenerator.next().value ).toEqual(
				controls.select(
					blockEditorStoreName,
					'canInsertBlockType',
					'core/test-ribs',
					'testrootid'
				)
			);

			expect( insertBlocksGenerator.next( false ).value ).toEqual(
				controls.select(
					blockEditorStoreName,
					'canInsertBlockType',
					'core/test-chicken',
					'testrootid'
				)
			);

			expect( insertBlocksGenerator.next( false ) ).toEqual( {
				done: true,
				value: undefined,
			} );
		} );

		it( 'should pass patternName through metadata to INSERT_BLOCKS action', () => {
			const ribsBlock = {
				clientId: 'ribs',
				name: 'core/test-ribs',
			};
			const chickenBlock = {
				clientId: 'chicken',
				name: 'core/test-chicken',
			};
			const chickenRibsBlock = {
				clientId: 'chicken-ribs',
				name: 'core/test-chicken-ribs',
			};
			const blocks = [ ribsBlock, chickenBlock, chickenRibsBlock ];
			const meta = { patternName: 'core/chicken-ribs-pattern' };

			const insertBlocksGenerator = insertBlocks(
				blocks,
				5,
				'testrootid',
				false,
				0,
				meta
			);

			// Skip getSettings select.
			insertBlocksGenerator.next();

			expect( insertBlocksGenerator.next().value ).toEqual(
				controls.select(
					blockEditorStoreName,
					'canInsertBlockType',
					'core/test-ribs',
					'testrootid'
				)
			);

			expect( insertBlocksGenerator.next( true ).value ).toEqual(
				controls.select(
					blockEditorStoreName,
					'canInsertBlockType',
					'core/test-chicken',
					'testrootid'
				)
			);

			expect( insertBlocksGenerator.next( false ).value ).toEqual(
				controls.select(
					blockEditorStoreName,
					'canInsertBlockType',
					'core/test-chicken-ribs',
					'testrootid'
				)
			);

			expect( insertBlocksGenerator.next( true ) ).toEqual( {
				done: true,
				value: {
					type: 'INSERT_BLOCKS',
					blocks: [ ribsBlock, chickenRibsBlock ],
					index: 5,
					rootClientId: 'testrootid',
					time: expect.any( Number ),
					updateSelection: false,
					initialPosition: null,
					meta: { patternName: 'core/chicken-ribs-pattern' },
				},
			} );
		} );
	} );

	describe( 'showInsertionPoint', () => {
		it( 'should return the SHOW_INSERTION_POINT action', () => {
			expect( showInsertionPoint() ).toEqual( {
				type: 'SHOW_INSERTION_POINT',
			} );
		} );
	} );

	describe( 'hideInsertionPoint', () => {
		it( 'should return the HIDE_INSERTION_POINT action', () => {
			expect( hideInsertionPoint() ).toEqual( {
				type: 'HIDE_INSERTION_POINT',
			} );
		} );
	} );

	describe( 'removeBlocks', () => {
		it( 'should return REMOVE_BLOCKS action', () => {
			const clientId = 'clientId';
			const clientIds = [ clientId ];

			const result = Array.from( removeBlocks( clientIds ) );

			expect( result ).toEqual( [
				controls.select(
					blockEditorStoreName,
					'getBlockRootClientId',
					clientId
				),
				controls.select(
					blockEditorStoreName,
					'getTemplateLock',
					undefined
				),
				selectPreviousBlock( clientId ),
				{
					type: 'REMOVE_BLOCKS',
					clientIds,
				},
				controls.select( blockEditorStoreName, 'getBlockCount' ),
			] );
		} );
	} );

	describe( 'moveBlocksToPosition', () => {
		it( 'should yield MOVE_BLOCKS_TO_POSITION action if locking is insert and move is not changing the root block', () => {
			const moveBlockToPositionGenerator = moveBlocksToPosition(
				[ 'chicken' ],
				'ribs',
				'ribs',
				5
			);

			expect( moveBlockToPositionGenerator.next().value ).toEqual(
				controls.select(
					blockEditorStoreName,
					'getTemplateLock',
					'ribs'
				)
			);

			expect(
				moveBlockToPositionGenerator.next( 'insert' ).value
			).toEqual( {
				type: 'MOVE_BLOCKS_TO_POSITION',
				fromRootClientId: 'ribs',
				toRootClientId: 'ribs',
				clientIds: [ 'chicken' ],
				index: 5,
			} );

			expect( moveBlockToPositionGenerator.next().done ).toBe( true );
		} );

		it( 'should not yield MOVE_BLOCKS_TO_POSITION action if locking is all', () => {
			const moveBlockToPositionGenerator = moveBlocksToPosition(
				[ 'chicken' ],
				'ribs',
				'ribs',
				5
			);

			expect( moveBlockToPositionGenerator.next().value ).toEqual(
				controls.select(
					blockEditorStoreName,
					'getTemplateLock',
					'ribs'
				)
			);

			expect( moveBlockToPositionGenerator.next( 'all' ) ).toEqual( {
				done: true,
				value: undefined,
			} );
		} );

		it( 'should not yield MOVE_BLOCKS_TO_POSITION action if locking is insert and move is changing the root block', () => {
			const moveBlockToPositionGenerator = moveBlocksToPosition(
				[ 'chicken' ],
				'ribs',
				'chicken-ribs',
				5
			);

			expect( moveBlockToPositionGenerator.next().value ).toEqual(
				controls.select(
					blockEditorStoreName,
					'getTemplateLock',
					'ribs'
				)
			);

			expect( moveBlockToPositionGenerator.next( 'insert' ) ).toEqual( {
				done: true,
				value: undefined,
			} );
		} );

		it( 'should yield MOVE_BLOCKS_TO_POSITION action if there is not locking in the original root block and block can be inserted in the destination', () => {
			const moveBlockToPositionGenerator = moveBlocksToPosition(
				[ 'chicken' ],
				'ribs',
				'chicken-ribs',
				5
			);

			expect( moveBlockToPositionGenerator.next().value ).toEqual(
				controls.select(
					blockEditorStoreName,
					'getTemplateLock',
					'ribs'
				)
			);

			expect( moveBlockToPositionGenerator.next().value ).toEqual(
				controls.select(
					blockEditorStoreName,
					'canInsertBlocks',
					[ 'chicken' ],
					'chicken-ribs'
				)
			);

			expect( moveBlockToPositionGenerator.next( true ).value ).toEqual( {
				type: 'MOVE_BLOCKS_TO_POSITION',
				fromRootClientId: 'ribs',
				toRootClientId: 'chicken-ribs',
				clientIds: [ 'chicken' ],
				index: 5,
			} );

			expect( moveBlockToPositionGenerator.next() ).toEqual( {
				done: true,
				value: undefined,
			} );
		} );

		it( 'should not yield MOVE_BLOCKS_TO_POSITION action if there is not locking in the original root block and block can be inserted in the destination', () => {
			const moveBlockToPositionGenerator = moveBlocksToPosition(
				[ 'chicken' ],
				'ribs',
				'chicken-ribs',
				5
			);

			expect( moveBlockToPositionGenerator.next().value ).toEqual(
				controls.select(
					blockEditorStoreName,
					'getTemplateLock',
					'ribs'
				)
			);

			expect( moveBlockToPositionGenerator.next().value ).toEqual(
				controls.select(
					blockEditorStoreName,
					'canInsertBlocks',
					[ 'chicken' ],
					'chicken-ribs'
				)
			);

			expect( moveBlockToPositionGenerator.next( false ) ).toEqual( {
				done: true,
				value: undefined,
			} );
		} );
	} );

	describe( 'moveBlockToPosition', () => {
		it( 'should yield MOVE_BLOCKS_TO_POSITION action with a single block', () => {
			const moveBlockToPositionGenerator = moveBlocksToPosition(
				'chicken',
				'ribs',
				'ribs',
				5
			);

			expect( moveBlockToPositionGenerator.next().value ).toEqual(
				controls.select(
					blockEditorStoreName,
					'getTemplateLock',
					'ribs'
				)
			);

			expect( moveBlockToPositionGenerator.next().value ).toEqual( {
				type: 'MOVE_BLOCKS_TO_POSITION',
				fromRootClientId: 'ribs',
				toRootClientId: 'ribs',
				clientIds: 'chicken',
				index: 5,
			} );

			expect( moveBlockToPositionGenerator.next().done ).toBe( true );
		} );
	} );

	describe( 'removeBlock', () => {
		it( 'should return REMOVE_BLOCKS action', () => {
			const clientId = 'myclientid';

			const result = Array.from( removeBlock( clientId ) );

			expect( result ).toEqual( [
				controls.select(
					blockEditorStoreName,
					'getBlockRootClientId',
					clientId
				),
				controls.select(
					blockEditorStoreName,
					'getTemplateLock',
					undefined
				),
				selectPreviousBlock( clientId ),
				{
					type: 'REMOVE_BLOCKS',
					clientIds: [ clientId ],
				},
				controls.select( blockEditorStoreName, 'getBlockCount' ),
			] );
		} );

		it( 'should return REMOVE_BLOCKS action, opting out of select previous', () => {
			const clientId = 'myclientid';

			const result = Array.from( removeBlock( clientId, false ) );

			expect( result ).toEqual( [
				controls.select(
					blockEditorStoreName,
					'getBlockRootClientId',
					clientId
				),
				controls.select(
					blockEditorStoreName,
					'getTemplateLock',
					undefined
				),
				controls.select(
					blockEditorStoreName,
					'getPreviousBlockClientId',
					'myclientid'
				),
				{
					type: 'REMOVE_BLOCKS',
					clientIds: [ clientId ],
				},
				controls.select( blockEditorStoreName, 'getBlockCount' ),
			] );
		} );
	} );

	describe( 'toggleBlockMode', () => {
		it( 'should return TOGGLE_BLOCK_MODE action', () => {
			const clientId = 'myclientid';
			expect( toggleBlockMode( clientId ) ).toEqual( {
				type: 'TOGGLE_BLOCK_MODE',
				clientId,
			} );
		} );
	} );

	describe( 'startTyping', () => {
		it( 'should return the START_TYPING action', () => {
			expect( startTyping() ).toEqual( {
				type: 'START_TYPING',
			} );
		} );
	} );

	describe( 'stopTyping', () => {
		it( 'should return the STOP_TYPING action', () => {
			expect( stopTyping() ).toEqual( {
				type: 'STOP_TYPING',
			} );
		} );
	} );

	describe( 'startDraggingBlocks', () => {
		it( 'should return the START_DRAGGING_BLOCKS action with the list of clientIds passed', () => {
			const clientIds = [ 'block-1', 'block-2', 'block-3' ];
			expect( startDraggingBlocks( clientIds ) ).toEqual( {
				type: 'START_DRAGGING_BLOCKS',
				clientIds,
			} );
		} );
	} );

	describe( 'stopDraggingBlocks', () => {
		it( 'should return the STOP_DRAGGING_BLOCKS action', () => {
			expect( stopDraggingBlocks() ).toEqual( {
				type: 'STOP_DRAGGING_BLOCKS',
			} );
		} );
	} );

	describe( 'enterFormattedText', () => {
		it( 'should return the ENTER_FORMATTED_TEXT action', () => {
			expect( enterFormattedText() ).toEqual( {
				type: 'ENTER_FORMATTED_TEXT',
			} );
		} );
	} );

	describe( 'exitFormattedText', () => {
		it( 'should return the EXIT_FORMATTED_TEXT action', () => {
			expect( exitFormattedText() ).toEqual( {
				type: 'EXIT_FORMATTED_TEXT',
			} );
		} );
	} );

	describe( 'toggleSelection', () => {
		it( 'should return the TOGGLE_SELECTION action with default value for isSelectionEnabled = true', () => {
			expect( toggleSelection() ).toEqual( {
				type: 'TOGGLE_SELECTION',
				isSelectionEnabled: true,
			} );
		} );

		it( 'should return the TOGGLE_SELECTION action with isSelectionEnabled = true as passed in the argument', () => {
			expect( toggleSelection( true ) ).toEqual( {
				type: 'TOGGLE_SELECTION',
				isSelectionEnabled: true,
			} );
		} );

		it( 'should return the TOGGLE_SELECTION action with isSelectionEnabled = false as passed in the argument', () => {
			expect( toggleSelection( false ) ).toEqual( {
				type: 'TOGGLE_SELECTION',
				isSelectionEnabled: false,
			} );
		} );
	} );

	describe( 'updateBlockListSettings', () => {
		it( 'should return the UPDATE_BLOCK_LIST_SETTINGS with undefined settings', () => {
			expect( updateBlockListSettings( 'chicken' ) ).toEqual( {
				type: 'UPDATE_BLOCK_LIST_SETTINGS',
				clientId: 'chicken',
				settings: undefined,
			} );
		} );

		it( 'should return the UPDATE_BLOCK_LIST_SETTINGS action with the passed settings', () => {
			expect(
				updateBlockListSettings( 'chicken', { chicken: 'ribs' } )
			).toEqual( {
				type: 'UPDATE_BLOCK_LIST_SETTINGS',
				clientId: 'chicken',
				settings: { chicken: 'ribs' },
			} );
		} );
	} );

	describe( 'replaceInnerBlocks', () => {
		const block = {
			clientId: 'ribs',
		};

		it( 'should return the REPLACE_INNER_BLOCKS action with default values set', () => {
			expect( replaceInnerBlocks( 'root', [ block ] ) ).toEqual( {
				type: 'REPLACE_INNER_BLOCKS',
				blocks: [ block ],
				rootClientId: 'root',
				time: expect.any( Number ),
				updateSelection: false,
				initialPosition: null,
			} );
		} );

		it( 'should return the REPLACE_INNER_BLOCKS action with updateSelection true', () => {
			expect( replaceInnerBlocks( 'root', [ block ], true ) ).toEqual( {
				type: 'REPLACE_INNER_BLOCKS',
				blocks: [ block ],
				rootClientId: 'root',
				time: expect.any( Number ),
				updateSelection: true,
				initialPosition: 0,
			} );
		} );
	} );

	describe( 'mergeBlocks', () => {
		afterEach( () => {
			getBlockTypes().forEach( ( block ) => {
				unregisterBlockType( block.name );
			} );
		} );

		it( 'should return MERGE_BLOCKS action', () => {
			const firstBlockClientId = 'blockA';
			const secondBlockClientId = 'blockB';
			const fulfillment = mergeBlocks(
				firstBlockClientId,
				secondBlockClientId
			);
			expect( fulfillment.next().value ).toEqual( {
				type: 'MERGE_BLOCKS',
				blocks: [ firstBlockClientId, secondBlockClientId ],
			} );
		} );

		it( 'should only focus the blockA if the blockA has no merge function', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );
			const blockA = deepFreeze( {
				clientId: 'chicken',
				name: 'core/test-block',
			} );
			const blockB = deepFreeze( {
				clientId: 'ribs',
				name: 'core/test-block',
			} );

			const fulfillment = mergeBlocks( blockA.clientId, blockB.clientId );
			expect( fulfillment.next() ).toEqual( {
				done: false,
				value: {
					type: 'MERGE_BLOCKS',
					blocks: [ blockA.clientId, blockB.clientId ],
				},
			} );
			fulfillment.next();
			expect( fulfillment.next( blockA ) ).toEqual( {
				done: false,
				value: selectBlock( 'chicken' ),
			} );
			expect( fulfillment.next( blockA ).done ).toEqual( true );
		} );

		it( 'should merge the blocks if blocks of the same type', () => {
			registerBlockType( 'core/test-block', {
				attributes: {
					content: {},
				},
				merge( attributes, attributesToMerge ) {
					return {
						content:
							attributes.content +
							' ' +
							attributesToMerge.content,
					};
				},
				save: noop,
				category: 'text',
				title: 'test block',
			} );
			const blockA = deepFreeze( {
				clientId: 'chicken',
				name: 'core/test-block',
				attributes: { content: 'chicken' },
				innerBlocks: [],
			} );
			const blockB = deepFreeze( {
				clientId: 'ribs',
				name: 'core/test-block',
				attributes: { content: 'ribs' },
				innerBlocks: [],
			} );

			const fulfillment = mergeBlocks( blockA.clientId, blockB.clientId );
			// MERGE_BLOCKS
			fulfillment.next();
			// getBlock A
			fulfillment.next();
			fulfillment.next( blockA );
			// getBlock B
			fulfillment.next( blockB );
			// getSelectionStart
			fulfillment.next( {
				clientId: blockB.clientId,
				attributeKey: 'content',
				offset: 0,
			} );
			// selectionChange
			fulfillment.next(
				selectionChange(
					blockA.clientId,
					'content',
					'chicken'.length + 1,
					'chicken'.length + 1
				)
			);
			fulfillment.next();
			fulfillment.next();
			expect( fulfillment.next( blockA ).value ).toMatchObject( {
				type: 'REPLACE_BLOCKS',
				clientIds: [ 'chicken', 'ribs' ],
				blocks: [
					{
						clientId: 'chicken',
						name: 'core/test-block',
						attributes: { content: 'chicken ribs' },
					},
				],
			} );
		} );

		it( 'should not merge the blocks have different types without transformation', () => {
			registerBlockType( 'core/test-block', {
				attributes: {
					content: {},
				},
				merge( attributes, attributesToMerge ) {
					return {
						content:
							attributes.content +
							' ' +
							attributesToMerge.content,
					};
				},
				save: noop,
				category: 'text',
				title: 'test block',
			} );
			registerBlockType( 'core/test-block-2', defaultBlockSettings );
			const blockA = deepFreeze( {
				clientId: 'chicken',
				name: 'core/test-block',
				attributes: { content: 'chicken' },
				innerBlocks: [],
			} );
			const blockB = deepFreeze( {
				clientId: 'ribs',
				name: 'core/test-block-2',
				attributes: { content: 'ribs' },
				innerBlocks: [],
			} );

			const fulfillment = mergeBlocks( blockA.clientId, blockB.clientId );
			// MERGE_BLOCKS
			fulfillment.next();
			// getBlock A
			fulfillment.next();
			fulfillment.next( blockA );
			// getBlock B
			expect( fulfillment.next( blockB ).value ).toEqual( {
				args: [],
				selectorName: 'getSelectionStart',
				storeKey: blockEditorStoreName,
				type: '@@data/SELECT',
			} );
			// getSelectionStart
			const next = fulfillment.next( {
				clientId: blockB.clientId,
				attributeKey: 'content',
				offset: 0,
			} );
			expect( next.value ).toEqual( undefined );
			expect( next.done ).toBe( true );
		} );

		it( 'should transform and merge the blocks', () => {
			registerBlockType( 'core/test-block', {
				attributes: {
					content: {
						type: 'string',
					},
				},
				merge( attributes, attributesToMerge ) {
					return {
						content:
							attributes.content +
							' ' +
							attributesToMerge.content,
					};
				},
				save: noop,
				category: 'text',
				title: 'test block',
			} );
			registerBlockType( 'core/test-block-2', {
				attributes: {
					content2: {
						type: 'string',
					},
				},
				transforms: {
					to: [
						{
							type: 'block',
							blocks: [ 'core/test-block' ],
							transform: ( { content2 } ) => {
								return createBlock( 'core/test-block', {
									content: content2,
								} );
							},
						},
					],
				},
				save: noop,
				category: 'text',
				title: 'test block 2',
			} );
			const blockA = deepFreeze( {
				clientId: 'chicken',
				name: 'core/test-block',
				attributes: { content: 'chicken' },
				innerBlocks: [],
			} );
			const blockB = deepFreeze( {
				clientId: 'ribs',
				name: 'core/test-block-2',
				attributes: { content2: 'ribs' },
				innerBlocks: [],
			} );

			const fulfillment = mergeBlocks( blockA.clientId, blockB.clientId );
			// MERGE_BLOCKS
			fulfillment.next();
			// getBlock A
			fulfillment.next();
			fulfillment.next( blockA );
			// getBlock B
			expect( fulfillment.next( blockB ).value ).toEqual( {
				args: [],
				selectorName: 'getSelectionStart',
				storeKey: blockEditorStoreName,
				type: '@@data/SELECT',
			} );
			expect(
				fulfillment.next( {
					clientId: blockB.clientId,
					attributeKey: 'content2',
					offset: 0,
				} ).value
			).toEqual(
				selectionChange(
					blockA.clientId,
					'content',
					'chicken'.length + 1,
					'chicken'.length + 1
				)
			);

			fulfillment.next();
			fulfillment.next();
			fulfillment.next();
			expect( fulfillment.next( blockA ).value ).toMatchObject( {
				type: 'REPLACE_BLOCKS',
				clientIds: [ 'chicken', 'ribs' ],
				blocks: [
					{
						clientId: 'chicken',
						name: 'core/test-block',
						attributes: { content: 'chicken ribs' },
					},
				],
			} );
		} );
	} );

	describe( 'validateBlocksToTemplate', () => {
		let store;
		beforeEach( () => {
			store = createRegistry().registerStore( blockEditorStoreName, {
				actions,
				selectors,
				reducer,
			} );

			registerBlockType( 'core/test-block', defaultBlockSettings );
		} );

		afterEach( () => {
			getBlockTypes().forEach( ( block ) => {
				unregisterBlockType( block.name );
			} );
		} );

		it( 'should return undefined if no template assigned', async () => {
			const result = await store.dispatch(
				validateBlocksToTemplate(
					resetBlocks( [ createBlock( 'core/test-block' ) ] ),
					store
				)
			);

			expect( result ).toEqual( undefined );
		} );

		it( 'should return undefined if invalid but unlocked', async () => {
			store.dispatch(
				updateSettings( {
					template: [ [ 'core/foo', {} ] ],
				} )
			);

			const result = await store.dispatch(
				validateBlocksToTemplate( [ createBlock( 'core/test-block' ) ] )
			);

			expect( result ).toEqual( undefined );
		} );

		it( 'should return undefined if locked and valid', async () => {
			store.dispatch(
				updateSettings( {
					template: [ [ 'core/test-block' ] ],
					templateLock: 'all',
				} )
			);

			const result = await store.dispatch(
				validateBlocksToTemplate( [ createBlock( 'core/test-block' ) ] )
			);

			expect( result ).toEqual( undefined );
		} );

		it( 'should return validity set action if invalid on default state', async () => {
			store.dispatch(
				updateSettings( {
					template: [ [ 'core/foo' ] ],
					templateLock: 'all',
				} )
			);

			const result = await store.dispatch(
				validateBlocksToTemplate( [ createBlock( 'core/test-block' ) ] )
			);

			expect( result ).toEqual( false );
		} );
	} );
} );
