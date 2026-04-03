/**
 * External dependencies
 */
import type * as Y from '@y/y';

/**
 * WordPress dependencies
 */
import type { HistoryRecord } from '@wordpress/undo-manager';

/**
 * Internal dependencies
 */
import { LOCAL_EDITOR_ORIGIN, LOCAL_EDITOR_PASSTHROUGH_ORIGIN } from './config';
import { YMultiDocUndoManager } from './y-utilities/y-multidoc-undomanager';
import type { ObjectData, RecordHandlers, SyncUndoManager } from './types';

interface StackItemEvent {
	stackItem: { meta: Map< any, any > };
	origin: any;
	type: 'undo' | 'redo';
	ydoc: Y.Doc;
}

/**
 * Implementation of the WordPress UndoManager interface using YMultiDocUndoManager
 * internally. This allows undo/redo operations to be transacted against multiple
 * CRDT documents (one per entity) and giving each peer their own undo/redo stack
 * without conflicts.
 *
 * @param {Function} onBeforeUndoRedo Optional callback that runs before undo/redo operations.
 *                                    Receives the internal per-doc UndoManager map so the
 *                                    caller can add their origins to pass-through lists.
 */
export function createUndoManager(
	onBeforeUndoRedo?: ( undoManagerDocs: Map< any, any > ) => () => void
): SyncUndoManager {
	const yUndoManager = new YMultiDocUndoManager( [], {
		// Throttle undo/redo captures after 500ms of inactivity.
		// 500 was selected from subjective local UX testing, shorter timeouts
		// may cause mid-word undo stack items.
		captureTimeout: 500,
		// Ensure that we only scope the undo/redo to the current editor.
		// Track both origins so undo works for both blocks and passthrough changes.
		trackedOrigins: new Set( [
			LOCAL_EDITOR_ORIGIN,
			LOCAL_EDITOR_PASSTHROUGH_ORIGIN,
		] ),
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
		 * @param {Y.Type} ymap                     The Yjs map to add to the scope.
		 * @param          handlers
		 * @param          handlers.addUndoMeta
		 * @param          handlers.restoreUndoMeta
		 */
		addToScope(
			ymap: Y.Type,
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
				// Only process events for the doc this scope belongs to.
				// Multiple docs may share the same YMultiDocUndoManager.
				if ( event.ydoc === ydoc ) {
					addUndoMeta( ydoc, event.stackItem.meta );
				}
			} );

			yUndoManager.on( 'stack-item-popped', ( event: StackItemEvent ) => {
				if ( event.ydoc === ydoc ) {
					restoreUndoMeta( ydoc, event.stackItem.meta );
				}
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

			// Temporarily suspend suggestion mode so that undo operations flow
			// directly to currentDoc. Without this, undoing in suggesting mode
			// would create a new suggestion that reverses the previous one.
			// Pass the per-doc UndoManager map so the caller can add them to
			// the AM's suggestionOrigins (the Y.UndoManager instance is used
			// as the transaction origin during undo).
			const restore = onBeforeUndoRedo?.( yUndoManager.docs );

			// Perform the undo operation
			yUndoManager.undo();

			// Restore suggestion mode.
			restore?.();

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

			// Temporarily suspend suggestion mode so that redo operations flow
			// directly to currentDoc.
			const restore = onBeforeUndoRedo?.( yUndoManager.docs );

			// Perform the redo operation
			yUndoManager.redo();

			// Restore suggestion mode.
			restore?.();

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
