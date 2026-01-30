/**
 * External dependencies
 */
import { Y } from '@wordpress/sync';

/**
 * Internal dependencies
 */
import {
	areSelectionsStatesEqual,
	getSelectionState,
	SelectionType,
} from '../crdt-user-selections';
import { CRDT_RECORD_MAP_KEY } from '../../sync';
import type {
	CursorPosition,
	SelectionNone,
	SelectionCursor,
	SelectionInOneBlock,
	SelectionInMultipleBlocks,
	SelectionWholeBlock,
	SelectionState,
	WPBlockSelection,
} from '../../types';

// Shared Y.Doc and Y.Map for creating Y.Text instances
const yDoc = new Y.Doc();
const yMap = yDoc.getMap( 'test-map' );

/**
 * Helper to create a Y.Text instance attached to a Y.Doc.
 * Y.Text objects must be attached to a Y.Doc to create relative positions.
 *
 * @param yTextValue - The value of the Y.Text instance.
 * @param yTextKey   - The key of the Y.Text instance.
 * @return The Y.Text instance, attached to the Y.Doc.
 */
function createYText( yTextValue: string, yTextKey?: string ): Y.Text {
	const key = yTextKey ?? `test-text-${ Math.random() }`;
	const yText = new Y.Text( yTextValue );
	yMap.set( key, yText );
	return yText;
}

/**
 * Helper to create a CursorPosition with a relative position.
 *
 * @param text   - The text of the Y.Text instance.
 * @param offset - The offset of the Y.Text instance.
 * @return The CursorPosition.
 */
function createCursorPosition( text: string, offset: number ): CursorPosition {
	const yText = createYText( text );
	const relativePosition = Y.createRelativePositionFromTypeIndex(
		yText,
		offset
	);

	return {
		relativePosition,
		absoluteOffset: offset,
	};
}

describe( 'areSelectionsStatesEqual', () => {
	describe( 'different selection types', () => {
		test( 'returns false when comparing different selection types', () => {
			const selection1: SelectionNone = { type: SelectionType.None };
			const selection2: SelectionCursor = {
				type: SelectionType.Cursor,
				blockId: 'block-1',
				cursorPosition: createCursorPosition( 'test', 0 ),
			};

			expect( areSelectionsStatesEqual( selection1, selection2 ) ).toBe(
				false
			);
		} );
	} );

	describe( 'SelectionType.None', () => {
		test( 'returns true when both selections are None', () => {
			const selection1: SelectionNone = { type: SelectionType.None };
			const selection2: SelectionNone = { type: SelectionType.None };

			expect( areSelectionsStatesEqual( selection1, selection2 ) ).toBe(
				true
			);
		} );
	} );

	describe( 'SelectionType.Cursor', () => {
		test( 'returns true when cursor selections are identical', () => {
			const cursorPosition = createCursorPosition( 'test text', 5 );
			const selection1: SelectionCursor = {
				type: SelectionType.Cursor,
				blockId: 'block-1',
				cursorPosition,
			};
			const selection2: SelectionCursor = {
				type: SelectionType.Cursor,
				blockId: 'block-1',
				cursorPosition,
			};

			expect( areSelectionsStatesEqual( selection1, selection2 ) ).toBe(
				true
			);
		} );

		test( 'returns false when blockId differs', () => {
			const cursorPosition = createCursorPosition( 'test text', 5 );
			const selection1: SelectionCursor = {
				type: SelectionType.Cursor,
				blockId: 'block-1',
				cursorPosition,
			};
			const selection2: SelectionCursor = {
				type: SelectionType.Cursor,
				blockId: 'block-2',
				cursorPosition,
			};

			expect( areSelectionsStatesEqual( selection1, selection2 ) ).toBe(
				false
			);
		} );

		test( 'returns false when relative position differs', () => {
			const selection1: SelectionCursor = {
				type: SelectionType.Cursor,
				blockId: 'block-1',
				cursorPosition: createCursorPosition( 'test text', 5 ),
			};
			const selection2: SelectionCursor = {
				type: SelectionType.Cursor,
				blockId: 'block-1',
				cursorPosition: createCursorPosition( 'test text', 3 ),
			};

			expect( areSelectionsStatesEqual( selection1, selection2 ) ).toBe(
				false
			);
		} );

		test( 'returns false when absolute offset differs', () => {
			const yText = createYText( 'test text' );
			const relativePosition = Y.createRelativePositionFromTypeIndex(
				yText,
				5
			);

			const selection1: SelectionCursor = {
				type: SelectionType.Cursor,
				blockId: 'block-1',
				cursorPosition: {
					relativePosition,
					absoluteOffset: 5,
				},
			};
			const selection2: SelectionCursor = {
				type: SelectionType.Cursor,
				blockId: 'block-1',
				cursorPosition: {
					relativePosition,
					absoluteOffset: 6,
				},
			};

			expect( areSelectionsStatesEqual( selection1, selection2 ) ).toBe(
				false
			);
		} );
	} );

	describe( 'SelectionType.SelectionInOneBlock', () => {
		test( 'returns true when selections in one block are identical', () => {
			const cursorStartPosition = createCursorPosition( 'test text', 0 );
			const cursorEndPosition = createCursorPosition( 'test text', 4 );
			const selection1: SelectionInOneBlock = {
				type: SelectionType.SelectionInOneBlock,
				blockId: 'block-1',
				cursorStartPosition,
				cursorEndPosition,
			};
			const selection2: SelectionInOneBlock = {
				type: SelectionType.SelectionInOneBlock,
				blockId: 'block-1',
				cursorStartPosition,
				cursorEndPosition,
			};

			expect( areSelectionsStatesEqual( selection1, selection2 ) ).toBe(
				true
			);
		} );

		test( 'returns false when blockId differs', () => {
			const cursorStartPosition = createCursorPosition( 'test text', 0 );
			const cursorEndPosition = createCursorPosition( 'test text', 4 );
			const selection1: SelectionInOneBlock = {
				type: SelectionType.SelectionInOneBlock,
				blockId: 'block-1',
				cursorStartPosition,
				cursorEndPosition,
			};
			const selection2: SelectionInOneBlock = {
				type: SelectionType.SelectionInOneBlock,
				blockId: 'block-2',
				cursorStartPosition,
				cursorEndPosition,
			};

			expect( areSelectionsStatesEqual( selection1, selection2 ) ).toBe(
				false
			);
		} );

		test( 'returns false when start position differs', () => {
			const selection1: SelectionInOneBlock = {
				type: SelectionType.SelectionInOneBlock,
				blockId: 'block-1',
				cursorStartPosition: createCursorPosition( 'test text', 0 ),
				cursorEndPosition: createCursorPosition( 'test text', 4 ),
			};
			const selection2: SelectionInOneBlock = {
				type: SelectionType.SelectionInOneBlock,
				blockId: 'block-1',
				cursorStartPosition: createCursorPosition( 'test text', 1 ),
				cursorEndPosition: createCursorPosition( 'test text', 4 ),
			};

			expect( areSelectionsStatesEqual( selection1, selection2 ) ).toBe(
				false
			);
		} );

		test( 'returns false when end position differs', () => {
			const selection1: SelectionInOneBlock = {
				type: SelectionType.SelectionInOneBlock,
				blockId: 'block-1',
				cursorStartPosition: createCursorPosition( 'test text', 0 ),
				cursorEndPosition: createCursorPosition( 'test text', 4 ),
			};
			const selection2: SelectionInOneBlock = {
				type: SelectionType.SelectionInOneBlock,
				blockId: 'block-1',
				cursorStartPosition: createCursorPosition( 'test text', 0 ),
				cursorEndPosition: createCursorPosition( 'test text', 5 ),
			};

			expect( areSelectionsStatesEqual( selection1, selection2 ) ).toBe(
				false
			);
		} );

		test( 'returns false when absolute offset differs in start position', () => {
			const yText = createYText( 'test text' );
			const relativePosition = Y.createRelativePositionFromTypeIndex(
				yText,
				0
			);
			const cursorEndPosition = createCursorPosition( 'test text', 4 );

			const selection1: SelectionInOneBlock = {
				type: SelectionType.SelectionInOneBlock,
				blockId: 'block-1',
				cursorStartPosition: {
					relativePosition,
					absoluteOffset: 0,
				},
				cursorEndPosition,
			};
			const selection2: SelectionInOneBlock = {
				type: SelectionType.SelectionInOneBlock,
				blockId: 'block-1',
				cursorStartPosition: {
					relativePosition,
					absoluteOffset: 1,
				},
				cursorEndPosition,
			};

			expect( areSelectionsStatesEqual( selection1, selection2 ) ).toBe(
				false
			);
		} );
	} );

	describe( 'SelectionType.SelectionInMultipleBlocks', () => {
		test( 'returns true when selections in multiple blocks are identical', () => {
			const cursorStartPosition = createCursorPosition(
				'first block',
				5
			);
			const cursorEndPosition = createCursorPosition( 'second block', 3 );
			const selection1: SelectionInMultipleBlocks = {
				type: SelectionType.SelectionInMultipleBlocks,
				blockStartId: 'block-1',
				blockEndId: 'block-2',
				cursorStartPosition,
				cursorEndPosition,
			};
			const selection2: SelectionInMultipleBlocks = {
				type: SelectionType.SelectionInMultipleBlocks,
				blockStartId: 'block-1',
				blockEndId: 'block-2',
				cursorStartPosition,
				cursorEndPosition,
			};

			expect( areSelectionsStatesEqual( selection1, selection2 ) ).toBe(
				true
			);
		} );

		test( 'returns false when blockStartId differs', () => {
			const cursorStartPosition = createCursorPosition(
				'first block',
				5
			);
			const cursorEndPosition = createCursorPosition( 'second block', 3 );
			const selection1: SelectionInMultipleBlocks = {
				type: SelectionType.SelectionInMultipleBlocks,
				blockStartId: 'block-1',
				blockEndId: 'block-2',
				cursorStartPosition,
				cursorEndPosition,
			};
			const selection2: SelectionInMultipleBlocks = {
				type: SelectionType.SelectionInMultipleBlocks,
				blockStartId: 'block-0',
				blockEndId: 'block-2',
				cursorStartPosition,
				cursorEndPosition,
			};

			expect( areSelectionsStatesEqual( selection1, selection2 ) ).toBe(
				false
			);
		} );

		test( 'returns false when blockEndId differs', () => {
			const cursorStartPosition = createCursorPosition(
				'first block',
				5
			);
			const cursorEndPosition = createCursorPosition( 'second block', 3 );
			const selection1: SelectionInMultipleBlocks = {
				type: SelectionType.SelectionInMultipleBlocks,
				blockStartId: 'block-1',
				blockEndId: 'block-2',
				cursorStartPosition,
				cursorEndPosition,
			};
			const selection2: SelectionInMultipleBlocks = {
				type: SelectionType.SelectionInMultipleBlocks,
				blockStartId: 'block-1',
				blockEndId: 'block-3',
				cursorStartPosition,
				cursorEndPosition,
			};

			expect( areSelectionsStatesEqual( selection1, selection2 ) ).toBe(
				false
			);
		} );

		test( 'returns false when start cursor position differs', () => {
			const selection1: SelectionInMultipleBlocks = {
				type: SelectionType.SelectionInMultipleBlocks,
				blockStartId: 'block-1',
				blockEndId: 'block-2',
				cursorStartPosition: createCursorPosition( 'first block', 5 ),
				cursorEndPosition: createCursorPosition( 'second block', 3 ),
			};
			const selection2: SelectionInMultipleBlocks = {
				type: SelectionType.SelectionInMultipleBlocks,
				blockStartId: 'block-1',
				blockEndId: 'block-2',
				cursorStartPosition: createCursorPosition( 'first block', 6 ),
				cursorEndPosition: createCursorPosition( 'second block', 3 ),
			};

			expect( areSelectionsStatesEqual( selection1, selection2 ) ).toBe(
				false
			);
		} );

		test( 'returns false when end cursor position differs', () => {
			const selection1: SelectionInMultipleBlocks = {
				type: SelectionType.SelectionInMultipleBlocks,
				blockStartId: 'block-1',
				blockEndId: 'block-2',
				cursorStartPosition: createCursorPosition( 'first block', 5 ),
				cursorEndPosition: createCursorPosition( 'second block', 3 ),
			};
			const selection2: SelectionInMultipleBlocks = {
				type: SelectionType.SelectionInMultipleBlocks,
				blockStartId: 'block-1',
				blockEndId: 'block-2',
				cursorStartPosition: createCursorPosition( 'first block', 5 ),
				cursorEndPosition: createCursorPosition( 'second block', 4 ),
			};

			expect( areSelectionsStatesEqual( selection1, selection2 ) ).toBe(
				false
			);
		} );
	} );

	describe( 'SelectionType.WholeBlock', () => {
		test( 'returns true when whole block selections are identical', () => {
			const selection1: SelectionWholeBlock = {
				type: SelectionType.WholeBlock,
				blockId: 'block-1',
			};
			const selection2: SelectionWholeBlock = {
				type: SelectionType.WholeBlock,
				blockId: 'block-1',
			};

			expect( areSelectionsStatesEqual( selection1, selection2 ) ).toBe(
				true
			);
		} );

		test( 'returns false when blockId differs', () => {
			const selection1: SelectionWholeBlock = {
				type: SelectionType.WholeBlock,
				blockId: 'block-1',
			};
			const selection2: SelectionWholeBlock = {
				type: SelectionType.WholeBlock,
				blockId: 'block-2',
			};

			expect( areSelectionsStatesEqual( selection1, selection2 ) ).toBe(
				false
			);
		} );
	} );

	describe( 'unknown selection type', () => {
		test( 'returns false for unknown selection type', () => {
			const selection1: SelectionState = {
				type: 'unknown-type' as SelectionType,
			} as SelectionState;
			const selection2: SelectionNone = { type: SelectionType.None };

			expect( areSelectionsStatesEqual( selection1, selection2 ) ).toBe(
				false
			);
		} );
	} );
} );

/**
 * Helper function to create a Y.Doc with blocks for testing getSelectionState.
 */
function createTestDocWithBlocks() {
	const testDoc = new Y.Doc();
	const documentMap = testDoc.getMap( CRDT_RECORD_MAP_KEY );
	const blocks = new Y.Array();
	documentMap.set( 'blocks', blocks );

	// Create block 1 with a content attribute
	const block1 = new Y.Map();
	block1.set( 'clientId', 'block-1' );
	const block1Attrs = new Y.Map();
	block1Attrs.set( 'content', new Y.Text( 'Hello world' ) );
	block1.set( 'attributes', block1Attrs );
	block1.set( 'innerBlocks', new Y.Array() );
	blocks.push( [ block1 ] );

	// Create block 2 with a content attribute
	const block2 = new Y.Map();
	block2.set( 'clientId', 'block-2' );
	const block2Attrs = new Y.Map();
	block2Attrs.set( 'content', new Y.Text( 'Second block content' ) );
	block2.set( 'attributes', block2Attrs );
	block2.set( 'innerBlocks', new Y.Array() );
	blocks.push( [ block2 ] );

	// Create block 3 with nested inner blocks
	const block3 = new Y.Map();
	block3.set( 'clientId', 'block-3' );
	const block3Attrs = new Y.Map();
	block3Attrs.set( 'content', new Y.Text( 'Parent block' ) );
	block3.set( 'attributes', block3Attrs );

	// Add inner block to block 3
	const innerBlocks = new Y.Array();
	const innerBlock = new Y.Map();
	innerBlock.set( 'clientId', 'inner-block-1' );
	const innerBlockAttrs = new Y.Map();
	innerBlockAttrs.set( 'content', new Y.Text( 'Inner block content' ) );
	innerBlock.set( 'attributes', innerBlockAttrs );
	innerBlock.set( 'innerBlocks', new Y.Array() );
	innerBlocks.push( [ innerBlock ] );

	block3.set( 'innerBlocks', innerBlocks );
	blocks.push( [ block3 ] );

	return testDoc;
}

describe( 'getSelectionState', () => {
	let testDoc: Y.Doc;

	beforeEach( () => {
		testDoc = createTestDocWithBlocks();
	} );

	afterEach( () => {
		testDoc.destroy();
	} );

	describe( 'SelectionType.None', () => {
		test( 'returns None when selectionStart is empty object', () => {
			const selectionStart = {} as WPBlockSelection;
			const selectionEnd = {} as WPBlockSelection;

			const result = getSelectionState(
				selectionStart,
				selectionEnd,
				testDoc
			);

			expect( result.type ).toBe( SelectionType.None );
		} );
	} );

	describe( 'SelectionType.WholeBlock', () => {
		test( 'returns WholeBlock when same clientId and no offsets', () => {
			const selectionStart: WPBlockSelection = {
				clientId: 'block-1',
				attributeKey: 'content',
				offset: undefined,
			};
			const selectionEnd: WPBlockSelection = {
				clientId: 'block-1',
				attributeKey: 'content',
				offset: undefined,
			};

			const result = getSelectionState(
				selectionStart,
				selectionEnd,
				testDoc
			);

			expect( result.type ).toBe( SelectionType.WholeBlock );
			expect( ( result as SelectionWholeBlock ).blockId ).toBe(
				'block-1'
			);
		} );
	} );

	describe( 'SelectionType.Cursor', () => {
		test( 'returns Cursor when same clientId and same offset', () => {
			const selectionStart: WPBlockSelection = {
				clientId: 'block-1',
				attributeKey: 'content',
				offset: 5,
			};
			const selectionEnd: WPBlockSelection = {
				clientId: 'block-1',
				attributeKey: 'content',
				offset: 5,
			};

			const result = getSelectionState(
				selectionStart,
				selectionEnd,
				testDoc
			);

			expect( result.type ).toBe( SelectionType.Cursor );
			expect( ( result as SelectionCursor ).blockId ).toBe( 'block-1' );
			expect(
				( result as SelectionCursor ).cursorPosition
			).toBeDefined();
			expect(
				( result as SelectionCursor ).cursorPosition.absoluteOffset
			).toBe( 5 );
		} );

		test( 'returns Cursor at start of block (offset 0)', () => {
			const selectionStart: WPBlockSelection = {
				clientId: 'block-1',
				attributeKey: 'content',
				offset: 0,
			};
			const selectionEnd: WPBlockSelection = {
				clientId: 'block-1',
				attributeKey: 'content',
				offset: 0,
			};

			const result = getSelectionState(
				selectionStart,
				selectionEnd,
				testDoc
			);

			expect( result.type ).toBe( SelectionType.Cursor );
			expect(
				( result as SelectionCursor ).cursorPosition.absoluteOffset
			).toBe( 0 );
		} );

		test( 'returns None when block does not exist', () => {
			const selectionStart: WPBlockSelection = {
				clientId: 'non-existent-block',
				attributeKey: 'content',
				offset: 5,
			};
			const selectionEnd: WPBlockSelection = {
				clientId: 'non-existent-block',
				attributeKey: 'content',
				offset: 5,
			};

			const result = getSelectionState(
				selectionStart,
				selectionEnd,
				testDoc
			);

			expect( result.type ).toBe( SelectionType.None );
		} );

		test( 'returns None when attributeKey does not exist on block', () => {
			const selectionStart: WPBlockSelection = {
				clientId: 'block-1',
				attributeKey: 'non-existent-attribute',
				offset: 5,
			};
			const selectionEnd: WPBlockSelection = {
				clientId: 'block-1',
				attributeKey: 'non-existent-attribute',
				offset: 5,
			};

			const result = getSelectionState(
				selectionStart,
				selectionEnd,
				testDoc
			);

			expect( result.type ).toBe( SelectionType.None );
		} );

		test( 'returns None when attributeKey is missing', () => {
			const selectionStart: WPBlockSelection = {
				clientId: 'block-1',
				attributeKey: undefined as unknown as string,
				offset: 5,
			};
			const selectionEnd: WPBlockSelection = {
				clientId: 'block-1',
				attributeKey: undefined as unknown as string,
				offset: 5,
			};

			const result = getSelectionState(
				selectionStart,
				selectionEnd,
				testDoc
			);

			expect( result.type ).toBe( SelectionType.None );
		} );
	} );

	describe( 'SelectionType.SelectionInOneBlock', () => {
		test( 'returns SelectionInOneBlock when same clientId but different offsets', () => {
			const selectionStart: WPBlockSelection = {
				clientId: 'block-1',
				attributeKey: 'content',
				offset: 0,
			};
			const selectionEnd: WPBlockSelection = {
				clientId: 'block-1',
				attributeKey: 'content',
				offset: 5,
			};

			const result = getSelectionState(
				selectionStart,
				selectionEnd,
				testDoc
			);

			expect( result.type ).toBe( SelectionType.SelectionInOneBlock );
			expect( ( result as SelectionInOneBlock ).blockId ).toBe(
				'block-1'
			);
			expect(
				( result as SelectionInOneBlock ).cursorStartPosition
					.absoluteOffset
			).toBe( 0 );
			expect(
				( result as SelectionInOneBlock ).cursorEndPosition
					.absoluteOffset
			).toBe( 5 );
		} );

		test( 'returns None when start block does not exist', () => {
			const selectionStart: WPBlockSelection = {
				clientId: 'non-existent-block',
				attributeKey: 'content',
				offset: 0,
			};
			const selectionEnd: WPBlockSelection = {
				clientId: 'non-existent-block',
				attributeKey: 'content',
				offset: 5,
			};

			const result = getSelectionState(
				selectionStart,
				selectionEnd,
				testDoc
			);

			expect( result.type ).toBe( SelectionType.None );
		} );
	} );

	describe( 'SelectionType.SelectionInMultipleBlocks', () => {
		test( 'returns SelectionInMultipleBlocks when different clientIds', () => {
			const selectionStart: WPBlockSelection = {
				clientId: 'block-1',
				attributeKey: 'content',
				offset: 5,
			};
			const selectionEnd: WPBlockSelection = {
				clientId: 'block-2',
				attributeKey: 'content',
				offset: 3,
			};

			const result = getSelectionState(
				selectionStart,
				selectionEnd,
				testDoc
			);

			expect( result.type ).toBe(
				SelectionType.SelectionInMultipleBlocks
			);
			expect( ( result as SelectionInMultipleBlocks ).blockStartId ).toBe(
				'block-1'
			);
			expect( ( result as SelectionInMultipleBlocks ).blockEndId ).toBe(
				'block-2'
			);
			expect(
				( result as SelectionInMultipleBlocks ).cursorStartPosition
					.absoluteOffset
			).toBe( 5 );
			expect(
				( result as SelectionInMultipleBlocks ).cursorEndPosition
					.absoluteOffset
			).toBe( 3 );
		} );

		test( 'returns None when start block does not exist in multi-block selection', () => {
			const selectionStart: WPBlockSelection = {
				clientId: 'non-existent-block',
				attributeKey: 'content',
				offset: 5,
			};
			const selectionEnd: WPBlockSelection = {
				clientId: 'block-2',
				attributeKey: 'content',
				offset: 3,
			};

			const result = getSelectionState(
				selectionStart,
				selectionEnd,
				testDoc
			);

			expect( result.type ).toBe( SelectionType.None );
		} );

		test( 'returns None when end block does not exist in multi-block selection', () => {
			const selectionStart: WPBlockSelection = {
				clientId: 'block-1',
				attributeKey: 'content',
				offset: 5,
			};
			const selectionEnd: WPBlockSelection = {
				clientId: 'non-existent-block',
				attributeKey: 'content',
				offset: 3,
			};

			const result = getSelectionState(
				selectionStart,
				selectionEnd,
				testDoc
			);

			expect( result.type ).toBe( SelectionType.None );
		} );
	} );

	describe( 'inner blocks', () => {
		test( 'returns Cursor for selection in inner block', () => {
			const selectionStart: WPBlockSelection = {
				clientId: 'inner-block-1',
				attributeKey: 'content',
				offset: 3,
			};
			const selectionEnd: WPBlockSelection = {
				clientId: 'inner-block-1',
				attributeKey: 'content',
				offset: 3,
			};

			const result = getSelectionState(
				selectionStart,
				selectionEnd,
				testDoc
			);

			expect( result.type ).toBe( SelectionType.Cursor );
			expect( ( result as SelectionCursor ).blockId ).toBe(
				'inner-block-1'
			);
		} );

		test( 'returns SelectionInMultipleBlocks spanning parent and inner block', () => {
			const selectionStart: WPBlockSelection = {
				clientId: 'block-3',
				attributeKey: 'content',
				offset: 2,
			};
			const selectionEnd: WPBlockSelection = {
				clientId: 'inner-block-1',
				attributeKey: 'content',
				offset: 5,
			};

			const result = getSelectionState(
				selectionStart,
				selectionEnd,
				testDoc
			);

			expect( result.type ).toBe(
				SelectionType.SelectionInMultipleBlocks
			);
			expect( ( result as SelectionInMultipleBlocks ).blockStartId ).toBe(
				'block-3'
			);
			expect( ( result as SelectionInMultipleBlocks ).blockEndId ).toBe(
				'inner-block-1'
			);
		} );
	} );

	describe( 'relative position accuracy', () => {
		test( 'cursor position survives text insertion before it', () => {
			const selectionStart: WPBlockSelection = {
				clientId: 'block-1',
				attributeKey: 'content',
				offset: 5,
			};
			const selectionEnd: WPBlockSelection = {
				clientId: 'block-1',
				attributeKey: 'content',
				offset: 5,
			};

			const result = getSelectionState(
				selectionStart,
				selectionEnd,
				testDoc
			);

			expect( result.type ).toBe( SelectionType.Cursor );
			const cursorResult = result as SelectionCursor;

			// Insert text before the cursor position
			const documentMap = testDoc.getMap( CRDT_RECORD_MAP_KEY );
			const blocks = documentMap.get( 'blocks' ) as Y.Array<
				Y.Map< unknown >
			>;
			const block1 = blocks.get( 0 );
			const attrs = block1.get( 'attributes' ) as Y.Map< Y.Text >;
			const ytext = attrs.get( 'content' );

			if ( ! ytext ) {
				throw new Error( 'Y.Text not found' );
			}

			ytext.insert( 0, 'PREFIX ' ); // Insert at beginning

			// Convert relative position back to absolute
			const absolutePosition =
				Y.createAbsolutePositionFromRelativePosition(
					cursorResult.cursorPosition.relativePosition,
					testDoc
				);

			// The absolute index should have shifted by 7 (length of 'PREFIX ')
			expect( absolutePosition?.index ).toBe( 12 ); // 5 + 7
		} );
	} );

	describe( 'edge cases', () => {
		test( 'handles empty blocks array', () => {
			const emptyDoc = new Y.Doc();
			const documentMap = emptyDoc.getMap( CRDT_RECORD_MAP_KEY );
			documentMap.set( 'blocks', new Y.Array() );

			const selectionStart: WPBlockSelection = {
				clientId: 'block-1',
				attributeKey: 'content',
				offset: 5,
			};
			const selectionEnd: WPBlockSelection = {
				clientId: 'block-1',
				attributeKey: 'content',
				offset: 5,
			};

			const result = getSelectionState(
				selectionStart,
				selectionEnd,
				emptyDoc
			);

			expect( result.type ).toBe( SelectionType.None );

			emptyDoc.destroy();
		} );

		test( 'handles missing blocks in document', () => {
			const docWithoutBlocks = new Y.Doc();
			docWithoutBlocks.getMap( CRDT_RECORD_MAP_KEY );
			// Note: not setting 'blocks' at all

			const selectionStart: WPBlockSelection = {
				clientId: 'block-1',
				attributeKey: 'content',
				offset: 5,
			};
			const selectionEnd: WPBlockSelection = {
				clientId: 'block-1',
				attributeKey: 'content',
				offset: 5,
			};

			const result = getSelectionState(
				selectionStart,
				selectionEnd,
				docWithoutBlocks
			);

			expect( result.type ).toBe( SelectionType.None );

			docWithoutBlocks.destroy();
		} );
	} );
} );
