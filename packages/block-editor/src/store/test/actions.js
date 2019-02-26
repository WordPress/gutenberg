/**
 * Internal dependencies
 */
import {
	clearSelectedBlock,
	enterFormattedText,
	exitFormattedText,
	hideInsertionPoint,
	insertBlock,
	insertBlocks,
	mergeBlocks,
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
	toggleBlockMode,
	toggleSelection,
	updateBlock,
	updateBlockAttributes,
	updateBlockListSettings,
} from '../actions';
import { select } from '../controls';

describe( 'actions', () => {
	describe( 'resetBlocks', () => {
		it( 'should return the RESET_BLOCKS actions', () => {
			const blocks = [];
			const result = resetBlocks( blocks );
			expect( result ).toEqual( {
				type: 'RESET_BLOCKS',
				blocks,
			} );
		} );
	} );

	describe( 'updateBlockAttributes', () => {
		it( 'should return the UPDATE_BLOCK_ATTRIBUTES action', () => {
			const clientId = 'myclientid';
			const attributes = {};
			const result = updateBlockAttributes( clientId, attributes );
			expect( result ).toEqual( {
				type: 'UPDATE_BLOCK_ATTRIBUTES',
				clientId,
				attributes,
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
			expect( multiSelect( start, end ) ).toEqual( {
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
			expect(
				replaceBlockGenerator.next().value,
			).toEqual( {
				args: [ 'chicken' ],
				selectorName: 'getBlockRootClientId',
				storeName: 'core/block-editor',
				type: 'SELECT',
			} );

			expect(
				replaceBlockGenerator.next().value,
			).toEqual( {
				args: [ 'core/test-block', undefined ],
				selectorName: 'canInsertBlockType',
				storeName: 'core/block-editor',
				type: 'SELECT',
			} );

			expect(
				replaceBlockGenerator.next( true ).value,
			).toEqual( {
				type: 'REPLACE_BLOCKS',
				clientIds: [ 'chicken' ],
				blocks: [ block ],
				time: expect.any( Number ),
			} );

			expect(
				replaceBlockGenerator.next().value,
			).toEqual( {
				args: [],
				selectorName: 'getBlockCount',
				storeName: 'core/block-editor',
				type: 'SELECT',
			} );

			expect(
				replaceBlockGenerator.next( 1 ),
			).toEqual( {
				value: undefined,
				done: true,
			} );
		} );
	} );

	describe( 'replaceBlocks', () => {
		it( 'should not yield the REPLACE_BLOCKS action if the replacement is not possible', () => {
			const blocks = [ {
				clientId: 'ribs',
				name: 'core/test-ribs',
			}, {
				clientId: 'chicken',
				name: 'core/test-chicken',
			} ];

			const replaceBlockGenerator = replaceBlocks( [ 'chicken' ], blocks );
			expect(
				replaceBlockGenerator.next().value,
			).toEqual( {
				args: [ 'chicken' ],
				selectorName: 'getBlockRootClientId',
				storeName: 'core/block-editor',
				type: 'SELECT',
			} );

			expect(
				replaceBlockGenerator.next().value,
			).toEqual( {
				args: [ 'core/test-ribs', undefined ],
				selectorName: 'canInsertBlockType',
				storeName: 'core/block-editor',
				type: 'SELECT',
			} );

			expect(
				replaceBlockGenerator.next( true ).value,
			).toEqual( {
				args: [ 'core/test-chicken', undefined ],
				selectorName: 'canInsertBlockType',
				storeName: 'core/block-editor',
				type: 'SELECT',
			} );

			expect(
				replaceBlockGenerator.next( false ),
			).toEqual( {
				value: undefined,
				done: true,
			} );
		} );

		it( 'should yield the REPLACE_BLOCKS action if the replacement is possible', () => {
			const blocks = [ {
				clientId: 'ribs',
				name: 'core/test-ribs',
			}, {
				clientId: 'chicken',
				name: 'core/test-chicken',
			} ];

			const replaceBlockGenerator = replaceBlocks( [ 'chicken' ], blocks );
			expect(
				replaceBlockGenerator.next().value,
			).toEqual( {
				args: [ 'chicken' ],
				selectorName: 'getBlockRootClientId',
				storeName: 'core/block-editor',
				type: 'SELECT',
			} );

			expect(
				replaceBlockGenerator.next().value,
			).toEqual( {
				args: [ 'core/test-ribs', undefined ],
				selectorName: 'canInsertBlockType',
				storeName: 'core/block-editor',
				type: 'SELECT',
			} );

			expect(
				replaceBlockGenerator.next( true ).value,
			).toEqual( {
				args: [ 'core/test-chicken', undefined ],
				selectorName: 'canInsertBlockType',
				storeName: 'core/block-editor',
				type: 'SELECT',
			} );

			expect(
				replaceBlockGenerator.next( true ).value,
			).toEqual( {
				type: 'REPLACE_BLOCKS',
				clientIds: [ 'chicken' ],
				blocks,
				time: expect.any( Number ),
			} );

			expect(
				replaceBlockGenerator.next().value,
			).toEqual( {
				args: [],
				selectorName: 'getBlockCount',
				storeName: 'core/block-editor',
				type: 'SELECT',
			} );

			expect(
				replaceBlockGenerator.next( 1 ),
			).toEqual( {
				value: undefined,
				done: true,
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

			const inserBlockGenerator = insertBlock( block, index, 'testclientid', true );
			expect(
				inserBlockGenerator.next().value
			).toEqual( {
				args: [ 'core/test-block', 'testclientid' ],
				selectorName: 'canInsertBlockType',
				storeName: 'core/block-editor',
				type: 'SELECT',
			} );

			expect(
				inserBlockGenerator.next( true ),
			).toEqual( {
				done: true,
				value: {
					type: 'INSERT_BLOCKS',
					blocks: [ block ],
					index,
					rootClientId: 'testclientid',
					time: expect.any( Number ),
					updateSelection: true,
				},
			} );
		} );
	} );

	describe( 'insertBlocks', () => {
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
			const blocks = [
				ribsBlock,
				chickenBlock,
				chickenRibsBlock,
			];

			const inserBlockGenerator = insertBlocks( blocks, 5, 'testrootid', false );

			expect(
				inserBlockGenerator.next().value
			).toEqual( {
				args: [ 'core/test-ribs', 'testrootid' ],
				selectorName: 'canInsertBlockType',
				storeName: 'core/block-editor',
				type: 'SELECT',
			} );

			expect(
				inserBlockGenerator.next( true ).value
			).toEqual( {
				args: [ 'core/test-chicken', 'testrootid' ],
				selectorName: 'canInsertBlockType',
				storeName: 'core/block-editor',
				type: 'SELECT',
			} );

			expect(
				inserBlockGenerator.next( false ).value,
			).toEqual( {
				args: [ 'core/test-chicken-ribs', 'testrootid' ],
				selectorName: 'canInsertBlockType',
				storeName: 'core/block-editor',
				type: 'SELECT',
			} );

			expect(
				inserBlockGenerator.next( true ),
			).toEqual( {
				done: true,
				value: {
					type: 'INSERT_BLOCKS',
					blocks: [ ribsBlock, chickenRibsBlock ],
					index: 5,
					rootClientId: 'testrootid',
					time: expect.any( Number ),
					updateSelection: false,
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
			const blocks = [
				ribsBlock,
				chickenBlock,
			];

			const inserBlockGenerator = insertBlocks( blocks, 5, 'testrootid', false );

			expect(
				inserBlockGenerator.next().value
			).toEqual( {
				args: [ 'core/test-ribs', 'testrootid' ],
				selectorName: 'canInsertBlockType',
				storeName: 'core/block-editor',
				type: 'SELECT',
			} );

			expect(
				inserBlockGenerator.next( false ).value,
			).toEqual( {
				args: [ 'core/test-chicken', 'testrootid' ],
				selectorName: 'canInsertBlockType',
				storeName: 'core/block-editor',
				type: 'SELECT',
			} );

			expect(
				inserBlockGenerator.next( false ),
			).toEqual( {
				done: true,
				value: undefined,
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

	describe( 'mergeBlocks', () => {
		it( 'should return MERGE_BLOCKS action', () => {
			const firstBlockClientId = 'blockA';
			const secondBlockClientId = 'blockB';
			expect( mergeBlocks( firstBlockClientId, secondBlockClientId ) ).toEqual( {
				type: 'MERGE_BLOCKS',
				blocks: [ firstBlockClientId, secondBlockClientId ],
			} );
		} );
	} );

	describe( 'removeBlocks', () => {
		it( 'should return REMOVE_BLOCKS action', () => {
			const clientId = 'clientId';
			const clientIds = [ clientId ];

			const actions = Array.from( removeBlocks( clientIds ) );

			expect( actions ).toEqual( [
				selectPreviousBlock( clientId ),
				{
					type: 'REMOVE_BLOCKS',
					clientIds,
				},
				select(
					'core/block-editor',
					'getBlockCount',
				),
			] );
		} );
	} );

	describe( 'removeBlock', () => {
		it( 'should return REMOVE_BLOCKS action', () => {
			const clientId = 'myclientid';

			const actions = Array.from( removeBlock( clientId ) );

			expect( actions ).toEqual( [
				selectPreviousBlock( clientId ),
				{
					type: 'REMOVE_BLOCKS',
					clientIds: [ clientId ],
				},
				select(
					'core/block-editor',
					'getBlockCount',
				),
			] );
		} );

		it( 'should return REMOVE_BLOCKS action, opting out of select previous', () => {
			const clientId = 'myclientid';

			const actions = Array.from( removeBlock( clientId, false ) );

			expect( actions ).toEqual( [
				{
					type: 'REMOVE_BLOCKS',
					clientIds: [ clientId ],
				},
				select(
					'core/block-editor',
					'getBlockCount',
				),
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
			expect( updateBlockListSettings( 'chicken', { chicken: 'ribs' } ) ).toEqual( {
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
				updateSelection: true,
			} );
		} );

		it( 'should return the REPLACE_INNER_BLOCKS action with updateSelection false', () => {
			expect( replaceInnerBlocks( 'root', [ block ], false ) ).toEqual( {
				type: 'REPLACE_INNER_BLOCKS',
				blocks: [ block ],
				rootClientId: 'root',
				time: expect.any( Number ),
				updateSelection: false,
			} );
		} );
	} );
} );
