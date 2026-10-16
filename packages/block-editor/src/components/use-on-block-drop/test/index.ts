import { describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { findTransform, pasteHandler } from '@wordpress/blocks';
import { parseDropEvent, onFilesDrop, onHTMLDrop, onBlockDrop } from '..';

const noop = () => {};

vi.mock( import( '@wordpress/blocks' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	findTransform: vi.fn(),
	getBlockTransforms: vi.fn(),
	pasteHandler: vi.fn(),
} ) );

describe( 'parseDropEvent', () => {
	it( 'converts an event dataTransfer property from JSON to an object', () => {
		const rawDataTransfer = {
			blocks: null,
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

		expect( parseDropEvent( event as unknown as DragEvent ) ).toEqual(
			rawDataTransfer
		);
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

		expect( parseDropEvent( event as unknown as DragEvent ) ).toEqual( {
			srcRootClientId: null,
			srcIndex: null,
			blocks: null,
			...rawDataTransfer,
		} );
	} );

	it( 'returns an object with null values if the event dataTransfer can not be parsed', () => {
		const expected = {
			blocks: null,
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

		expect( parseDropEvent( event as unknown as DragEvent ) ).toEqual(
			expected
		);
	} );

	it( 'returns an object with null values if the event has no dataTransfer property', () => {
		const expected = {
			blocks: null,
			srcRootClientId: null,
			srcClientIds: null,
			srcIndex: null,
			type: null,
		};
		const event = {};

		expect( parseDropEvent( event as unknown as DragEvent ) ).toEqual(
			expected
		);
	} );
} );

describe( 'onBlockDrop', () => {
	it( 'does nothing if the event is not a block type drop', () => {
		const targetRootClientId = '1';
		const targetBlockIndex = 0;
		const getBlockIndex = noop as () => number;
		const getClientIdsOfDescendants = noop as () => string[];
		const moveBlocks = vi.fn();

		const event = {
			dataTransfer: {
				getData() {
					return JSON.stringify( {
						type: 'not-a-block-type-drop',
					} );
				},
			},
		};

		// @ts-expect-error The remaining arguments are not read by these drops.
		const eventHandler = onBlockDrop(
			targetRootClientId,
			targetBlockIndex,
			getBlockIndex,
			getClientIdsOfDescendants,
			moveBlocks
		);
		eventHandler( event as unknown as DragEvent );

		expect( moveBlocks ).not.toHaveBeenCalled();
	} );

	it( 'does nothing if the block is dropped to the same place it was dragged from', () => {
		const targetRootClientId = '1';
		const targetBlockIndex = 0;
		// Target and source block index is the same.
		const getBlockIndex = vi.fn( () => targetBlockIndex );
		const getClientIdsOfDescendants = noop as () => string[];
		const moveBlocks = vi.fn();

		const event = {
			dataTransfer: {
				getData() {
					return JSON.stringify( {
						type: 'block',
						// Target and source root client id is the same.
						srcRootClientId: targetRootClientId,
						srcClientIds: [ '2' ],
					} );
				},
			},
		};

		// @ts-expect-error The remaining arguments are not read by these drops.
		const eventHandler = onBlockDrop(
			targetRootClientId,
			targetBlockIndex,
			getBlockIndex,
			getClientIdsOfDescendants,
			moveBlocks
		);
		eventHandler( event as unknown as DragEvent );

		expect( moveBlocks ).not.toHaveBeenCalled();
	} );

	it( 'does nothing if the block is dropped as a child of itself', () => {
		const targetRootClientId = '1';
		const targetBlockIndex = 0;
		const getBlockIndex = vi.fn( () => 6 );
		const getClientIdsOfDescendants = noop as () => string[];
		const moveBlocks = vi.fn();

		const event = {
			dataTransfer: {
				getData() {
					return JSON.stringify( {
						type: 'block',
						srcRootClientId: '0',
						// The dragged block is being dropped as a child of itself.
						srcClientIds: [ targetRootClientId ],
					} );
				},
			},
		};

		// @ts-expect-error The remaining arguments are not read by these drops.
		const eventHandler = onBlockDrop(
			targetRootClientId,
			targetBlockIndex,
			getBlockIndex,
			getClientIdsOfDescendants,
			moveBlocks
		);
		eventHandler( event as unknown as DragEvent );

		expect( moveBlocks ).not.toHaveBeenCalled();
	} );

	it( 'does nothing if the block is dropped as a descendant of itself', () => {
		const targetRootClientId = '1';
		const targetBlockIndex = 0;
		const getBlockIndex = vi.fn( () => 1 );
		// Dragged block is being dropped as a descendant of itself.
		const getClientIdsOfDescendants = vi.fn( () => [ targetRootClientId ] );
		const moveBlocks = vi.fn();

		const event = {
			dataTransfer: {
				getData() {
					return JSON.stringify( {
						type: 'block',
						srcRootClientId: '0',
						srcClientIds: [ '5' ],
					} );
				},
			},
		};

		// @ts-expect-error The remaining arguments are not read by these drops.
		const eventHandler = onBlockDrop(
			targetRootClientId,
			targetBlockIndex,
			getBlockIndex,
			getClientIdsOfDescendants,
			moveBlocks
		);
		eventHandler( event as unknown as DragEvent );

		expect( moveBlocks ).not.toHaveBeenCalled();
	} );

	it( 'inserts blocks if the drop is valid', () => {
		const sourceClientIds = [ '5' ];
		const sourceRootClientId = '0';
		const targetRootClientId = '1';
		const targetBlockIndex = 0;
		const getBlockIndex = vi.fn( () => 1 );
		const getClientIdsOfDescendants = (): string[] => [];
		const moveBlocks = vi.fn();

		const event = {
			dataTransfer: {
				getData() {
					return JSON.stringify( {
						type: 'block',
						srcRootClientId: sourceRootClientId,
						srcClientIds: sourceClientIds,
					} );
				},
			},
		};

		// @ts-expect-error The remaining arguments are not read by these drops.
		const eventHandler = onBlockDrop(
			targetRootClientId,
			targetBlockIndex,
			getBlockIndex,
			getClientIdsOfDescendants,
			moveBlocks
		);
		eventHandler( event as unknown as DragEvent );

		expect( moveBlocks ).toHaveBeenCalledWith(
			sourceClientIds,
			sourceRootClientId,
			targetBlockIndex
		);
	} );

	it( 'adjusts the index blocks are dropped at when moved down under the same root block', () => {
		const sourceClientIds = [ '5', '6', '7' ];
		const sourceRootClientId = '0';
		const targetRootClientId = sourceRootClientId;
		const targetBlockIndex = 5;
		const getBlockIndex = vi.fn( () => 1 );
		// Dragged block is being dropped as a descendant of itself.
		const getClientIdsOfDescendants = (): string[] => [];
		const moveBlocks = vi.fn();

		const event = {
			dataTransfer: {
				getData() {
					return JSON.stringify( {
						type: 'block',
						srcRootClientId: sourceRootClientId,
						// The dragged block is being dropped as a child of itself.
						srcClientIds: sourceClientIds,
					} );
				},
			},
		};

		const insertIndex = targetBlockIndex - sourceClientIds.length;

		// @ts-expect-error The remaining arguments are not read by these drops.
		const eventHandler = onBlockDrop(
			targetRootClientId,
			targetBlockIndex,
			getBlockIndex,
			getClientIdsOfDescendants,
			moveBlocks
		);
		eventHandler( event as unknown as DragEvent );

		expect( moveBlocks ).toHaveBeenCalledWith(
			sourceClientIds,
			sourceRootClientId,
			insertIndex
		);
	} );
} );

describe( 'onFilesDrop', () => {
	it( 'does nothing if hasUploadPermissions is false', () => {
		const updateBlockAttributes = vi.fn();
		const canInsertBlockType = noop as () => boolean;
		const insertOrReplaceBlocks = vi.fn();
		const targetRootClientId = '1';
		const getSettings = vi.fn( () => ( {} ) );

		const onFileDropHandler = onFilesDrop(
			targetRootClientId,
			getSettings,
			updateBlockAttributes,
			canInsertBlockType,
			insertOrReplaceBlocks
		);
		// @ts-expect-error The handler returns before reading the files.
		onFileDropHandler();

		expect( findTransform ).not.toHaveBeenCalled();
		expect( insertOrReplaceBlocks ).not.toHaveBeenCalled();
	} );

	it( 'does nothing if the block has no matching file transforms', () => {
		// Test the scenario of 'no transforms' by mocking findTransform
		// to have no return value.
		( findTransform as Mock ).mockImplementation( noop );
		const updateBlockAttributes = noop;
		const insertOrReplaceBlocks = vi.fn();
		const canInsertBlockType = noop as () => boolean;
		const targetRootClientId = '1';
		const getSettings = vi.fn( () => ( {
			mediaUpload: true,
		} ) );

		const onFileDropHandler = onFilesDrop(
			targetRootClientId,
			getSettings,
			updateBlockAttributes,
			canInsertBlockType,
			insertOrReplaceBlocks
		);
		// @ts-expect-error The handler returns before reading the files.
		onFileDropHandler();

		expect( findTransform ).toHaveBeenCalled();
		expect( insertOrReplaceBlocks ).not.toHaveBeenCalled();
	} );

	it( 'inserts blocks if a valid transform can be found', () => {
		// Mock findTransform to return a valid transform. The implementation
		// of the transform isn't important just that there is a callable 'transform'
		// function that returns a value.
		const blocks = 'blocks';
		const transformation = { transform: vi.fn( () => blocks ) };
		( findTransform as Mock ).mockImplementation( () => transformation );
		const updateBlockAttributes = noop;
		const canInsertBlockType = noop as () => boolean;
		const insertOrReplaceBlocks = vi.fn();
		const targetRootClientId = '1';
		const getSettings = vi.fn( () => ( {
			mediaUpload: true,
		} ) );

		const onFileDropHandler = onFilesDrop(
			targetRootClientId,
			getSettings,
			updateBlockAttributes,
			canInsertBlockType,
			insertOrReplaceBlocks
		);
		const files = 'test';
		onFileDropHandler( files as unknown as File[] );

		expect( findTransform ).toHaveBeenCalled();
		expect( transformation.transform ).toHaveBeenCalledWith(
			files,
			updateBlockAttributes
		);
		expect( insertOrReplaceBlocks ).toHaveBeenCalledWith( blocks );
	} );
} );

describe( 'onHTMLDrop', () => {
	it( 'does nothing if the HTML cannot be converted into blocks', () => {
		( pasteHandler as Mock ).mockImplementation( () => [] );
		const insertOrReplaceBlocks = vi.fn();

		const eventHandler = onHTMLDrop( insertOrReplaceBlocks );
		// @ts-expect-error The mocked paste handler ignores the HTML.
		eventHandler();

		expect( insertOrReplaceBlocks ).not.toHaveBeenCalled();
	} );

	it( 'inserts blocks if the HTML can be converted into blocks', () => {
		const blocks = [ 'blocks' ];
		( pasteHandler as Mock ).mockImplementation( () => blocks );
		const insertOrReplaceBlocks = vi.fn();

		const eventHandler = onHTMLDrop( insertOrReplaceBlocks );
		// @ts-expect-error The mocked paste handler ignores the HTML.
		eventHandler();

		expect( insertOrReplaceBlocks ).toHaveBeenCalledWith( blocks );
	} );
} );
