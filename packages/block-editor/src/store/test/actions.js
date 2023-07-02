/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * WordPress dependencies
 */
import { createRegistry } from '@wordpress/data';
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

const noop = () => {};

const {
	clearSelectedBlock,
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
	validateBlocksToTemplate,
	registerInserterMediaCategory,
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
		it( 'should dispatch the RESET_BLOCKS action', () => {
			const dispatch = jest.fn();
			const blocks = [];
			resetBlocks( blocks )( { dispatch } );
			expect( dispatch ).toHaveBeenCalledWith( {
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
		it( 'should dispatch MULTI_SELECT action if blocks have the same root client id', () => {
			const start = 'start';
			const end = 'end';
			const select = {
				getBlockRootClientId() {
					return 'parent'; // For all client IDs.
				},
				getSelectedBlockCount() {
					return 0;
				},
			};
			const dispatch = jest.fn();

			multiSelect( start, end )( { select, dispatch } );

			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'MULTI_SELECT',
				start,
				end,
				initialPosition: 0,
			} );
		} );

		it( 'should do nothing if blocks have different root client ids', () => {
			const start = 'start';
			const end = 'end';
			const select = {
				getBlockRootClientId( clientId ) {
					switch ( clientId ) {
						case start:
							return 'parent';
						case end:
							return 'another parent';
						default:
							return null;
					}
				},
				getSelectedBlockCount() {
					return 0;
				},
			};
			const dispatch = jest.fn();

			multiSelect( start, end )( { select, dispatch } );

			expect( dispatch ).not.toHaveBeenCalled();
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
		it( 'should dispatch the REPLACE_BLOCKS action if the new block can be inserted in the destination root block', () => {
			const block = {
				clientId: 'ribs',
				name: 'core/test-block',
			};

			const select = {
				getSettings: () => null,
				getBlockRootClientId: () => null,
				canInsertBlockType: () => true,
				getBlockCount: () => 1,
			};
			const dispatch = jest.fn();

			replaceBlock( 'chicken', block )( { select, dispatch } );

			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'REPLACE_BLOCKS',
				clientIds: [ 'chicken' ],
				blocks: [ block ],
				time: expect.any( Number ),
				initialPosition: 0,
			} );
		} );
	} );

	describe( 'replaceBlocks', () => {
		it( 'should not dispatch the REPLACE_BLOCKS action if the replacement is not possible', () => {
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

			const select = {
				getSettings: () => null,
				getBlockRootClientId: () => null,
				canInsertBlockType: ( clientId ) => {
					switch ( clientId ) {
						case 'core/test-ribs':
							return true;
						case 'core/test-chicken':
						default:
							return false;
					}
				},
			};
			const dispatch = jest.fn();

			replaceBlocks( [ 'chicken' ], blocks )( { select, dispatch } );

			expect( dispatch ).not.toHaveBeenCalled();
		} );

		it( 'should dispatch the REPLACE_BLOCKS action if the all the replacement blocks can be inserted in the parent block', () => {
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

			const select = {
				getSettings: () => null,
				getBlockRootClientId: () => null,
				canInsertBlockType: () => true,
				getBlockCount: () => 1,
			};
			const dispatch = jest.fn();

			replaceBlocks( [ 'chicken' ], blocks )( { select, dispatch } );

			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'REPLACE_BLOCKS',
				clientIds: [ 'chicken' ],
				blocks,
				time: expect.any( Number ),
				initialPosition: 0,
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

			const select = {
				getSettings: () => null,
				getBlockRootClientId: () => null,
				canInsertBlockType: () => true,
				getBlockCount: () => 1,
			};
			const dispatch = jest.fn();

			replaceBlocks(
				[ 'chicken' ],
				blocks,
				null,
				null,
				meta
			)( { select, dispatch } );

			expect( dispatch ).toHaveBeenCalledWith( {
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

			const select = {
				getSettings: () => null,
				canInsertBlockType: () => true,
			};
			const dispatch = jest.fn();

			insertBlock(
				block,
				index,
				'testclientid',
				true
			)( { select, dispatch } );

			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'INSERT_BLOCKS',
				blocks: [ block ],
				index,
				rootClientId: 'testclientid',
				time: expect.any( Number ),
				updateSelection: true,
				initialPosition: 0,
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

			const select = {
				getSettings: () => ( {
					__experimentalPreferredStyleVariations: {
						value: {
							'core/test-ribs': 'squared',
							'core/test-chicken-ribs': 'colorful',
						},
					},
				} ),
				canInsertBlockType: () => true,
			};
			const dispatch = jest.fn();

			insertBlocks(
				blocks,
				5,
				'testrootid',
				false
			)( { select, dispatch } );

			expect( dispatch ).toHaveBeenCalledWith( {
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

			const select = {
				getSettings: () => ( {
					__experimentalPreferredStyleVariations: {
						value: {
							'core/test-ribs': 'squared',
						},
					},
				} ),
				canInsertBlockType: () => true,
			};
			const dispatch = jest.fn();

			insertBlocks(
				blocks,
				5,
				'testrootid',
				false
			)( { select, dispatch } );

			expect( dispatch ).toHaveBeenCalledWith( {
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

			const select = {
				getSettings: () => null,
				canInsertBlockType: ( clientId ) => {
					switch ( clientId ) {
						case 'core/test-ribs':
							return true;
						case 'core/test-chicken':
							return false;
						case 'core/test-chicken-ribs':
							return true;
						default:
							return false;
					}
				},
			};
			const dispatch = jest.fn();

			insertBlocks(
				blocks,
				5,
				'testrootid',
				false
			)( { select, dispatch } );

			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'INSERT_BLOCKS',
				blocks: [ ribsBlock, chickenRibsBlock ],
				index: 5,
				rootClientId: 'testrootid',
				time: expect.any( Number ),
				updateSelection: false,
				initialPosition: null,
			} );
		} );

		it( 'does not dispatch INSERT_BLOCKS action if all the blocks are impossible to insert', () => {
			const ribsBlock = {
				clientId: 'ribs',
				name: 'core/test-ribs',
			};
			const chickenBlock = {
				clientId: 'chicken',
				name: 'core/test-chicken',
			};
			const blocks = [ ribsBlock, chickenBlock ];

			const select = {
				getSettings: () => null,
				canInsertBlockType: () => false,
			};
			const dispatch = jest.fn();

			insertBlocks(
				blocks,
				5,
				'testrootid',
				false
			)( { select, dispatch } );

			expect( dispatch ).not.toHaveBeenCalled();
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

			const select = {
				getSettings: () => null,
				canInsertBlockType: ( clientId ) => {
					switch ( clientId ) {
						case 'core/test-ribs':
							return true;
						case 'core/test-chicken':
							return false;
						case 'core/test-chicken-ribs':
							return true;
						default:
							return false;
					}
				},
			};
			const dispatch = jest.fn();

			insertBlocks(
				blocks,
				5,
				'testrootid',
				false,
				0,
				meta
			)( { select, dispatch } );

			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'INSERT_BLOCKS',
				blocks: [ ribsBlock, chickenRibsBlock ],
				index: 5,
				rootClientId: 'testrootid',
				time: expect.any( Number ),
				updateSelection: false,
				initialPosition: null,
				meta: { patternName: 'core/chicken-ribs-pattern' },
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

	describe( 'removeBlocks', () => {
		it( 'should dispatch REMOVE_BLOCKS action', () => {
			const clientId = 'clientId';
			const clientIds = [ clientId ];

			const select = {
				getBlockRootClientId: () => undefined,
				canRemoveBlocks: () => true,
				getBlockRemovalRules: () => false,
			};
			const dispatch = Object.assign( jest.fn(), {
				selectPreviousBlock: jest.fn(),
			} );

			removeBlocks( clientIds )( { select, dispatch } );

			expect( dispatch.selectPreviousBlock ).toHaveBeenCalledWith(
				clientId,
				true
			);

			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'REMOVE_BLOCKS',
				clientIds,
			} );
		} );
	} );

	describe( 'moveBlocksToPosition', () => {
		it( 'should not dispatch MOVE_BLOCKS_TO_POSITION action if locking is all', () => {
			const select = {
				canMoveBlocks: () => false,
			};
			const dispatch = jest.fn();

			moveBlocksToPosition(
				[ 'chicken' ],
				'ribs',
				'ribs',
				5
			)( { select, dispatch } );

			expect( dispatch ).not.toHaveBeenCalled();
		} );

		it( 'should dispatch MOVE_BLOCKS_TO_POSITION action if there is not locking in the original root block and block can be inserted in the destination', () => {
			const select = {
				canMoveBlocks: () => true,
				canRemoveBlocks: () => true,
				canInsertBlocks: () => true,
			};
			const dispatch = jest.fn();

			moveBlocksToPosition(
				[ 'chicken' ],
				'ribs',
				'chicken-ribs',
				5
			)( { select, dispatch } );

			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'MOVE_BLOCKS_TO_POSITION',
				fromRootClientId: 'ribs',
				toRootClientId: 'chicken-ribs',
				clientIds: [ 'chicken' ],
				index: 5,
			} );
		} );

		it( 'should not dispatch MOVE_BLOCKS_TO_POSITION action if there is not locking in the original root block and block can be inserted in the destination', () => {
			const select = {
				canMoveBlocks: () => true,
				canRemoveBlocks: () => true,
				canInsertBlocks: () => false,
			};
			const dispatch = jest.fn();

			moveBlocksToPosition(
				[ 'chicken' ],
				'ribs',
				'chicken-ribs',
				5
			)( { select, dispatch } );

			expect( dispatch ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'moveBlockToPosition', () => {
		it( 'should dispatch MOVE_BLOCKS_TO_POSITION action with a single block', () => {
			const select = {
				canMoveBlocks: () => true,
			};
			const dispatch = jest.fn();

			moveBlocksToPosition(
				'chicken',
				'ribs',
				'ribs',
				5
			)( { select, dispatch } );

			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'MOVE_BLOCKS_TO_POSITION',
				fromRootClientId: 'ribs',
				toRootClientId: 'ribs',
				clientIds: 'chicken',
				index: 5,
			} );
		} );
	} );

	describe( 'removeBlock', () => {
		it( 'should dispatch REMOVE_BLOCKS action', () => {
			const clientId = 'myclientid';

			const select = {
				getBlockRootClientId: () => null,
				canRemoveBlocks: () => true,
				getBlockRemovalRules: () => false,
			};
			const dispatch = Object.assign( jest.fn(), {
				selectPreviousBlock: jest.fn(),
			} );

			removeBlock( clientId )( { select, dispatch } );

			expect( dispatch.selectPreviousBlock ).toHaveBeenCalledWith(
				clientId,
				true
			);

			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'REMOVE_BLOCKS',
				clientIds: [ clientId ],
			} );
		} );

		it( 'should dispatch REMOVE_BLOCKS action, opting out of select previous', () => {
			const clientId = 'myclientid';

			const select = {
				getBlockRootClientId: () => null,
				canRemoveBlocks: () => true,
				getBlockRemovalRules: () => false,
			};
			const dispatch = Object.assign( jest.fn(), {
				selectPreviousBlock: jest.fn(),
			} );

			removeBlocks( [ clientId ], false )( { select, dispatch } );

			expect( dispatch.selectPreviousBlock ).not.toHaveBeenCalled();

			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'REMOVE_BLOCKS',
				clientIds: [ clientId ],
			} );
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

			const select = {
				getBlock: ( clientId ) =>
					[ blockA, blockB ].find( ( b ) => b.clientId === clientId ),
			};
			const dispatch = Object.assign( jest.fn(), {
				selectBlock: jest.fn(),
			} );

			mergeBlocks(
				blockA.clientId,
				blockB.clientId
			)( { select, dispatch } );

			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'MERGE_BLOCKS',
				blocks: [ blockA.clientId, blockB.clientId ],
			} );
			expect( dispatch.selectBlock ).toHaveBeenCalledWith( 'chicken' );
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

			const select = {
				getBlock: ( clientId ) =>
					[ blockA, blockB ].find( ( b ) => b.clientId === clientId ),
				getSelectionStart: () => ( {
					clientId: blockB.clientId,
					attributeKey: 'content',
					offset: 0,
				} ),
			};
			const dispatch = Object.assign( jest.fn(), {
				replaceBlocks: jest.fn(),
				selectionChange: jest.fn(),
			} );

			mergeBlocks(
				blockA.clientId,
				blockB.clientId
			)( { select, dispatch } );

			expect( dispatch.selectionChange ).toHaveBeenCalledWith(
				blockA.clientId,
				'content',
				'chicken'.length + 1,
				'chicken'.length + 1
			);

			expect( dispatch.replaceBlocks ).toHaveBeenCalledWith(
				[ 'chicken', 'ribs' ],
				[
					expect.objectContaining( {
						clientId: 'chicken',
						name: 'core/test-block',
						attributes: { content: 'chicken ribs' },
					} ),
				],
				0
			);
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

			const select = {
				getBlock: ( clientId ) =>
					[ blockA, blockB ].find( ( b ) => b.clientId === clientId ),
				getSelectionStart: () => ( {
					clientId: blockB.clientId,
					attributeKey: 'content',
					offset: 0,
				} ),
			};
			const dispatch = Object.assign( jest.fn(), {
				replaceBlocks: jest.fn(),
			} );

			mergeBlocks(
				blockA.clientId,
				blockB.clientId
			)( { select, dispatch } );

			expect( dispatch.replaceBlocks ).not.toHaveBeenCalled();
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

			const select = {
				getBlock: ( clientId ) =>
					[ blockA, blockB ].find( ( b ) => b.clientId === clientId ),
				getSelectionStart: () => ( {
					clientId: blockB.clientId,
					attributeKey: 'content2',
					offset: 0,
				} ),
			};
			const dispatch = Object.assign( jest.fn(), {
				replaceBlocks: jest.fn(),
				selectionChange: jest.fn(),
			} );

			mergeBlocks(
				blockA.clientId,
				blockB.clientId
			)( { select, dispatch } );

			expect( dispatch.selectionChange ).toHaveBeenCalledWith(
				blockA.clientId,
				'content',
				'chicken'.length + 1,
				'chicken'.length + 1
			);

			expect( dispatch.replaceBlocks ).toHaveBeenCalledWith(
				[ 'chicken', 'ribs' ],
				[
					expect.objectContaining( {
						clientId: 'chicken',
						name: 'core/test-block',
						attributes: { content: 'chicken ribs' },
					} ),
				],
				0
			);
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

	describe( 'registerInserterMediaCategory', () => {
		describe( 'should log errors when invalid', () => {
			it( 'valid object', () => {
				registerInserterMediaCategory()( {} );
				expect( console ).toHaveErroredWith(
					'Category should be an `InserterMediaCategory` object.'
				);
			} );
			it( 'has name', () => {
				registerInserterMediaCategory( {} )( {} );
				expect( console ).toHaveErroredWith(
					'Category should have a `name` that should be unique among all media categories.'
				);
			} );
			it( 'has labels.name', () => {
				registerInserterMediaCategory( { name: 'a' } )( {} );
				expect( console ).toHaveErroredWith(
					'Category should have a `labels.name`.'
				);
			} );
			it( 'has proper media type', () => {
				registerInserterMediaCategory( {
					name: 'a',
					labels: { name: 'a' },
					mediaType: 'b',
				} )( {} );
				expect( console ).toHaveErroredWith(
					'Category should have `mediaType` property that is one of `image|audio|video`.'
				);
			} );
			it( 'has fetch function', () => {
				registerInserterMediaCategory( {
					name: 'a',
					labels: { name: 'a' },
					mediaType: 'image',
					fetch: 'c',
				} )( {} );
				expect( console ).toHaveErroredWith(
					'Category should have a `fetch` function defined with the following signature `(InserterMediaRequest) => Promise<InserterMediaItem[]>`.'
				);
			} );
			it( 'has unique name', () => {
				registerInserterMediaCategory( {
					name: 'a',
					labels: { name: 'a' },
					mediaType: 'image',
					fetch: () => {},
				} )( {
					select: {
						getSettings: () => ( {
							inserterMediaCategories: [ { name: 'a' } ],
						} ),
					},
				} );
				expect( console ).toHaveErroredWith(
					'A category is already registered with the same name: "a".'
				);
			} );
			it( 'has unique labels.name', () => {
				registerInserterMediaCategory( {
					name: 'a',
					labels: { name: 'a' },
					mediaType: 'image',
					fetch: () => {},
				} )( {
					select: {
						getSettings: () => ( {
							inserterMediaCategories: [
								{ labels: { name: 'a' } },
							],
						} ),
					},
				} );
				expect( console ).toHaveErroredWith(
					'A category is already registered with the same labels.name: "a".'
				);
			} );
		} );
		it( 'should register a media category', () => {
			const category = {
				name: 'new',
				labels: { name: 'new' },
				mediaType: 'image',
				fetch: () => {},
			};
			const inserterMediaCategories = [
				{ name: 'a', labels: { name: 'a' } },
			];
			const dispatch = jest.fn();
			registerInserterMediaCategory( category )( {
				select: {
					getSettings: () => ( { inserterMediaCategories } ),
				},
				dispatch,
			} );
			expect( dispatch ).toHaveBeenLastCalledWith( {
				type: 'UPDATE_SETTINGS',
				settings: {
					inserterMediaCategories: [
						...inserterMediaCategories,
						{ ...category, isExternalResource: true },
					],
				},
			} );
		} );
	} );
} );
