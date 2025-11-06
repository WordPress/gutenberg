/**
 * External dependencies
 */
import * as Y from 'yjs';

/**
 * WordPress dependencies
 */
import type { HistoryRecord } from '@wordpress/undo-manager';

/**
 * Internal dependencies
 */
import { LOCAL_EDITOR_ORIGIN } from './config';
import { YMultiDocUndoManager } from './y-utilities/y-multidoc-undomanager';
import type {
	ObjectData,
	RecordHandlers,
	SyncUndoManager,
	Position,
} from './types';
import { PositionType } from './types';
import { findBlockByClientIdInDoc } from './utils';
import { BlockSelectionHistory } from './block-selection-history';

interface StackItemEvent {
	stackItem: { meta: Map< any, any > };
	origin: any;
	type: 'undo' | 'redo';
	changedParentTypes: Map< Y.AbstractType< any >, Y.YEvent< any >[] >;
	ydoc: Y.Doc;
}

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
	const selectionHistory = new BlockSelectionHistory( 5 );

	const yUndoManager = new YMultiDocUndoManager( [], {
		// Throttle undo/redo captures.
		captureTimeout: 500,
		// Ensure that we only scope the undo/redo to the current editor.
		// The yjs document's clientID is added once it's available.
		trackedOrigins: new Set( [ LOCAL_EDITOR_ORIGIN ] ),
	} );

	function updatePositionMeta( event: StackItemEvent ): void {
		let positionToStore = selectionHistory.getCurrentPosition();

		const backupPositions = selectionHistory.getBlockHistory( 3 );

		if ( positionToStore === null && backupPositions.length === 0 ) {
			// If we don't have a last selection and no backup positions, then don't save anything extra
			return;
		} else if ( positionToStore === null ) {
			// If positionToStore is null for some reason, use a backup position
			positionToStore = backupPositions[ 0 ];
		}

		const positionMeta: PositionMeta = {
			position: positionToStore,
			backupPositions,
		};

		event.stackItem.meta.set( 'position', positionMeta );
	}

	function restorePosition( event: StackItemEvent ): void {
		const positionMeta: PositionMeta | undefined =
			event.stackItem.meta.get( 'position' );

		if ( ! positionMeta ) {
			// No position meta stored with this item, do nothing.
			return;
		}

		const { position } = positionMeta;

		// Build a stack of positions to try, starting with the primary position
		const positionsToTry: Position[] = [ position ];
		if ( positionMeta.backupPositions ) {
			positionsToTry.push( ...positionMeta.backupPositions );
		}

		// Try each position until we find one that exists in the document
		for ( const positionToTry of positionsToTry ) {
			const block = findBlockByClientIdInDoc(
				positionToTry.clientId,
				event.ydoc
			);

			if ( ! block ) {
				// This block no longer exists, skip it.
				continue;
			}

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
					break;
				}
			} else if ( positionToTry.type === PositionType.BlockSelection ) {
				setSelection( positionToTry.clientId );
				break;
			}
		}
	}

	yUndoManager.on( 'stack-item-added', ( event: StackItemEvent ) => {
		updatePositionMeta( event );
	} );

	// stack-item-updated not necessary - we already have the starting position
	// for the undo operation stored in stack-item-added

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

			// Pass the ydoc to the selection history so it can convert selections to positions
			selectionHistory.setYDoc( ymap.doc as Y.Doc );

			handlers.subscribeToSelectionChange( ( newSelection ) => {
				// Selection updates occur before the underlying Y.Text data is updated,
				// so wait until the current event loop has completed so that a valid
				// relative position can be calculated.
				setTimeout( () => {
					selectionHistory.updateSelection( newSelection );
				}, 0 );
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
