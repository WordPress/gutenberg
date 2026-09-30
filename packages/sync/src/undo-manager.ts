import type * as Y from 'yjs';
import { LOCAL_EDITOR_ORIGIN } from './config';
import { YMultiDocUndoManager } from './y-utilities/y-multidoc-undomanager';
import type { RecordHandlers, SyncUndoManager } from './types';

type UndoMetaHandlers = Pick<
	RecordHandlers,
	'addUndoMeta' | 'onUndoLevelOpened' | 'restoreUndoMeta'
>;

interface StackItemEvent {
	stackItem: { meta: Map< any, any > };
	origin: any;
	type: 'undo' | 'redo';
	changedParentTypes: Map< Y.AbstractType< any >, Y.YEvent< any >[] >;
	ydoc: Y.Doc;
}

export interface SyncUndoManagerOptions {
	/**
	 * Applies local changes that were deferred and have not reached their
	 * documents yet. Called before the history is read or moved, so those
	 * changes belong to the level they were made in.
	 */
	flushPendingUpdates?: () => void;
}

/**
 * The undo history of synced entities, backed by a YMultiDocUndoManager that
 * spans one CRDT document per entity and gives each peer their own undo/redo
 * stack.
 *
 * Yjs tracks changes on its own: every local transaction on a scoped map
 * either opens a new undo level or merges into the current one. This history
 * is not the editor's undo manager. The consumer keeps its own, records a
 * level here through `onUndoLevelOpened`, and calls `undo` or `redo` when
 * that level is the one to move.
 *
 * @param options Options.
 */
export function createUndoManager(
	options: SyncUndoManagerOptions = {}
): SyncUndoManager {
	const { flushPendingUpdates = () => {} } = options;
	const undoMetaHandlers = new Map< Y.Doc, UndoMetaHandlers >();

	// Set while undo() or redo() move the stacks, whose resulting stack
	// events must not be mistaken for new levels.
	let isApplyingHistory = false;

	const yUndoManager = new YMultiDocUndoManager( [], {
		// Throttle undo/redo captures after 500ms of inactivity.
		// 500 was selected from subjective local UX testing, shorter timeouts
		// may cause mid-word undo stack items.
		captureTimeout: 500,
		// Ensure that we only scope the undo/redo to the current editor.
		// The yjs document's clientID is added once it's available.
		trackedOrigins: new Set( [ LOCAL_EDITOR_ORIGIN ] ),
	} );

	yUndoManager.on( 'stack-item-added', ( event: StackItemEvent ) => {
		const handlers = undoMetaHandlers.get( event.ydoc );
		if ( ! handlers ) {
			return;
		}

		handlers.addUndoMeta( event.ydoc, event.stackItem.meta );

		// A local edit opened a new undo level. Undo and redo add stack items
		// too, but the consumer already holds those levels.
		if ( 'undo' === event.type && ! isApplyingHistory ) {
			handlers.onUndoLevelOpened?.();
		}
	} );

	yUndoManager.on( 'stack-item-popped', ( event: StackItemEvent ) => {
		const handlers = undoMetaHandlers.get( event.ydoc );
		if ( ! handlers ) {
			return;
		}

		handlers.restoreUndoMeta( event.ydoc, event.stackItem.meta );
	} );

	const applyHistory = ( type: 'undo' | 'redo' ): boolean => {
		flushPendingUpdates();
		isApplyingHistory = true;

		try {
			const stackItem =
				'undo' === type ? yUndoManager.undo() : yUndoManager.redo();

			return null !== stackItem;
		} finally {
			isApplyingHistory = false;
		}
	};

	return {
		/**
		 * Add a Yjs map to the scope of the undo manager.
		 *
		 * @param {Y.Map< any >} ymap                       The Yjs map to add to the scope.
		 * @param                handlers                   Handlers for the scoped document.
		 * @param                handlers.addUndoMeta       Handler to add metadata to undo items.
		 * @param                handlers.onUndoLevelOpened Handler for new undo levels.
		 * @param                handlers.restoreUndoMeta   Handler to restore metadata from undo items.
		 */
		addToScope( ymap: Y.Map< any >, handlers: UndoMetaHandlers ): void {
			if ( ymap.doc === null ) {
				// Necessary for a type check, but this shouldn't happen.
				return;
			}

			const ydoc = ymap.doc;
			yUndoManager.addToScope( ymap );

			if ( ! undoMetaHandlers.has( ydoc ) ) {
				ydoc.on( 'destroy', () => undoMetaHandlers.delete( ydoc ) );
			}
			undoMetaHandlers.set( ydoc, handlers );
		},

		/**
		 * Undo the most recent level. The documents update the entity
		 * records through their observers.
		 *
		 * @return Whether a level was undone. False when none is left, for
		 *         example because its document was unloaded.
		 */
		undo(): boolean {
			return applyHistory( 'undo' );
		},

		/**
		 * Redo the most recently undone level.
		 *
		 * @return Whether a level was redone.
		 */
		redo(): boolean {
			return applyHistory( 'redo' );
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
		 * Close the current undo level, so the next change opens a new one.
		 * Deferred changes made before this call still belong to the
		 * current level.
		 */
		stopCapturing(): void {
			flushPendingUpdates();
			yUndoManager.stopCapturing();
		},

		/**
		 * Drop the redo levels. Yjs does this on its own for a new change to
		 * a synced entity; the consumer calls it when any other edit ends the
		 * redo history.
		 */
		clearRedo(): void {
			flushPendingUpdates();
			yUndoManager.clear( false, true );
		},
	};
}
