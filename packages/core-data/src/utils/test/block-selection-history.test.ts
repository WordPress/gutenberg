/**
 * External dependencies
 */
import * as Y from 'yjs';

/**
 * Internal dependencies
 */
import {
	BlockSelectionHistory,
	YSelectionType,
	type YRelativeSelection,
} from '../block-selection-history';
import { CRDT_RECORD_MAP_KEY } from '../../sync';
import type { WPSelection } from '../../types';

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

function createSelection(
	start: { clientId: string; attributeKey?: string; offset?: number },
	end?: { clientId: string; attributeKey?: string; offset?: number }
): WPSelection {
	const selectionStart = {
		clientId: start.clientId,
		attributeKey: start.attributeKey as string,
		offset: start.offset ?? 0,
	};

	const selectionEnd = end
		? {
				clientId: end.clientId,
				attributeKey: end.attributeKey as string,
				offset: end.offset ?? 0,
		  }
		: selectionStart;

	return {
		selectionStart,
		selectionEnd,
	};
}

describe( 'BlockSelectionHistory', () => {
	let history: BlockSelectionHistory;
	let ydoc: Y.Doc;

	beforeEach( () => {
		ydoc = createTestDoc();
		history = new BlockSelectionHistory( ydoc, 5 );
	} );

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	describe( 'initialization', () => {
		test( 'should initialize with empty history', () => {
			expect( history.getCurrentSelection() ).toBeNull();
			expect( history.getSelectionHistory( 5 ) ).toEqual( [] );
		} );
	} );

	describe( 'updateSelection with relative positions', () => {
		test( 'should convert and store a selection as a relative position', () => {
			const selection = createSelection( {
				clientId: 'block-1',
				attributeKey: 'content',
				offset: 5,
			} );
			history.updateSelection( selection );

			const fullSelection = history.getCurrentSelection();
			expect( fullSelection ).not.toBeNull();
			expect( fullSelection?.start.type ).toBe(
				YSelectionType.RelativeSelection
			);
			expect( fullSelection?.end.type ).toBe(
				YSelectionType.RelativeSelection
			);

			const startPosition = fullSelection?.start as YRelativeSelection;
			const endPosition = fullSelection?.end as YRelativeSelection;

			expect( startPosition.clientId ).toBe( 'block-1' );
			expect( startPosition.attributeKey ).toBe( 'content' );
			expect( startPosition.offset ).toBe( 5 );
			expect( startPosition.relativePosition ).toBeDefined();

			expect( endPosition.clientId ).toBe( 'block-1' );
			expect( endPosition.attributeKey ).toBe( 'content' );
			expect( endPosition.offset ).toBe( 5 );
			expect( endPosition.relativePosition ).toBeDefined();
		} );

		test( 'should update position when selection changes within same block', () => {
			const selection1 = createSelection( {
				clientId: 'block-1',
				attributeKey: 'content',
				offset: 5,
			} );
			history.updateSelection( selection1 );

			const selection2 = createSelection( {
				clientId: 'block-1',
				attributeKey: 'content',
				offset: 8,
			} );
			history.updateSelection( selection2 );

			const fullSelection = history.getCurrentSelection();
			expect( fullSelection?.start.clientId ).toBe( 'block-1' );
			expect( fullSelection?.start.type ).toBe(
				YSelectionType.RelativeSelection
			);

			const startPosition = fullSelection?.start as YRelativeSelection;
			expect( startPosition.offset ).toBe( 8 );

			// Should have no positions in block history (still in same block)
			expect( history.getSelectionHistory( 5 ).length ).toBe( 0 );
		} );

		test( 'should add new position when moving to different block', () => {
			const selection1 = createSelection( {
				clientId: 'block-1',
				attributeKey: 'content',
				offset: 5,
			} );
			history.updateSelection( selection1 );

			const selection2 = createSelection( {
				clientId: 'block-2',
				attributeKey: 'content',
				offset: 3,
			} );
			history.updateSelection( selection2 );

			const currentSelection = history.getCurrentSelection();
			const blockHistory = history.getSelectionHistory( 1 );

			expect( currentSelection?.start.clientId ).toBe( 'block-2' );
			expect( currentSelection?.end.clientId ).toBe( 'block-2' );
			expect( blockHistory[ 0 ]?.start.clientId ).toBe( 'block-1' );
			expect( blockHistory[ 0 ]?.end.clientId ).toBe( 'block-1' );
		} );

		test( 'should store offset 0 when offset is not provided', () => {
			const selection = createSelection( {
				clientId: 'block-1',
				attributeKey: 'content',
			} );
			history.updateSelection( selection );

			const fullSelection = history.getCurrentSelection();
			expect( fullSelection?.start.type ).toBe(
				YSelectionType.RelativeSelection
			);
			const startPosition = fullSelection?.start as YRelativeSelection;
			expect( startPosition.offset ).toBe( 0 );

			expect( fullSelection?.end.type ).toBe(
				YSelectionType.RelativeSelection
			);
			const endPosition = fullSelection?.end as YRelativeSelection;
			expect( endPosition.offset ).toBe( 0 );
		} );
	} );

	describe( 'updateSelection with block positions', () => {
		test( 'should create block position (not relative) when clientId does not exist', () => {
			const selection = createSelection( {
				clientId: 'non-existent-block',
				attributeKey: 'content',
				offset: 5,
			} );
			history.updateSelection( selection );

			const fullSelection = history.getCurrentSelection();
			expect( fullSelection?.start.type ).toBe(
				YSelectionType.BlockSelection
			);
			expect( fullSelection?.start.clientId ).toBe(
				'non-existent-block'
			);
			expect( fullSelection?.end.type ).toBe(
				YSelectionType.BlockSelection
			);
			expect( fullSelection?.end.clientId ).toBe( 'non-existent-block' );
		} );

		test( 'should create block position (not relative) when attribute does not exist', () => {
			const selection = createSelection( {
				clientId: 'block-1',
				attributeKey: 'nonexistent',
				offset: 5,
			} );
			history.updateSelection( selection );

			const fullSelection = history.getCurrentSelection();
			expect( fullSelection?.start.type ).toBe(
				YSelectionType.BlockSelection
			);
			expect( fullSelection?.start.clientId ).toBe( 'block-1' );
			expect( fullSelection?.end.type ).toBe(
				YSelectionType.BlockSelection
			);
			expect( fullSelection?.end.clientId ).toBe( 'block-1' );
		} );
	} );

	describe( 'updateSelection edge cases', () => {
		test( 'should ignore null selection', () => {
			history.updateSelection( null as any );
			expect( history.getCurrentSelection() ).toBeNull();
		} );

		test( 'should ignore undefined selection', () => {
			history.updateSelection( undefined as any );
			expect( history.getCurrentSelection() ).toBeNull();
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
			expect( history.getCurrentSelection() ).toBeNull();
		} );
	} );

	describe( 'history management', () => {
		test( 'should maintain history of last N unique blocks', () => {
			const selections = [
				createSelection( {
					clientId: 'block-1',
					attributeKey: 'content',
					offset: 1,
				} ),
				createSelection( {
					clientId: 'block-2',
					attributeKey: 'content',
					offset: 2,
				} ),
				createSelection( {
					clientId: 'block-3',
					attributeKey: 'value',
					offset: 3,
				} ),
			];

			selections.forEach( ( sel ) => history.updateSelection( sel ) );

			const currentSelection = history.getCurrentSelection();
			expect( currentSelection?.start.clientId ).toBe( 'block-3' );
			expect( currentSelection?.end.clientId ).toBe( 'block-3' );

			const blockHistory = history.getSelectionHistory( 5 );
			expect( blockHistory.length ).toBe( 2 );
			expect( blockHistory[ 0 ].start.clientId ).toBe( 'block-2' );
			expect( blockHistory[ 0 ].end.clientId ).toBe( 'block-2' );
			expect( blockHistory[ 1 ].start.clientId ).toBe( 'block-1' );
			expect( blockHistory[ 1 ].end.clientId ).toBe( 'block-1' );
		} );

		test( 'should respect history size limit', () => {
			const smallHistory = new BlockSelectionHistory( ydoc, 3 );

			// Add more selections than history size
			for ( let i = 1; i <= 5; i++ ) {
				const selection = createSelection( {
					clientId: `block-${ i }`,
					attributeKey: 'content',
					offset: i,
				} );
				smallHistory.updateSelection( selection );
			}

			// Should only keep last 3 in block history
			const currentSelection = smallHistory.getCurrentSelection();
			const blockHistory = smallHistory.getSelectionHistory( 10 );

			expect( currentSelection?.start.clientId ).toBe( 'block-5' );
			expect( currentSelection?.end.clientId ).toBe( 'block-5' );
			expect( blockHistory.length ).toBe( 3 );
			expect( blockHistory[ 0 ].start.clientId ).toBe( 'block-4' );
			expect( blockHistory[ 1 ].start.clientId ).toBe( 'block-3' );
			expect( blockHistory[ 2 ].start.clientId ).toBe( 'block-2' );
		} );

		test( 'should remove duplicate block from history when revisited', () => {
			history.updateSelection(
				createSelection( {
					clientId: 'block-1',
					attributeKey: 'content',
					offset: 1,
				} )
			);
			history.updateSelection(
				createSelection( {
					clientId: 'block-2',
					attributeKey: 'content',
					offset: 2,
				} )
			);
			history.updateSelection(
				createSelection( {
					clientId: 'block-3',
					attributeKey: 'value',
					offset: 3,
				} )
			);

			// Go back to block-1
			history.updateSelection(
				createSelection( {
					clientId: 'block-1',
					attributeKey: 'content',
					offset: 5,
				} )
			);

			const currentSelection = history.getCurrentSelection();
			const blockHistory = history.getSelectionHistory( 5 );

			// block-1 should be current (most recent)
			expect( currentSelection?.start.clientId ).toBe( 'block-1' );
			expect( currentSelection?.start.type ).toBe(
				YSelectionType.RelativeSelection
			);

			const startPosition = currentSelection?.start as YRelativeSelection;
			expect( startPosition.offset ).toBe( 5 ); // Updated offset

			// block-1 should not appear in block history
			expect( blockHistory.length ).toBe( 2 );
			expect( blockHistory[ 0 ].start.clientId ).toBe( 'block-3' );
			expect( blockHistory[ 1 ].start.clientId ).toBe( 'block-2' );
		} );
	} );

	describe( 'getSelectionHistory', () => {
		test( 'should return requested number of positions', () => {
			const selections = [
				createSelection( {
					clientId: 'block-1',
					attributeKey: 'content',
					offset: 1,
				} ),
				createSelection( {
					clientId: 'block-2',
					attributeKey: 'content',
					offset: 2,
				} ),
				createSelection( {
					clientId: 'block-3',
					attributeKey: 'value',
					offset: 3,
				} ),
			];

			selections.forEach( ( sel ) => history.updateSelection( sel ) );

			expect( history.getSelectionHistory( 1 ).length ).toBe( 1 );
			expect( history.getSelectionHistory( 2 ).length ).toBe( 2 );
			expect( history.getSelectionHistory( 10 ).length ).toBe( 2 ); // Only 2 backup positions available
		} );

		test( 'should return empty array when no backup positions exist', () => {
			history.updateSelection(
				createSelection( {
					clientId: 'block-1',
					attributeKey: 'content',
					offset: 1,
				} )
			);
			expect( history.getSelectionHistory( 5 ) ).toEqual( [] );
		} );
	} );

	describe( 'getCurrentSelection', () => {
		test( 'should return most recent position', () => {
			history.updateSelection(
				createSelection( {
					clientId: 'block-1',
					attributeKey: 'content',
					offset: 1,
				} )
			);
			history.updateSelection(
				createSelection( {
					clientId: 'block-2',
					attributeKey: 'content',
					offset: 2,
				} )
			);

			const current = history.getCurrentSelection();
			expect( current?.start.clientId ).toBe( 'block-2' );
			expect( current?.end.clientId ).toBe( 'block-2' );
		} );

		test( 'should return null when history is empty', () => {
			expect( history.getCurrentSelection() ).toBeNull();
		} );
	} );

	describe( 'relative position accuracy', () => {
		test( 'should create relative position that survives text insertion before it', () => {
			const selection = createSelection( {
				clientId: 'block-1',
				attributeKey: 'content',
				offset: 5,
			} );
			history.updateSelection( selection );

			const fullSelection = history.getCurrentSelection();
			expect( fullSelection?.start.type ).toBe(
				YSelectionType.RelativeSelection
			);
			const startPosition = fullSelection?.start as YRelativeSelection;
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
					startPosition.relativePosition,
					ydoc
				);

			// The absolute index should have shifted by 7 (length of 'PREFIX ')
			expect( absolutePosition?.index ).toBe( 12 ); // 5 + 7
		} );

		test( 'should create relative position that survives text deletion before it', () => {
			const selection = createSelection( {
				clientId: 'block-1',
				attributeKey: 'content',
				offset: 8,
			} );
			history.updateSelection( selection );

			const fullSelection = history.getCurrentSelection();
			expect( fullSelection?.start.type ).toBe(
				YSelectionType.RelativeSelection
			);
			const startPosition = fullSelection?.start as YRelativeSelection;
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
					startPosition.relativePosition,
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
					createSelection( {
						clientId: 'block-1',
						attributeKey: 'content',
						offset: i,
					} )
				);
			}

			const current = history.getCurrentSelection();
			expect( current?.start.clientId ).toBe( 'block-1' );
			expect( current?.start.type ).toBe(
				YSelectionType.RelativeSelection
			);
			const startPosition = current?.start as YRelativeSelection;

			expect( startPosition.offset ).toBe( 9 );

			// Should still be no positions in block history
			expect( history.getSelectionHistory( 5 ).length ).toBe( 0 );
		} );

		test( 'should handle alternating between two blocks', () => {
			history.updateSelection(
				createSelection( {
					clientId: 'block-1',
					attributeKey: 'content',
					offset: 1,
				} )
			);
			history.updateSelection(
				createSelection( {
					clientId: 'block-2',
					attributeKey: 'content',
					offset: 2,
				} )
			);
			history.updateSelection(
				createSelection( {
					clientId: 'block-1',
					attributeKey: 'content',
					offset: 3,
				} )
			);
			history.updateSelection(
				createSelection( {
					clientId: 'block-2',
					attributeKey: 'content',
					offset: 4,
				} )
			);

			const current = history.getCurrentSelection();
			const blockHistory = history.getSelectionHistory( 5 );

			expect( current?.start.clientId ).toBe( 'block-2' );
			expect( current?.end.clientId ).toBe( 'block-2' );
			expect( blockHistory[ 0 ]?.start.clientId ).toBe( 'block-1' );

			// Should only have 1 block in history (current block-2 is not in history)
			expect( blockHistory.length ).toBe( 1 );
		} );

		test( 'should handle mixed block and relative selections', () => {
			history.updateSelection(
				createSelection( {
					clientId: 'block-1',
					attributeKey: 'content',
					offset: 5,
				} )
			);
			history.updateSelection(
				createSelection( {
					clientId: 'non-existent',
					attributeKey: 'content',
					offset: 0,
				} )
			);
			history.updateSelection(
				createSelection( {
					clientId: 'block-2',
					attributeKey: 'content',
					offset: 3,
				} )
			);

			const current = history.getCurrentSelection();
			const backupSelections = history.getSelectionHistory( 2 );

			expect( current?.start.type ).toBe(
				YSelectionType.RelativeSelection
			);
			expect( backupSelections[ 0 ]?.start.type ).toBe(
				YSelectionType.BlockSelection
			);
			expect( backupSelections[ 1 ]?.start.type ).toBe(
				YSelectionType.RelativeSelection
			);
		} );
	} );

	describe( 'cross-block selections', () => {
		test( 'should update currentSelection when both start and end are within same block', () => {
			const selection1 = createSelection(
				{ clientId: 'block-1', attributeKey: 'content', offset: 2 },
				{ clientId: 'block-1', attributeKey: 'content', offset: 8 }
			);
			history.updateSelection( selection1 );

			const selection2 = createSelection(
				{ clientId: 'block-1', attributeKey: 'content', offset: 2 },
				{ clientId: 'block-1', attributeKey: 'content', offset: 10 }
			);
			history.updateSelection( selection2 );

			const current = history.getCurrentSelection();

			// Both selections are in same block, so should update current without adding to history
			expect( current?.start.clientId ).toBe( 'block-1' );
			expect( current?.end.clientId ).toBe( 'block-1' );
			expect( ( current?.start as YRelativeSelection ).offset ).toBe( 2 );
			expect( ( current?.end as YRelativeSelection ).offset ).toBe( 10 );
			expect( history.getSelectionHistory( 5 ).length ).toBe( 0 );
		} );

		test( 'should track cross-block selection spanning two blocks', () => {
			const selection = createSelection(
				{ clientId: 'block-1', attributeKey: 'content', offset: 5 },
				{ clientId: 'block-2', attributeKey: 'content', offset: 3 }
			);
			history.updateSelection( selection );

			const current = history.getCurrentSelection();

			expect( current?.start.clientId ).toBe( 'block-1' );
			expect( current?.start.type ).toBe(
				YSelectionType.RelativeSelection
			);
			expect( ( current?.start as YRelativeSelection ).offset ).toBe( 5 );

			expect( current?.end.clientId ).toBe( 'block-2' );
			expect( current?.end.type ).toBe(
				YSelectionType.RelativeSelection
			);
			expect( ( current?.end as YRelativeSelection ).offset ).toBe( 3 );
		} );

		test( 'should differentiate between same-block and cross-block selections', () => {
			// Single block selection
			history.updateSelection(
				createSelection( {
					clientId: 'block-1',
					attributeKey: 'content',
					offset: 5,
				} )
			);

			// Cross-block selection from block-1 to block-2
			history.updateSelection(
				createSelection(
					{ clientId: 'block-1', attributeKey: 'content', offset: 3 },
					{ clientId: 'block-2', attributeKey: 'content', offset: 2 }
				)
			);

			const current = history.getCurrentSelection();
			const blockHistory = history.getSelectionHistory( 5 );

			// Should have moved to different block combination
			expect( current?.start.clientId ).toBe( 'block-1' );
			expect( current?.end.clientId ).toBe( 'block-2' );
			expect( blockHistory.length ).toBe( 1 );
			expect( blockHistory[ 0 ].start.clientId ).toBe( 'block-1' );
			expect( blockHistory[ 0 ].end.clientId ).toBe( 'block-1' );
		} );

		test( 'should add to history when transitioning between different cross-block selections', () => {
			// Cross-block from block-1 to block-2
			history.updateSelection(
				createSelection(
					{ clientId: 'block-1', attributeKey: 'content', offset: 5 },
					{ clientId: 'block-2', attributeKey: 'content', offset: 3 }
				)
			);

			// Cross-block from block-2 to block-3
			history.updateSelection(
				createSelection(
					{ clientId: 'block-2', attributeKey: 'content', offset: 1 },
					{ clientId: 'block-3', attributeKey: 'value', offset: 2 }
				)
			);

			const current = history.getCurrentSelection();
			const blockHistory = history.getSelectionHistory( 5 );

			expect( current?.start.clientId ).toBe( 'block-2' );
			expect( current?.end.clientId ).toBe( 'block-3' );
			expect( blockHistory.length ).toBe( 1 );
			expect( blockHistory[ 0 ].start.clientId ).toBe( 'block-1' );
			expect( blockHistory[ 0 ].end.clientId ).toBe( 'block-2' );
		} );

		test( 'should not add to history when updating same cross-block selection combination', () => {
			// Cross-block from block-1 to block-2
			history.updateSelection(
				createSelection(
					{ clientId: 'block-1', attributeKey: 'content', offset: 5 },
					{ clientId: 'block-2', attributeKey: 'content', offset: 3 }
				)
			);

			// Same block combination, different offsets
			history.updateSelection(
				createSelection(
					{ clientId: 'block-1', attributeKey: 'content', offset: 2 },
					{ clientId: 'block-2', attributeKey: 'content', offset: 8 }
				)
			);

			const current = history.getCurrentSelection();
			const blockHistory = history.getSelectionHistory( 5 );

			expect( current?.start.clientId ).toBe( 'block-1' );
			expect( current?.end.clientId ).toBe( 'block-2' );
			expect( ( current?.start as YRelativeSelection ).offset ).toBe( 2 );
			expect( ( current?.end as YRelativeSelection ).offset ).toBe( 8 );
			// Should not add to history - same block combination
			expect( blockHistory.length ).toBe( 0 );
		} );
	} );
} );
