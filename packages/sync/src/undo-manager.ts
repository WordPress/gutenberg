/**
 * External dependencies
 */
import type * as Y from 'yjs';

/**
 * WordPress dependencies
 */
import type {
	HistoryRecord,
	UndoManager as WPUndoManager,
} from '@wordpress/undo-manager';

/**
 * Internal dependencies
 */
import { LOCAL_EDITOR_ORIGIN } from './config';
import { YMultiDocUndoManager } from './y-utilities/y-multidoc-undomanager';
import type { ObjectData } from './types';

/**
 * Wrapper class that implements the WordPress UndoManager interface while using
 * YMultiDocUndoManager internally. This allows undo/redo operations to be
 * transacted against multiple CRDT documents (one per entity) and giving each
 * peer their own undo/redo stack without conflicts.
 */
export class UndoManager implements WPUndoManager< ObjectData > {
	private static instance: UndoManager;
	private undoManager: YMultiDocUndoManager;

	private constructor() {
		this.undoManager = new YMultiDocUndoManager( [], {
			// Throttle undo/redo captures. (default: 500ms)
			captureTimeout: 250,
			// Ensure that we only scope the undo/redo to the current editor.
			// The yjs document's clientID is added once it's available.
			trackedOrigins: new Set( [ LOCAL_EDITOR_ORIGIN ] ),
			// Do not ignore changes that come from remote clients.
			// This is to account for other clients making changes to the same
			// block.
			ignoreRemoteMapChanges: true,
		} );
	}

	public static create(): UndoManager {
		if ( ! UndoManager.instance ) {
			UndoManager.instance = new UndoManager();
		}

		return UndoManager.instance;
	}

	/**
	 * Record changes into the history.
	 * Since Yjs automatically tracks changes, this method translates the WordPress
	 * HistoryRecord format into Yjs operations.
	 *
	 * @param _record   A record of changes to record.
	 * @param _isStaged Whether to immediately create an undo point or not.
	 */
	public addRecord(
		_record?: HistoryRecord< ObjectData >,
		_isStaged = false // eslint-disable-line @typescript-eslint/no-unused-vars
	): void {
		// This is a no-op for Yjs since it automatically tracks changes.
		// If needed, we could implement custom logic to handle specific records.
	}

	/**
	 * Add a Yjs map to the scope of the undo manager.
	 *
	 * @param {Y.Map< any >} ymap The Yjs map to add to the scope.
	 */
	public addToScope( ymap: Y.Map< any > ): void {
		this.undoManager.addToScope( ymap );
		this.undoManager.addTrackedOrigin( ymap.doc?.clientID );

		ymap.doc?.on( 'destroy', () => {
			this.undoManager.removeTrackedOrigin( ymap.doc?.clientID );
		} );
	}

	/**
	 * Undo the last recorded changes.
	 *
	 */
	public undo(): HistoryRecord< ObjectData > | undefined {
		if ( ! this.hasUndo() ) {
			return;
		}

		// Perform the undo operation
		this.undoManager.undo();

		// Intentionally return an empty array, because the SyncProvider will update
		// the entity record based on the Yjs document changes.
		return [];
	}

	/**
	 * Redo the last undone changes.
	 */
	public redo(): HistoryRecord< ObjectData > | undefined {
		if ( ! this.hasRedo() ) {
			return;
		}

		// Perform the redo operation
		this.undoManager.redo();

		// Intentionally return an empty array, because the SyncProvider will update
		// the entity record based on the Yjs document changes.
		return [];
	}

	/**
	 * Check if there are changes that can be undone.
	 *
	 * @return Whether there are changes to undo.
	 */
	public hasUndo(): boolean {
		return this.undoManager.canUndo();
	}

	/**
	 * Check if there are changes that can be redone.
	 *
	 * @return Whether there are changes to redo.
	 */
	public hasRedo(): boolean {
		return this.undoManager.canRedo();
	}
}
