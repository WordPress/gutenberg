/**
 * Internal dependencies
 */
import {
	parseDropEvent,
	handleFilesDrop,
	handleHTMLDrop,
	handleBlockDrop,
} from '..';
/**
 * WordPress dependencies
 */
import { findTransform, pasteHandler } from '@wordpress/blocks';

const noop = () => {};

jest.mock( '@wordpress/blocks/src/api/factory', () => ( {
	findTransform: jest.fn(),
	getBlockTransforms: jest.fn(),
} ) );

jest.mock( '@wordpress/blocks/src/api/raw-handling', () => ( {
	pasteHandler: jest.fn(),
} ) );

describe( 'parseDropEvent', () => {
	it( 'converts an event dataTransfer property from JSON to an object', () => {
		const rawDataTransfer = {
			srcRootClientId: '123',
			srcClientIds: [ 'abc' ],
			srcIndex: 1,
			type: 'block',
		};
		const event = {
			dataTransfer: {
				getData() {
					return JSON.stringify( rawDataTransfer );
				},
			},
		};

		expect( parseDropEvent( event ) ).toEqual( rawDataTransfer );
	} );

	it( 'defaults any missing values to null', () => {
		const rawDataTransfer = {
			srcClientIds: [ 'abc' ],
			type: 'block',
		};
		const event = {
			dataTransfer: {
				getData() {
					return JSON.stringify( rawDataTransfer );
				},
			},
		};

		expect( parseDropEvent( event ) ).toEqual( {
			srcRootClientId: null,
			srcIndex: null,
			...rawDataTransfer,
		} );
	} );

	it( 'returns an object with null values if the event dataTransfer can not be parsed', () => {
		const expected = {
			srcRootClientId: null,
			srcClientIds: null,
			srcIndex: null,
			type: null,
		};
		const event = {
			dataTransfer: {
				getData() {
					return '{ something_that_cannot_be_parsed_as_json }';
				},
			},
		};

		expect( parseDropEvent( event ) ).toEqual( expected );
	} );

	it( 'returns an object with null values if the event has no dataTransfer property', () => {
		const expected = {
			srcRootClientId: null,
			srcClientIds: null,
			srcIndex: null,
			type: null,
		};
		const event = {};

		expect( parseDropEvent( event ) ).toEqual( expected );
	} );
} );

describe( 'handleBlockDrop', () => {
	it( 'does nothing if the event is not a block type drop', () => {
		const targetRootClientId = '1';
		const targetBlockIndex = 0;
		const getBlockIndex = noop;
		const getClientIdsOfDescendants = noop;
		const moveBlocksToPosition = jest.fn();

		const droppedBlocks = {
			type: 'not-a-block-type-drop',
		};

		handleBlockDrop(
			droppedBlocks,
			targetRootClientId,
			targetBlockIndex,
			getBlockIndex,
			getClientIdsOfDescendants,
			moveBlocksToPosition
		);

		expect( moveBlocksToPosition ).not.toHaveBeenCalled();
	} );

	it( 'does nothing if the block is dropped to the same place it was dragged from', () => {
		const targetRootClientId = '1';
		const targetBlockIndex = 0;
		// Target and source block index is the same.
		const getBlockIndex = jest.fn( () => targetBlockIndex );
		const getClientIdsOfDescendants = noop;
		const moveBlocksToPosition = jest.fn();

		const droppedBlocks = {
			type: 'block',
			// Target and source root client id is the same.
			srcRootClientId: targetRootClientId,
			srcClientIds: [ '2' ],
		};

		handleBlockDrop(
			droppedBlocks,
			targetRootClientId,
			targetBlockIndex,
			getBlockIndex,
			getClientIdsOfDescendants,
			moveBlocksToPosition
		);

		expect( moveBlocksToPosition ).not.toHaveBeenCalled();
	} );

	it( 'does nothing if the block is dropped as a child of itself', () => {
		const targetRootClientId = '1';
		const targetBlockIndex = 0;
		const getBlockIndex = jest.fn( () => 6 );
		const getClientIdsOfDescendants = noop;
		const moveBlocksToPosition = jest.fn();

		const droppedBlocks = {
			type: 'block',
			srcRootClientId: '0',
			// The dragged block is being dropped as a child of itself.
			srcClientIds: [ targetRootClientId ],
		};

		handleBlockDrop(
			droppedBlocks,
			targetRootClientId,
			targetBlockIndex,
			getBlockIndex,
			getClientIdsOfDescendants,
			moveBlocksToPosition
		);

		expect( moveBlocksToPosition ).not.toHaveBeenCalled();
	} );

	it( 'does nothing if the block is dropped as a descendant of itself', () => {
		const targetRootClientId = '1';
		const targetBlockIndex = 0;
		const getBlockIndex = jest.fn( () => 1 );
		// Dragged block is being dropped as a descendant of itself.
		const getClientIdsOfDescendants = jest.fn( () => [
			targetRootClientId,
		] );
		const moveBlocksToPosition = jest.fn();

		const droppedBlocks = {
			type: 'block',
			srcRootClientId: '0',
			srcClientIds: [ '5' ],
		};

		handleBlockDrop(
			droppedBlocks,
			targetRootClientId,
			targetBlockIndex,
			getBlockIndex,
			getClientIdsOfDescendants,
			moveBlocksToPosition
		);

		expect( moveBlocksToPosition ).not.toHaveBeenCalled();
	} );

	it( 'inserts blocks if the drop is valid', () => {
		const sourceClientIds = [ '5' ];
		const sourceRootClientId = '0';
		const targetRootClientId = '1';
		const targetBlockIndex = 0;
		const getBlockIndex = jest.fn( () => 1 );
		const getClientIdsOfDescendants = () => [];
		const moveBlocksToPosition = jest.fn();

		const droppedBlocks = {
			type: 'block',
			srcRootClientId: sourceRootClientId,
			srcClientIds: sourceClientIds,
		};

		handleBlockDrop(
			droppedBlocks,
			targetRootClientId,
			targetBlockIndex,
			getBlockIndex,
			getClientIdsOfDescendants,
			moveBlocksToPosition
		);

		expect( moveBlocksToPosition ).toHaveBeenCalledWith(
			sourceClientIds,
			sourceRootClientId,
			targetRootClientId,
			targetBlockIndex
		);
	} );

	it( 'adjusts the index blocks are dropped at when moved down under the same root block', () => {
		const sourceClientIds = [ '5', '6', '7' ];
		const sourceRootClientId = '0';
		const targetRootClientId = sourceRootClientId;
		const targetBlockIndex = 5;
		const getBlockIndex = jest.fn( () => 1 );
		// Dragged block is being dropped as a descendant of itself.
		const getClientIdsOfDescendants = () => [];
		const moveBlocksToPosition = jest.fn();

		const droppedBlocks = {
			type: 'block',
			srcRootClientId: sourceRootClientId,
			// The dragged block is being dropped as a child of itself.
			srcClientIds: sourceClientIds,
		};

		const insertIndex = targetBlockIndex - sourceClientIds.length;

		handleBlockDrop(
			droppedBlocks,
			targetRootClientId,
			targetBlockIndex,
			getBlockIndex,
			getClientIdsOfDescendants,
			moveBlocksToPosition
		);

		expect( moveBlocksToPosition ).toHaveBeenCalledWith(
			sourceClientIds,
			sourceRootClientId,
			targetRootClientId,
			insertIndex
		);
	} );
} );

describe( 'handleFilesDrop', () => {
	it( 'does nothing if hasUploadPermissions is false', () => {
		const droppedFiles = 'test';
		const updateBlockAttributes = jest.fn();
		const insertBlocks = jest.fn();
		const targetRootClientId = '1';
		const targetBlockIndex = 0;
		const uploadPermissions = false;

		handleFilesDrop(
			droppedFiles,
			targetRootClientId,
			targetBlockIndex,
			uploadPermissions,
			updateBlockAttributes,
			insertBlocks
		);

		expect( findTransform ).not.toHaveBeenCalled();
		expect( insertBlocks ).not.toHaveBeenCalled();
	} );

	it( 'does nothing if the block has no matching file transforms', () => {
		const droppedFiles = 'test';
		// Test the scenario of 'no transforms' by mocking findTransform
		// to have no return value.
		findTransform.mockImplementation( noop );
		const updateBlockAttributes = noop;
		const insertBlocks = jest.fn();
		const targetRootClientId = '1';
		const targetBlockIndex = 0;
		const uploadPermissions = true;

		handleFilesDrop(
			droppedFiles,
			targetRootClientId,
			targetBlockIndex,
			uploadPermissions,
			updateBlockAttributes,
			insertBlocks
		);

		expect( findTransform ).toHaveBeenCalled();
		expect( insertBlocks ).not.toHaveBeenCalled();
	} );

	it( 'inserts blocks if a valid transform can be found', () => {
		const droppedFiles = 'test';
		// Mock findTransform to return a valid transform. The implementation
		// of the transform isn't important just that there is a callable 'transform'
		// function that returns a value.
		const blocks = 'blocks';
		const transformation = { transform: jest.fn( () => blocks ) };
		findTransform.mockImplementation( () => transformation );
		const updateBlockAttributes = noop;
		const insertBlocks = jest.fn();
		const targetRootClientId = '1';
		const targetBlockIndex = 0;
		const uploadPermissions = true;

		handleFilesDrop(
			droppedFiles,
			targetRootClientId,
			targetBlockIndex,
			uploadPermissions,
			updateBlockAttributes,
			insertBlocks
		);

		expect( findTransform ).toHaveBeenCalled();
		expect( transformation.transform ).toHaveBeenCalledWith(
			droppedFiles,
			updateBlockAttributes
		);
		expect( insertBlocks ).toHaveBeenCalledWith(
			blocks,
			targetBlockIndex,
			targetRootClientId
		);
	} );
} );

describe( 'handleHTMLDrop', () => {
	it( 'does nothing if the HTML cannot be converted into blocks', () => {
		const droppedHTML = 'test';
		pasteHandler.mockImplementation( () => [] );
		const targetRootClientId = '1';
		const targetBlockIndex = 0;
		const insertBlocks = jest.fn();

		handleHTMLDrop(
			droppedHTML,
			targetRootClientId,
			targetBlockIndex,
			insertBlocks
		);

		expect( insertBlocks ).not.toHaveBeenCalled();
	} );

	it( 'inserts blocks if the HTML can be converted into blocks', () => {
		const droppedHTML = 'test';
		const blocks = [ 'blocks' ];
		pasteHandler.mockImplementation( () => blocks );
		const targetRootClientId = '1';
		const targetBlockIndex = 0;
		const insertBlocks = jest.fn();

		handleHTMLDrop(
			droppedHTML,
			targetRootClientId,
			targetBlockIndex,
			insertBlocks
		);

		expect( insertBlocks ).toHaveBeenCalledWith(
			blocks,
			targetBlockIndex,
			targetRootClientId
		);
	} );
} );
