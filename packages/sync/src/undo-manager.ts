/**
 * External dependencies
 */
import * as Y from 'yjs';

/**
 * WordPress dependencies
 */
import type { HistoryRecord } from '@wordpress/undo-manager';
import type { WPSelection } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { LOCAL_EDITOR_ORIGIN } from './config';
import { YMultiDocUndoManager } from './y-utilities/y-multidoc-undomanager';
import type { ObjectData, RecordHandlers, SyncUndoManager } from './types';
import { findBlockByClientIdInDoc } from './utils';
import { BlockSelectionHistory } from './block-selection-history';

interface StackItemEvent {
	stackItem: { meta: Map< any, any > };
	origin: any;
	type: 'undo' | 'redo';
	changedParentTypes: Map< Y.AbstractType< any >, Y.YEvent< any >[] >;
	ydoc: Y.Doc;
}

enum PositionType {
	RelativeSelection = 'RelativeSelection',
	BlockSelection = 'BlockSelection',
}

interface RelativePosition {
	type: PositionType.RelativeSelection;
	attributeKey: string;
	relativePosition: Y.RelativePosition;
	clientId: string;
	offset: number;
}

interface BlockPosition {
	type: PositionType.BlockSelection;
	clientId: string;
}

type Position = RelativePosition | BlockPosition;

interface PositionMeta {
	position: Position;
	backupPositions?: Position[];
}

/**
 * Implementation of the WordPress UndoManager interface using YMultiDocUndoManager
 * internally. This allows undo/redo operations to be transacted against multiple
 * CRDT documents (one per entity) and giving each peer their own undo/redo stack
 * without conflicts.
 */
export function createUndoManager(): SyncUndoManager {
	let setSelection: RecordHandlers[ 'setSelection' ] = () => {};
	const selectionHistory = new BlockSelectionHistory( 10 );

	const yUndoManager = new YMultiDocUndoManager( [], {
		// Throttle undo/redo captures.
		captureTimeout: 500,
		// Ensure that we only scope the undo/redo to the current editor.
		// The yjs document's clientID is added once it's available.
		trackedOrigins: new Set( [ LOCAL_EDITOR_ORIGIN ] ),
	} );

	function getPositionForSelection(
		selection: WPSelection,
		ydoc: Y.Doc
	): Position | null {
		const clientId = selection.selectionStart.clientId;
		const block = findBlockByClientIdInDoc( clientId, ydoc );

		const attributes = block?.get( 'attributes' ) as
			| Y.Map< Y.Text >
			| undefined;

		let attributeKey = selection.selectionStart.attributeKey;

		if ( attributeKey === undefined ) {
			// When a new paragraph block is inserted via <Enter>, selectionStart
			// will only have a clientId but no attributeKey (like 'content').
			// In the event that we're unsure about the selected Y.Text, look in
			// block attributes for a 'content' key or Y.Text attribute.

			if ( attributes?.get( 'content' ) instanceof Y.Text ) {
				attributeKey = 'content';
			} else {
				attributes?.forEach( ( value, key ) => {
					if ( value instanceof Y.Text ) {
						attributeKey = key;
					}
				} );
			}
		}

		const changedYText = attributes?.get( attributeKey );

		if ( ! ( changedYText instanceof Y.Text ) ) {
			// Could not find the relevant YText in the document, skip bundling position
			console.log( 'Could not find relavant YText, doing nothing' );
			return null;
		}

		if ( attributeKey && clientId ) {
			const offset = selection.selectionStart?.offset ?? 0;
			const relativePosition = Y.createRelativePositionFromTypeIndex(
				changedYText,
				offset
			);

			return {
				type: PositionType.RelativeSelection,
				attributeKey,
				relativePosition,
				clientId,
				offset,
			};
		}

		return null;
	}

	function updatePositionMeta( event: StackItemEvent ): void {
		const currentSelection = selectionHistory.getCurrentSelection();

		if ( currentSelection === null ) {
			// If we don't have a selection, then don't save anything extra
			// to the stack.
			return;
		}

		const position = getPositionForSelection(
			currentSelection,
			event.ydoc
		);

		if ( position ) {
			// Also store the last 5 selections as backup positions.
			const backupPositions: Position[] = [];
			for ( const selection of selectionHistory.getLastSelections( 5 ) ) {
				const backupPosition = getPositionForSelection(
					selection,
					event.ydoc
				);

				if ( backupPosition ) {
					backupPositions.push( backupPosition );
				}
			}

			const positionMeta: PositionMeta = {
				position,
				backupPositions,
			};

			event.stackItem.meta.set( 'position', positionMeta );
		}
	}

	function restorePosition( event: StackItemEvent ): void {
		const positionMeta: PositionMeta | undefined =
			event.stackItem.meta.get( 'position' );

		if ( ! positionMeta ) {
			console.log(
				'Unable to restore position from stack item:',
				event.stackItem
			);
			return;
		}

		const { position } = positionMeta;

		// Build a stack of positions to try, starting with the primary position
		const positionsToTry: Position[] = [ position ];
		if ( positionMeta.backupPositions ) {
			positionsToTry.push( ...positionMeta.backupPositions );
		}

		let isRestored = false;

		// Try each position until we find one that exists in the document
		for ( const positionToTry of positionsToTry ) {
			const block = findBlockByClientIdInDoc(
				positionToTry.clientId,
				event.ydoc
			);

			if ( ! block ) {
				console.log(
					'Block not found, skipping:',
					positionToTry.clientId
				);
				continue;
			}

			console.log( 'Restoring selection from position:', positionToTry );

			if ( positionToTry.type === PositionType.RelativeSelection ) {
				const { relativePosition, attributeKey, clientId } =
					positionToTry;

				const absolutePosition =
					Y.createAbsolutePositionFromRelativePosition(
						relativePosition,
						event.ydoc
					);

				if ( absolutePosition ) {
					setSelection(
						clientId,
						attributeKey,
						absolutePosition.index,
						absolutePosition.index
					);
					isRestored = true;
					break;
				}
			} else if ( positionToTry.type === PositionType.BlockSelection ) {
				setSelection( positionToTry.clientId );
				isRestored = true;
				break;
			}
		}

		if ( ! isRestored ) {
			console.log( 'No valid positions found to restore' );
		}
	}

	yUndoManager.on( 'stack-item-added', ( event: StackItemEvent ) => {
		updatePositionMeta( event );
	} );

	yUndoManager.on( 'stack-item-updated', ( event: StackItemEvent ) => {
		updatePositionMeta( event );
	} );

	yUndoManager.on( 'stack-item-popped', ( event: StackItemEvent ) => {
		restorePosition( event );
	} );

	return {
		/**
		 * Record changes into the history.
		 * Since Yjs automatically tracks changes, this method translates the WordPress
		 * HistoryRecord format into Yjs operations.
		 *
		 * @param _record   A record of changes to record.
		 * @param _isStaged Whether to immediately create an undo point or not.
		 */
		addRecord(
			_record?: HistoryRecord< ObjectData >,
			_isStaged = false // eslint-disable-line @typescript-eslint/no-unused-vars
		): void {
			// This is a no-op for Yjs since it automatically tracks changes.
			// If needed, we could implement custom logic to handle specific records.
		},

		/**
		 * Add a Yjs map to the scope of the undo manager.
		 *
		 * @param {Y.Map< any >} ymap                                The Yjs map to add to the scope.
		 * @param                handlers
		 * @param                handlers.setSelection
		 * @param                handlers.subscribeToSelectionChange
		 */
		addToScope(
			ymap: Y.Map< any >,
			handlers: {
				subscribeToSelectionChange: RecordHandlers[ 'subscribeToSelectionChange' ];
				setSelection: RecordHandlers[ 'setSelection' ];
			}
		): void {
			yUndoManager.addToScope( ymap );

			handlers.subscribeToSelectionChange( ( newSelection ) => {
				selectionHistory.updateSelection( newSelection );
			} );

			setSelection = handlers.setSelection;
		},

		/**
		 * Undo the last recorded changes.
		 *
		 */
		undo(): HistoryRecord< ObjectData > | undefined {
			if ( ! yUndoManager.canUndo() ) {
				return;
			}

			// Perform the undo operation
			yUndoManager.undo();

			// Intentionally return an empty array, because the SyncProvider will update
			// the entity record based on the Yjs document changes.
			return [];
		},

		/**
		 * Redo the last undone changes.
		 */
		redo(): HistoryRecord< ObjectData > | undefined {
			if ( ! yUndoManager.canRedo() ) {
				return;
			}

			// Perform the redo operation
			yUndoManager.redo();

			// Intentionally return an empty array, because the SyncProvider will update
			// the entity record based on the Yjs document changes.
			return [];
		},

		/**
		 * Check if there are changes that can be undone.
		 *
		 * @return {boolean} Whether there are changes to undo.
		 */
		hasUndo(): boolean {
			return yUndoManager.canUndo();
		},

		/**
		 * Check if there are changes that can be redone.
		 *
		 * @return {boolean} Whether there are changes to redo.
		 */
		hasRedo(): boolean {
			return yUndoManager.canRedo();
		},
	};
}
