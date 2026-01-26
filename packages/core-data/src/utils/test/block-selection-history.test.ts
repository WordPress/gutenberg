/**
 * External dependencies
 */
import * as Y from 'yjs';

/**
 * Internal dependencies
 */
import {
	createBlockSelectionHistory,
	YSelectionType,
	type YRelativeSelection,
	type BlockSelectionHistory,
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
		history = createBlockSelectionHistory( ydoc, 5 );
	} );

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	describe( 'initialization', () => {
		test( 'should initialize with empty history', () => {
			expect( history.getSelectionHistory() ).toEqual( [] );
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

			const selectionHistory = history.getSelectionHistory();
			expect( selectionHistory.length ).toBe( 1 );

			const fullSelection = selectionHistory[ 0 ];
			expect( fullSelection.start.type ).toBe(
				YSelectionType.RelativeSelection
			);
			expect( fullSelection.end.type ).toBe(
				YSelectionType.RelativeSelection
			);

			const startPosition = fullSelection.start as YRelativeSelection;
			const endPosition = fullSelection.end as YRelativeSelection;

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

			const selectionHistory = history.getSelectionHistory();

			// Should have only one selection in block history (still in same block)
			expect( selectionHistory.length ).toBe( 1 );

			const fullSelection = selectionHistory[ 0 ];
			expect( fullSelection.start.clientId ).toBe( 'block-1' );
			expect( fullSelection.start.type ).toBe(
				YSelectionType.RelativeSelection
			);

			const startPosition = fullSelection.start as YRelativeSelection;
			expect( startPosition.offset ).toBe( 8 );
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

			const selectionHistory = history.getSelectionHistory();
			expect( selectionHistory.length ).toBe( 2 );

			// Current selection at index 0
			expect( selectionHistory[ 0 ].start.clientId ).toBe( 'block-2' );
			expect( selectionHistory[ 0 ].end.clientId ).toBe( 'block-2' );
			// Previous selection at index 1
			expect( selectionHistory[ 1 ].start.clientId ).toBe( 'block-1' );
			expect( selectionHistory[ 1 ].end.clientId ).toBe( 'block-1' );
		} );

		test( 'should store offset 0 when offset is not provided', () => {
			const selection = createSelection( {
				clientId: 'block-1',
				attributeKey: 'content',
			} );
			history.updateSelection( selection );

			const selectionHistory = history.getSelectionHistory();
			expect( selectionHistory.length ).toBe( 1 );

			const fullSelection = selectionHistory[ 0 ];
			expect( fullSelection.start.type ).toBe(
				YSelectionType.RelativeSelection
			);
			const startPosition = fullSelection.start as YRelativeSelection;
			expect( startPosition.offset ).toBe( 0 );

			expect( fullSelection.end.type ).toBe(
				YSelectionType.RelativeSelection
			);
			const endPosition = fullSelection.end as YRelativeSelection;
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

			const selectionHistory = history.getSelectionHistory();
			expect( selectionHistory.length ).toBe( 1 );

			const fullSelection = selectionHistory[ 0 ];
			expect( fullSelection.start.type ).toBe(
				YSelectionType.BlockSelection
			);
			expect( fullSelection.start.clientId ).toBe( 'non-existent-block' );
			expect( fullSelection.end.type ).toBe(
				YSelectionType.BlockSelection
			);
			expect( fullSelection.end.clientId ).toBe( 'non-existent-block' );
		} );

		test( 'should create block position (not relative) when attribute does not exist', () => {
			const selection = createSelection( {
				clientId: 'block-1',
				attributeKey: 'nonexistent',
				offset: 5,
			} );
			history.updateSelection( selection );

			const selectionHistory = history.getSelectionHistory();
			expect( selectionHistory.length ).toBe( 1 );

			const fullSelection = selectionHistory[ 0 ];
			expect( fullSelection.start.type ).toBe(
				YSelectionType.BlockSelection
			);
			expect( fullSelection.start.clientId ).toBe( 'block-1' );
			expect( fullSelection.end.type ).toBe(
				YSelectionType.BlockSelection
			);
			expect( fullSelection.end.clientId ).toBe( 'block-1' );
		} );
	} );

	describe( 'updateSelection edge cases', () => {
		test( 'should ignore null selection', () => {
			history.updateSelection( null as any );
			expect( history.getSelectionHistory() ).toEqual( [] );
		} );

		test( 'should ignore undefined selection', () => {
			history.updateSelection( undefined as any );
			expect( history.getSelectionHistory() ).toEqual( [] );
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
			expect( history.getSelectionHistory() ).toEqual( [] );
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

			const selectionHistory = history.getSelectionHistory();
			expect( selectionHistory.length ).toBe( 3 );

			// Current selection at index 0
			expect( selectionHistory[ 0 ].start.clientId ).toBe( 'block-3' );
			expect( selectionHistory[ 0 ].end.clientId ).toBe( 'block-3' );
			// Previous selections
			expect( selectionHistory[ 1 ].start.clientId ).toBe( 'block-2' );
			expect( selectionHistory[ 1 ].end.clientId ).toBe( 'block-2' );
			expect( selectionHistory[ 2 ].start.clientId ).toBe( 'block-1' );
			expect( selectionHistory[ 2 ].end.clientId ).toBe( 'block-1' );
		} );

		test( 'should respect history size limit', () => {
			const smallHistory = createBlockSelectionHistory( ydoc, 3 );

			// Add more selections than history size
			for ( let i = 1; i <= 5; i++ ) {
				const selection = createSelection( {
					clientId: `block-${ i }`,
					attributeKey: 'content',
					offset: i,
				} );
				smallHistory.updateSelection( selection );
			}

			// Should only keep last 4 total (3 history + 1 current)
			const selectionHistory = smallHistory.getSelectionHistory();
			expect( selectionHistory.length ).toBe( 4 );

			// Current selection at index 0
			expect( selectionHistory[ 0 ].start.clientId ).toBe( 'block-5' );
			expect( selectionHistory[ 0 ].end.clientId ).toBe( 'block-5' );
			// Previous 3 selections
			expect( selectionHistory[ 1 ].start.clientId ).toBe( 'block-4' );
			expect( selectionHistory[ 2 ].start.clientId ).toBe( 'block-3' );
			expect( selectionHistory[ 3 ].start.clientId ).toBe( 'block-2' );
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

			const selectionHistory = history.getSelectionHistory();

			// block-1 should be current (most recent) at index 0
			expect( selectionHistory[ 0 ].start.clientId ).toBe( 'block-1' );
			expect( selectionHistory[ 0 ].start.type ).toBe(
				YSelectionType.RelativeSelection
			);

			const startPosition = selectionHistory[ 0 ]
				.start as YRelativeSelection;
			expect( startPosition.offset ).toBe( 5 ); // Updated offset

			// block-1 should not appear again in history
			expect( selectionHistory.length ).toBe( 3 );
			expect( selectionHistory[ 1 ].start.clientId ).toBe( 'block-3' );
			expect( selectionHistory[ 2 ].start.clientId ).toBe( 'block-2' );
		} );
	} );

	describe( 'getSelectionHistory', () => {
		test( 'should return current selection when only one selection exists', () => {
			history.updateSelection(
				createSelection( {
					clientId: 'block-1',
					attributeKey: 'content',
					offset: 1,
				} )
			);
			const selectionHistory = history.getSelectionHistory();
			expect( selectionHistory.length ).toBe( 1 );
			expect( selectionHistory[ 0 ].start.clientId ).toBe( 'block-1' );
		} );

		test( 'should return most recent position at index 0', () => {
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

			const selectionHistory = history.getSelectionHistory();
			expect( selectionHistory.length ).toBe( 2 );
			expect( selectionHistory[ 0 ].start.clientId ).toBe( 'block-2' );
			expect( selectionHistory[ 0 ].end.clientId ).toBe( 'block-2' );
		} );

		test( 'should return empty array when history is empty', () => {
			expect( history.getSelectionHistory() ).toEqual( [] );
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

			const selectionHistory = history.getSelectionHistory();
			expect( selectionHistory.length ).toBe( 1 );

			const fullSelection = selectionHistory[ 0 ];
			expect( fullSelection.start.type ).toBe(
				YSelectionType.RelativeSelection
			);
			const startPosition = fullSelection.start as YRelativeSelection;
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

			const selectionHistory = history.getSelectionHistory();
			expect( selectionHistory.length ).toBe( 1 );

			const fullSelection = selectionHistory[ 0 ];
			expect( fullSelection.start.type ).toBe(
				YSelectionType.RelativeSelection
			);
			const startPosition = fullSelection.start as YRelativeSelection;
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

			const selectionHistory = history.getSelectionHistory();

			// Should have only one selection in block history (still in same block)
			expect( selectionHistory.length ).toBe( 1 );

			const current = selectionHistory[ 0 ];
			expect( current.start.clientId ).toBe( 'block-1' );
			expect( current.start.type ).toBe(
				YSelectionType.RelativeSelection
			);
			const startPosition = current.start as YRelativeSelection;

			expect( startPosition.offset ).toBe( 9 );
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

			const selectionHistory = history.getSelectionHistory();

			// Current selection at index 0
			expect( selectionHistory[ 0 ].start.clientId ).toBe( 'block-2' );
			expect( selectionHistory[ 0 ].end.clientId ).toBe( 'block-2' );
			// Only one previous selection (block-1)
			expect( selectionHistory[ 1 ].start.clientId ).toBe( 'block-1' );

			// Should only have 2 entries total (current + 1 previous)
			expect( selectionHistory.length ).toBe( 2 );
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

			const selectionHistory = history.getSelectionHistory();
			const current = selectionHistory[ 0 ];
			const backupSelections = selectionHistory.slice( 1 );

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

			const selectionHistory = history.getSelectionHistory();
			const current = selectionHistory[ 0 ];

			// Both selections are in same block, so should update current without adding to history
			expect( current?.start.clientId ).toBe( 'block-1' );
			expect( current?.end.clientId ).toBe( 'block-1' );
			expect( ( current?.start as YRelativeSelection ).offset ).toBe( 2 );
			expect( ( current?.end as YRelativeSelection ).offset ).toBe( 10 );
			expect( selectionHistory.length ).toBe( 1 );
		} );

		test( 'should track cross-block selection spanning two blocks', () => {
			const selection = createSelection(
				{ clientId: 'block-1', attributeKey: 'content', offset: 5 },
				{ clientId: 'block-2', attributeKey: 'content', offset: 3 }
			);
			history.updateSelection( selection );

			const selectionHistory = history.getSelectionHistory();
			const current = selectionHistory[ 0 ];

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

			const selectionHistory = history.getSelectionHistory();
			const current = selectionHistory[ 0 ];
			const blockHistory = selectionHistory.slice( 1 );

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

			const selectionHistory = history.getSelectionHistory();
			const current = selectionHistory[ 0 ];
			const blockHistory = selectionHistory.slice( 1 );

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

			const selectionHistory = history.getSelectionHistory();
			const current = selectionHistory[ 0 ];
			const blockHistory = selectionHistory.slice( 1 );

			expect( current?.start.clientId ).toBe( 'block-1' );
			expect( current?.end.clientId ).toBe( 'block-2' );
			expect( ( current?.start as YRelativeSelection ).offset ).toBe( 2 );
			expect( ( current?.end as YRelativeSelection ).offset ).toBe( 8 );
			// Should not add to history - same block combination
			expect( blockHistory.length ).toBe( 0 );
		} );
	} );
} );
