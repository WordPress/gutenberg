import * as Y from 'yjs';
import { LOCAL_EDITOR_ORIGIN } from './config';
import type { RecordHandlers } from './types';

type UndoMetaHandlers = Pick<
	RecordHandlers,
	'addUndoMeta' | 'onUndoLevelOpened' | 'restoreUndoMeta'
>;

interface StackItemEvent {
	stackItem: { meta: Map< any, any > };
	origin: any;
	type: 'undo' | 'redo';
	changedParentTypes: Map< Y.AbstractType< any >, Y.YEvent< any >[] >;
}

/**
 * The undo history of one synced entity.
 */
export interface EntityUndoManager {
	/** Drops the redo levels. */
	clearRedo: () => void;

	/** Whether there are levels to redo. */
	hasRedo: () => boolean;

	/** Whether there are levels to undo. */
	hasUndo: () => boolean;

	/** Redoes the most recently undone level. Returns whether a level was redone. */
	redo: () => boolean;

	/** Closes the current level, so the next change opens a new one. */
	stopCapturing: () => void;

	/** Undoes the most recent level. Returns whether a level was undone. */
	undo: () => boolean;
}

/**
 * Creates the undo history of one synced entity, backed by a Yjs undo manager.
 * It gives this peer its own undo/redo stack for the entity's CRDT document,
 * without undoing changes made by other peers.
 *
 * Yjs tracks changes on its own: every local transaction on the map either
 * opens a new undo level or merges into the current one. Each new level is
 * reported through `onUndoLevelOpened`.
 *
 * Yjs destroys its undo manager with the document, so there is nothing to
 * clean up when the entity is unloaded.
 *
 * @param ydoc                       The entity's CRDT document.
 * @param ymap                       The Yjs map to track.
 * @param handlers                   Handlers for the document.
 * @param handlers.addUndoMeta       Handler to add metadata to undo items.
 * @param handlers.onUndoLevelOpened Handler for new undo levels.
 * @param handlers.restoreUndoMeta   Handler to restore metadata from undo items.
 */
export function createEntityUndoManager(
	ydoc: Y.Doc,
	ymap: Y.Map< any >,
	handlers: UndoMetaHandlers
): EntityUndoManager {
	// Set while undo() or redo() move the stack, whose resulting stack events
	// must not be mistaken for new levels.
	let isApplyingHistory = false;

	const yUndoManager = new Y.UndoManager( ymap, {
		// Throttle undo/redo captures after 500ms of inactivity.
		// 500 was selected from subjective local UX testing, shorter timeouts
		// may cause mid-word undo stack items.
		captureTimeout: 500,
		// Ensure that we only scope the undo/redo to the current editor.
		trackedOrigins: new Set( [ LOCAL_EDITOR_ORIGIN ] ),
	} );

	yUndoManager.on( 'stack-item-added', ( event: StackItemEvent ) => {
		handlers.addUndoMeta( ydoc, event.stackItem.meta );

		// A local edit opened a new undo level. Undo and redo add stack items
		// too, but the consumer already holds those levels.
		if ( 'undo' === event.type && ! isApplyingHistory ) {
			handlers.onUndoLevelOpened?.();
		}
	} );

	yUndoManager.on( 'stack-item-popped', ( event: StackItemEvent ) => {
		handlers.restoreUndoMeta( ydoc, event.stackItem.meta );
	} );

	const applyHistory = ( type: 'undo' | 'redo' ): boolean => {
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
		clearRedo: () => yUndoManager.clear( false, true ),
		hasRedo: () => yUndoManager.canRedo(),
		hasUndo: () => yUndoManager.canUndo(),
		redo: () => applyHistory( 'redo' ),
		stopCapturing: () => yUndoManager.stopCapturing(),
		undo: () => applyHistory( 'undo' ),
	};
}
