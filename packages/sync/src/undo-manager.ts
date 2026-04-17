/**
 * External dependencies
 */
import type * as Y from 'yjs';

/**
 * WordPress dependencies
 */
import type { HistoryRecord } from '@wordpress/undo-manager';

/**
 * Internal dependencies
 */
import { LOCAL_EDITOR_ORIGIN } from './config';
import { YMultiDocUndoManager } from './y-utilities/y-multidoc-undomanager';
import type { ObjectData, RecordHandlers, SyncUndoManager } from './types';

interface StackItemEvent {
	stackItem: { meta: Map< any, any > };
	origin: any;
	type: 'undo' | 'redo';
	changedParentTypes: Map< Y.AbstractType< any >, Y.YEvent< any >[] >;
	ydoc: Y.Doc;
}

/**
 * Implementation of the WordPress UndoManager interface using YMultiDocUndoManager
 * internally. This allows undo/redo operations to be transacted against multiple
 * CRDT documents (one per entity) and giving each peer their own undo/redo stack
 * without conflicts.
 */
export function createUndoManager(): SyncUndoManager {
	const yUndoManager = new YMultiDocUndoManager( [], {
		// Throttle undo/redo captures after 500ms of inactivity.
		// 500 was selected from subjective local UX testing, shorter timeouts
		// may cause mid-word undo stack items.
		captureTimeout: 500,
		// Ensure that we only scope the undo/redo to the current editor.
		// The yjs document's clientID is added once it's available.
		trackedOrigins: new Set( [ LOCAL_EDITOR_ORIGIN ] ),
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
		 * @param {Y.Map< any >} ymap                     The Yjs map to add to the scope.
		 * @param                handlers
		 * @param                handlers.addUndoMeta
		 * @param                handlers.restoreUndoMeta
		 */
		addToScope(
			ymap: Y.Map< any >,
			handlers: Pick< RecordHandlers, 'addUndoMeta' | 'restoreUndoMeta' >
		): void {
			if ( ymap.doc === null ) {
				// Necessary for a type check, but this shouldn't happen.
				return;
			}

			const ydoc = ymap.doc;
			yUndoManager.addToScope( ymap );

			const { addUndoMeta, restoreUndoMeta } = handlers;

			yUndoManager.on( 'stack-item-added', ( event: StackItemEvent ) => {
				addUndoMeta( ydoc, event.stackItem.meta );
			} );

			yUndoManager.on( 'stack-item-popped', ( event: StackItemEvent ) => {
				restoreUndoMeta( ydoc, event.stackItem.meta );
			} );
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

		/**
		 * Stop capturing changes into the current undo item.
		 * The next change will create a new undo item.
		 */
		stopCapturing(): void {
			yUndoManager.stopCapturing();
		},
	};
}
