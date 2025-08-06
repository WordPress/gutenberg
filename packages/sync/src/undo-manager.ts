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
import type { ObjectData } from './types';

/**
 * Wrapper class that provides the WordPress UndoManager interface while using Y.UndoManager internally.
 * This allows seamless integration between Yjs collaborative editing and WordPress undo/redo functionality.
 */
export class UndoManager implements WPUndoManager< ObjectData > {
	private undoManager: Y.UndoManager;

	/**
	 * Constructor.
	 *
	 * @param undoManager The Y.UndoManager instance to wrap.
	 */
	constructor( undoManager: Y.UndoManager ) {
		this.undoManager = undoManager;
	}

	/**
	 * Record changes into the history.
	 * Since Yjs automatically tracks changes, this method translates the WordPress
	 * HistoryRecord format into Yjs operations.
	 *
	 * @param record   A record of changes to record.
	 * @param isStaged Whether to immediately create an undo point or not.
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	addRecord( record?: HistoryRecord< ObjectData >, isStaged = false ): void {
		// This is a no-op for Yjs since it automatically tracks changes.
		// If needed, we could implement custom logic to handle specific records.
	}

	/**
	 * Undo the last recorded changes.
	 *
	 * @return The undone record or undefined if nothing to undo.
	 */
	undo(): HistoryRecord< ObjectData > | undefined {
		if ( ! this.hasUndo() ) {
			return undefined;
		}

		// Perform the undo operation
		this.undoManager.undo();

		// ToDo: See if the undo operation can return a record from Yjs.
		return [];
	}

	/**
	 * Redo the last undone changes.
	 *
	 * @return The redone record or undefined if nothing to redo.
	 */
	redo(): HistoryRecord< ObjectData > | undefined {
		if ( ! this.hasRedo() ) {
			return undefined;
		}

		// Perform the redo operation
		this.undoManager.redo();

		// ToDo: See if the redo operation can return a record from Yjs.
		return [];
	}

	/**
	 * Check if there are changes that can be undone.
	 *
	 * @return Whether there are changes to undo.
	 */
	hasUndo(): boolean {
		return this.undoManager.canUndo();
	}

	/**
	 * Check if there are changes that can be redone.
	 *
	 * @return Whether there are changes to redo.
	 */
	hasRedo(): boolean {
		return this.undoManager.canRedo();
	}
}
