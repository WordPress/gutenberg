/**
 * External dependencies
 */
import { cloneDeep } from 'lodash';

/**
 * Internal dependencies
 */
import {
	DEFAULT_BLOCK_LIST_CONTEXT,
	deleteBlockLayoutByClientId,
} from '../block-list-context.native';
import {
	BLOCKS_LAYOUTS_DATA,
	DEEP_NESTED_ID,
	GROUP_BLOCK_LAYOUT_DATA,
	NESTED_WITH_INNER_BLOCKS_ID,
	PARAGRAPH_BLOCK_LAYOUT_DATA,
	ROOT_LEVEL_ID,
} from './fixtures/block-list-context.native';

describe( 'findBlockLayoutByClientId', () => {
	it( "finds a block's layout data at root level", () => {
		const { findBlockLayoutByClientId } = DEFAULT_BLOCK_LIST_CONTEXT;
		const currentBlockLayouts = BLOCKS_LAYOUTS_DATA;

		const blockRootLevel = findBlockLayoutByClientId(
			currentBlockLayouts,
			ROOT_LEVEL_ID
		);

		expect( blockRootLevel ).toEqual(
			expect.objectContaining( { clientId: ROOT_LEVEL_ID } )
		);
	} );

	it( "finds a nested block's layout data with inner blocks", () => {
		const { findBlockLayoutByClientId } = DEFAULT_BLOCK_LIST_CONTEXT;
		const currentBlockLayouts = BLOCKS_LAYOUTS_DATA;

		const nestedBlock = findBlockLayoutByClientId(
			currentBlockLayouts,
			NESTED_WITH_INNER_BLOCKS_ID
		);

		expect( nestedBlock ).toEqual(
			expect.objectContaining( { clientId: NESTED_WITH_INNER_BLOCKS_ID } )
		);
	} );

	it( "finds a deep nested block's layout data", () => {
		const { findBlockLayoutByClientId } = DEFAULT_BLOCK_LIST_CONTEXT;
		const currentBlockLayouts = BLOCKS_LAYOUTS_DATA;

		const deepNestedBlock = findBlockLayoutByClientId(
			currentBlockLayouts,
			DEEP_NESTED_ID
		);

		expect( deepNestedBlock ).toEqual(
			expect.objectContaining( { clientId: DEEP_NESTED_ID } )
		);
	} );
} );

describe( 'deleteBlockLayoutByClientId', () => {
	it( "deletes a block's layout data at root level", () => {
		const { findBlockLayoutByClientId } = DEFAULT_BLOCK_LIST_CONTEXT;
		const defaultBlockLayouts = cloneDeep( BLOCKS_LAYOUTS_DATA );
		const currentBlockLayouts = deleteBlockLayoutByClientId(
			defaultBlockLayouts,
			ROOT_LEVEL_ID
		);

		const findDeletedBlock = findBlockLayoutByClientId(
			currentBlockLayouts,
			ROOT_LEVEL_ID
		);

		expect( findDeletedBlock ).toEqual(
			expect.not.objectContaining( { clientId: ROOT_LEVEL_ID } )
		);
	} );

	it( "deletes a nested block's layout data with inner blocks", () => {
		const { findBlockLayoutByClientId } = DEFAULT_BLOCK_LIST_CONTEXT;
		const defaultBlockLayouts = cloneDeep( BLOCKS_LAYOUTS_DATA );
		const currentBlockLayouts = deleteBlockLayoutByClientId(
			defaultBlockLayouts,
			NESTED_WITH_INNER_BLOCKS_ID
		);

		const findDeletedBlock = findBlockLayoutByClientId(
			currentBlockLayouts,
			NESTED_WITH_INNER_BLOCKS_ID
		);

		expect( findDeletedBlock ).toEqual(
			expect.not.objectContaining( {
				clientId: NESTED_WITH_INNER_BLOCKS_ID,
			} )
		);
	} );

	it( "deletes a deep nested block's layout data", () => {
		const { findBlockLayoutByClientId } = DEFAULT_BLOCK_LIST_CONTEXT;
		const defaultBlockLayouts = cloneDeep( BLOCKS_LAYOUTS_DATA );
		const currentBlockLayouts = deleteBlockLayoutByClientId(
			defaultBlockLayouts,
			DEEP_NESTED_ID
		);

		const findDeletedBlock = findBlockLayoutByClientId(
			currentBlockLayouts,
			DEEP_NESTED_ID
		);

		expect( findDeletedBlock ).toEqual(
			expect.not.objectContaining( {
				clientId: DEEP_NESTED_ID,
			} )
		);
	} );
} );

describe( 'updateBlocksLayouts', () => {
	it( "adds a new block's layout data at root level im an empty object", () => {
		const {
			blocksLayouts,
			findBlockLayoutByClientId,
			updateBlocksLayouts,
		} = DEFAULT_BLOCK_LIST_CONTEXT;
		const currentBlockLayouts = cloneDeep( blocksLayouts );
		const BLOCK_CLIENT_ID = PARAGRAPH_BLOCK_LAYOUT_DATA.clientId;

		updateBlocksLayouts( currentBlockLayouts, PARAGRAPH_BLOCK_LAYOUT_DATA );

		const findAddedBlock = findBlockLayoutByClientId(
			currentBlockLayouts.current,
			BLOCK_CLIENT_ID
		);

		expect( findAddedBlock ).toEqual(
			expect.objectContaining( { clientId: BLOCK_CLIENT_ID } )
		);
	} );

	it( "adds a new block's layout data at root level with inner blocks", () => {
		const {
			findBlockLayoutByClientId,
			updateBlocksLayouts,
		} = DEFAULT_BLOCK_LIST_CONTEXT;
		const currentBlockLayouts = {
			current: cloneDeep( BLOCKS_LAYOUTS_DATA ),
		};
		const PARENT_BLOCK_CLIENT_ID = GROUP_BLOCK_LAYOUT_DATA.clientId;

		// Add parent block
		updateBlocksLayouts( currentBlockLayouts, GROUP_BLOCK_LAYOUT_DATA );

		const findAddedParentBlock = findBlockLayoutByClientId(
			currentBlockLayouts.current,
			PARENT_BLOCK_CLIENT_ID
		);

		expect( findAddedParentBlock ).toEqual(
			expect.objectContaining( { clientId: PARENT_BLOCK_CLIENT_ID } )
		);

		// Add inner block to it's parent
		updateBlocksLayouts( currentBlockLayouts, {
			...PARAGRAPH_BLOCK_LAYOUT_DATA,
			rootClientId: PARENT_BLOCK_CLIENT_ID,
		} );

		const findAddedInnerBlock = findBlockLayoutByClientId(
			currentBlockLayouts.current,
			PARAGRAPH_BLOCK_LAYOUT_DATA.clientId
		);

		expect( findAddedInnerBlock ).toEqual(
			expect.objectContaining( {
				clientId: PARAGRAPH_BLOCK_LAYOUT_DATA.clientId,
			} )
		);
	} );

	it( "adds a new block's layout data at a deep level", () => {
		const {
			findBlockLayoutByClientId,
			updateBlocksLayouts,
		} = DEFAULT_BLOCK_LIST_CONTEXT;
		const currentBlockLayouts = {
			current: cloneDeep( BLOCKS_LAYOUTS_DATA ),
		};

		// Add block layout data to it's parents inner blocks
		updateBlocksLayouts( currentBlockLayouts, {
			...PARAGRAPH_BLOCK_LAYOUT_DATA,
			rootClientId: NESTED_WITH_INNER_BLOCKS_ID,
		} );

		const findAddedInnerBlock = findBlockLayoutByClientId(
			currentBlockLayouts.current,
			PARAGRAPH_BLOCK_LAYOUT_DATA.clientId
		);

		expect( findAddedInnerBlock ).toEqual(
			expect.objectContaining( {
				clientId: PARAGRAPH_BLOCK_LAYOUT_DATA.clientId,
			} )
		);
	} );

	it( "deletes a block's layout data at a root level", () => {
		const {
			findBlockLayoutByClientId,
			updateBlocksLayouts,
		} = DEFAULT_BLOCK_LIST_CONTEXT;
		const currentBlockLayouts = {
			current: cloneDeep( BLOCKS_LAYOUTS_DATA ),
		};

		updateBlocksLayouts( currentBlockLayouts, {
			shouldRemove: true,
			clientId: ROOT_LEVEL_ID,
		} );

		const findDeletedBlock = findBlockLayoutByClientId(
			currentBlockLayouts.current,
			ROOT_LEVEL_ID
		);

		expect( findDeletedBlock ).toEqual(
			expect.not.objectContaining( {
				clientId: ROOT_LEVEL_ID,
			} )
		);
	} );

	it( "deletes a block's layout data at a deep level", () => {
		const {
			findBlockLayoutByClientId,
			updateBlocksLayouts,
		} = DEFAULT_BLOCK_LIST_CONTEXT;
		const currentBlockLayouts = {
			current: cloneDeep( BLOCKS_LAYOUTS_DATA ),
		};

		updateBlocksLayouts( currentBlockLayouts, {
			shouldRemove: true,
			clientId: DEEP_NESTED_ID,
		} );

		const findDeletedBlock = findBlockLayoutByClientId(
			currentBlockLayouts.current,
			DEEP_NESTED_ID
		);

		expect( findDeletedBlock ).toEqual(
			expect.not.objectContaining( {
				clientId: DEEP_NESTED_ID,
			} )
		);
	} );
} );
