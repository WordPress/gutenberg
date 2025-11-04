/**
 * External dependencies
 */
import * as Y from 'yjs';

/**
 * Internal dependencies
 */
import { BlockSelectionHistory } from '../block-selection-history';
import type { RelativePosition, WPSelection } from '../types';
import { PositionType } from '../types';
import { CRDT_RECORD_MAP_KEY } from '../config';

/**
 * Helper function to create a simple Y.Doc with blocks for testing
 */
function createTestDoc() {
	const ydoc = new Y.Doc();
	const documentMap = ydoc.getMap( CRDT_RECORD_MAP_KEY );
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
	block2Attrs.set( 'content', new Y.Text( 'Second block' ) );
	block2.set( 'attributes', block2Attrs );
	block2.set( 'innerBlocks', new Y.Array() );
	blocks.push( [ block2 ] );

	// Create block 3 with a different attribute key
	const block3 = new Y.Map();
	block3.set( 'clientId', 'block-3' );
	const block3Attrs = new Y.Map();
	block3Attrs.set( 'value', new Y.Text( 'Third block with value attr' ) );
	block3.set( 'attributes', block3Attrs );
	block3.set( 'innerBlocks', new Y.Array() );
	blocks.push( [ block3 ] );

	return ydoc;
}

/**
 * Helper function to create a WPSelection
 * @param clientId
 * @param attributeKey
 * @param offset
 */
function createSelection(
	clientId: string,
	attributeKey?: string,
	offset?: number
): WPSelection {
	return {
		selectionStart: {
			clientId,
			attributeKey: attributeKey as string,
			offset: offset ?? 0,
		},
		selectionEnd: {
			clientId,
			attributeKey: attributeKey as string,
			offset: offset ?? 0,
		},
	};
}

describe( 'BlockSelectionHistory', () => {
	let history: BlockSelectionHistory;
	let ydoc: Y.Doc;

	beforeEach( () => {
		history = new BlockSelectionHistory( 5 );
		ydoc = createTestDoc();
		history.setYDoc( ydoc );

		// Suppress console.log calls during tests
		// jest.spyOn( console, 'log' ).mockImplementation( () => {} );
	} );

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	describe( 'initialization', () => {
		test( 'should initialize with empty history', () => {
			expect( history.getCurrentPosition() ).toBeNull();
			expect( history.getPreviousPositions( 5 ) ).toEqual( [] );
		} );
	} );

	describe( 'setYDoc', () => {
		test( 'should set the Y.Doc for relative position conversion', () => {
			const newHistory = new BlockSelectionHistory();
			const newDoc = createTestDoc();
			newHistory.setYDoc( newDoc );

			const selection = createSelection( 'block-1', 'content', 5 );
			newHistory.updateSelection( selection );

			expect( newHistory.getCurrentPosition() ).not.toBeNull();
			expect( newHistory.getCurrentPosition()?.type ).toBe(
				PositionType.RelativeSelection
			);
		} );
	} );

	describe( 'updateSelection with relative positions', () => {
		test( 'should convert and store a selection as a relative position', () => {
			const selection = createSelection( 'block-1', 'content', 5 );
			history.updateSelection( selection );

			const position = history.getCurrentPosition();
			expect( position ).not.toBeNull();
			expect( position?.type ).toBe( PositionType.RelativeSelection );

			const relativePosition = position as RelativePosition;
			expect( relativePosition.clientId ).toBe( 'block-1' );
			expect( relativePosition.attributeKey ).toBe( 'content' );
			expect( relativePosition.offset ).toBe( 5 );
			expect( relativePosition.relativePosition ).toBeDefined();
		} );

		test( 'should update position when selection changes within same block', () => {
			const selection1 = createSelection( 'block-1', 'content', 5 );
			history.updateSelection( selection1 );

			const selection2 = createSelection( 'block-1', 'content', 8 );
			history.updateSelection( selection2 );

			const position = history.getCurrentPosition();
			expect( position?.clientId ).toBe( 'block-1' );
			expect( position?.type ).toBe( PositionType.RelativeSelection );

			const relativePosition = position as RelativePosition;
			expect( relativePosition.offset ).toBe( 8 );

			// Should still only have one position in history (updated, not added)
			expect( history.getPreviousPositions( 5 ).length ).toBe( 0 );
		} );

		test( 'should add new position when moving to different block', () => {
			const selection1 = createSelection( 'block-1', 'content', 5 );
			history.updateSelection( selection1 );

			const selection2 = createSelection( 'block-2', 'content', 3 );
			history.updateSelection( selection2 );

			const currentPosition = history.getCurrentPosition();
			const lastPosition = history.getPreviousPositions( 1 )?.[ 0 ];

			expect( currentPosition?.clientId ).toBe( 'block-2' );
			expect( lastPosition?.clientId ).toBe( 'block-1' );
		} );

		test( 'should store offset 0 when offset is not provided', () => {
			const selection = createSelection( 'block-1', 'content' );
			history.updateSelection( selection );

			const position = history.getCurrentPosition();
			expect( position?.type ).toBe( PositionType.RelativeSelection );
			const relativePosition = position as RelativePosition;
			expect( relativePosition.offset ).toBe( 0 );
		} );
	} );

	describe( 'updateSelection with block positions', () => {
		test( 'should create block position (not relative) when clientId does not exist', () => {
			const selection = createSelection(
				'non-existent-block',
				'content',
				5
			);
			history.updateSelection( selection );

			const position = history.getCurrentPosition();
			expect( position?.type ).toBe( PositionType.BlockSelection );
			expect( position?.clientId ).toBe( 'non-existent-block' );
		} );

		test( 'should create block position (not relative) when attribute does not exist', () => {
			const selection = createSelection( 'block-1', 'nonexistent', 5 );
			history.updateSelection( selection );

			const position = history.getCurrentPosition();
			expect( position?.type ).toBe( PositionType.BlockSelection );
			expect( position?.clientId ).toBe( 'block-1' );
		} );
	} );

	describe( 'updateSelection edge cases', () => {
		test( 'should ignore null selection', () => {
			history.updateSelection( null as any );
			expect( history.getCurrentPosition() ).toBeNull();
		} );

		test( 'should ignore undefined selection', () => {
			history.updateSelection( undefined as any );
			expect( history.getCurrentPosition() ).toBeNull();
		} );

		test( 'should ignore selection without clientId', () => {
			const invalidSelection = {
				selectionStart: {
					clientId: '',
					attributeKey: 'content',
					offset: 0,
				},
				selectionEnd: {
					clientId: '',
					attributeKey: 'content',
					offset: 0,
				},
			};
			history.updateSelection( invalidSelection );
			expect( history.getCurrentPosition() ).toBeNull();
		} );

		test( 'should not convert position when Y.Doc is not set', () => {
			const historyWithoutDoc = new BlockSelectionHistory();
			const selection = createSelection( 'block-1', 'content', 5 );
			historyWithoutDoc.updateSelection( selection );

			expect( historyWithoutDoc.getCurrentPosition() ).toBeNull();
		} );
	} );

	describe( 'history management', () => {
		test( 'should maintain history of last N unique blocks', () => {
			const selections = [
				createSelection( 'block-1', 'content', 1 ),
				createSelection( 'block-2', 'content', 2 ),
				createSelection( 'block-3', 'value', 3 ),
			];

			selections.forEach( ( sel ) => history.updateSelection( sel ) );

			const currentPosition = history.getCurrentPosition();
			expect( currentPosition?.clientId ).toBe( 'block-3' );

			const lastPositions = history.getPreviousPositions( 5 );
			expect( lastPositions.length ).toBe( 2 );
			expect( lastPositions[ 0 ].clientId ).toBe( 'block-2' );
			expect( lastPositions[ 1 ].clientId ).toBe( 'block-1' );
		} );

		test( 'should respect history size limit', () => {
			const smallHistory = new BlockSelectionHistory( 3 );
			smallHistory.setYDoc( ydoc );

			// Add more selections than history size
			for ( let i = 1; i <= 5; i++ ) {
				const selection = createSelection(
					`block-${ i }`,
					'content',
					i
				);
				smallHistory.updateSelection( selection );
			}

			// Should only keep last 3
			const currentPosition = smallHistory.getCurrentPosition();
			const lastPositions = smallHistory.getPreviousPositions( 10 );

			expect( currentPosition?.clientId ).toBe( 'block-5' );
			expect( lastPositions.length ).toBe( 2 ); // Size is 3, so 2 in backup
			expect( lastPositions[ 0 ].clientId ).toBe( 'block-4' );
			expect( lastPositions[ 1 ].clientId ).toBe( 'block-3' );
		} );

		test( 'should remove duplicate block from history when revisited', () => {
			history.updateSelection(
				createSelection( 'block-1', 'content', 1 )
			);
			history.updateSelection(
				createSelection( 'block-2', 'content', 2 )
			);
			history.updateSelection( createSelection( 'block-3', 'value', 3 ) );

			// Go back to block-1
			history.updateSelection(
				createSelection( 'block-1', 'content', 5 )
			);

			const currentPosition = history.getCurrentPosition();
			const lastPositions = history.getPreviousPositions( 5 );

			// block-1 should be current (most recent)
			expect( currentPosition?.clientId ).toBe( 'block-1' );
			expect( currentPosition?.type ).toBe(
				PositionType.RelativeSelection
			);

			const relativePosition = currentPosition as RelativePosition;
			expect( relativePosition.offset ).toBe( 5 ); // Updated offset

			// block-1 should not appear in backup positions
			expect( lastPositions.length ).toBe( 2 );
			expect( lastPositions[ 0 ].clientId ).toBe( 'block-3' );
			expect( lastPositions[ 1 ].clientId ).toBe( 'block-2' );
		} );
	} );

	describe( 'getPreviousPositions', () => {
		test( 'should return requested number of positions', () => {
			const selections = [
				createSelection( 'block-1', 'content', 1 ),
				createSelection( 'block-2', 'content', 2 ),
				createSelection( 'block-3', 'value', 3 ),
			];

			selections.forEach( ( sel ) => history.updateSelection( sel ) );

			expect( history.getPreviousPositions( 1 ).length ).toBe( 1 );
			expect( history.getPreviousPositions( 2 ).length ).toBe( 2 );
			expect( history.getPreviousPositions( 10 ).length ).toBe( 2 ); // Only 2 backup positions available
		} );

		test( 'should return empty array when no backup positions exist', () => {
			history.updateSelection(
				createSelection( 'block-1', 'content', 1 )
			);
			expect( history.getPreviousPositions( 5 ) ).toEqual( [] );
		} );
	} );

	describe( 'getCurrentPosition', () => {
		test( 'should return most recent position', () => {
			history.updateSelection(
				createSelection( 'block-1', 'content', 1 )
			);
			history.updateSelection(
				createSelection( 'block-2', 'content', 2 )
			);

			const current = history.getCurrentPosition();
			expect( current?.clientId ).toBe( 'block-2' );
		} );

		test( 'should return null when history is empty', () => {
			expect( history.getCurrentPosition() ).toBeNull();
		} );
	} );

	describe( 'relative position accuracy', () => {
		test( 'should create relative position that survives text insertion before it', () => {
			const selection = createSelection( 'block-1', 'content', 5 );
			history.updateSelection( selection );

			const position = history.getCurrentPosition();
			expect( position?.type ).toBe( PositionType.RelativeSelection );
			const relativePosition = position as RelativePosition;
			// Get the Y.Text and insert text before the position
			const documentMap = ydoc.getMap( CRDT_RECORD_MAP_KEY );
			const blocks = documentMap.get( 'blocks' ) as Y.Array< any >;
			const block1 = blocks.get( 0 ) as Y.Map< any >;
			const attrs = block1.get( 'attributes' ) as Y.Map< Y.Text >;
			const ytext = attrs.get( 'content' );
			if ( ! ytext ) {
				throw new Error( 'Y.Text not found' );
			}
			ytext.insert( 0, 'PREFIX ' ); // Insert at beginning

			// Convert relative position back to absolute
			const absolutePosition =
				Y.createAbsolutePositionFromRelativePosition(
					relativePosition.relativePosition,
					ydoc
				);

			// The absolute index should have shifted by 7 (length of 'PREFIX ')
			expect( absolutePosition?.index ).toBe( 12 ); // 5 + 7
		} );

		test( 'should create relative position that survives text deletion before it', () => {
			const selection = createSelection( 'block-1', 'content', 8 );
			history.updateSelection( selection );

			const position = history.getCurrentPosition();
			expect( position?.type ).toBe( PositionType.RelativeSelection );
			const relativePosition = position as RelativePosition;
			// Delete text before the position
			const documentMap = ydoc.getMap( CRDT_RECORD_MAP_KEY );
			const blocks = documentMap.get( 'blocks' ) as Y.Array< any >;
			const block1 = blocks.get( 0 ) as Y.Map< any >;
			const attrs = block1.get( 'attributes' ) as Y.Map< Y.Text >;
			const ytext = attrs.get( 'content' );
			if ( ! ytext ) {
				throw new Error( 'Y.Text not found' );
			}
			ytext.delete( 0, 5 ); // Delete "Hello"

			// Convert relative position back to absolute
			const absolutePosition =
				Y.createAbsolutePositionFromRelativePosition(
					relativePosition.relativePosition,
					ydoc
				);

			// The absolute index should have shifted back by 5
			expect( absolutePosition?.index ).toBe( 3 ); // 8 - 5
		} );
	} );

	describe( 'integration scenarios', () => {
		test( 'should handle rapid selection changes in same block', () => {
			for ( let i = 0; i < 10; i++ ) {
				history.updateSelection(
					createSelection( 'block-1', 'content', i )
				);
			}

			const current = history.getCurrentPosition();
			expect( current?.clientId ).toBe( 'block-1' );
			expect( current?.type ).toBe( PositionType.RelativeSelection );
			const relativePosition = current as RelativePosition;

			expect( relativePosition.offset ).toBe( 9 );

			// Should still be only one position in history
			expect( history.getPreviousPositions( 5 ).length ).toBe( 0 );
		} );

		test( 'should handle alternating between two blocks', () => {
			history.updateSelection(
				createSelection( 'block-1', 'content', 1 )
			);
			history.updateSelection(
				createSelection( 'block-2', 'content', 2 )
			);
			history.updateSelection(
				createSelection( 'block-1', 'content', 3 )
			);
			history.updateSelection(
				createSelection( 'block-2', 'content', 4 )
			);

			const current = history.getCurrentPosition();
			const last = history.getPreviousPositions( 1 )?.[ 0 ];

			expect( current?.clientId ).toBe( 'block-2' );
			expect( last?.clientId ).toBe( 'block-1' );

			// Should only have these 2 blocks in history
			expect( history.getPreviousPositions( 5 ).length ).toBe( 1 );
		} );

		test( 'should handle mixed block and relative selections', () => {
			history.updateSelection(
				createSelection( 'block-1', 'content', 5 )
			);
			history.updateSelection(
				createSelection( 'non-existent', 'content', 0 )
			);
			history.updateSelection(
				createSelection( 'block-2', 'content', 3 )
			);

			const positions = [
				history.getCurrentPosition(),
				...history.getPreviousPositions( 2 ),
			];

			expect( positions[ 0 ]?.type ).toBe(
				PositionType.RelativeSelection
			);
			expect( positions[ 1 ]?.type ).toBe( PositionType.BlockSelection );
			expect( positions[ 2 ]?.type ).toBe(
				PositionType.RelativeSelection
			);
		} );
	} );
} );
