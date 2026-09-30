import * as Y from 'yjs';
import { LOCAL_EDITOR_ORIGIN } from './config';
import type {
	EntityID,
	ObjectID,
	ObjectType,
	RecordHandlers,
	SyncUndoManager,
} from './types';
import { getEntityId } from './utils';

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

export interface SyncUndoManagerOptions {
	/**
	 * Applies local changes that were deferred and have not reached their
	 * documents yet. Called before the history is read or moved, so those
	 * changes belong to the level they were made in.
	 */
	flushPendingUpdates?: () => void;
}

/**
 * The undo history of synced entities, with one Yjs undo manager per entity.
 * Each gives this peer its own undo/redo stack for the entity's CRDT document,
 * without undoing changes made by other peers.
 *
 * Yjs tracks changes on its own: every local transaction on a scoped map
 * either opens a new undo level or merges into the current one. This history
 * is not the editor's undo manager and does not order levels across entities.
 * The consumer keeps its own history, records each level reported through
 * `onUndoLevelOpened` for the entity that opened it, and calls `undo` or
 * `redo` for that entity when that level is the one to move.
 *
 * @param options Options.
 */
export function createUndoManager(
	options: SyncUndoManagerOptions = {}
): SyncUndoManager {
	const { flushPendingUpdates = () => {} } = options;
	const yUndoManagers = new Map< EntityID, Y.UndoManager >();

	// Set while undo() or redo() move a stack, whose resulting stack events
	// must not be mistaken for new levels.
	let isApplyingHistory = false;

	const applyHistory = (
		type: 'undo' | 'redo',
		objectType: ObjectType,
		objectId: ObjectID
	): boolean => {
		flushPendingUpdates();

		// Unloaded entities have no undo manager, so their levels move nothing.
		const yUndoManager = yUndoManagers.get(
			getEntityId( objectType, objectId )
		);
		if ( ! yUndoManager ) {
			return false;
		}

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
		 * Add an entity's Yjs map to the history, with its own undo manager.
		 *
		 * @param objectType                 Object type.
		 * @param objectId                   Object ID.
		 * @param ymap                       The Yjs map to track.
		 * @param handlers                   Handlers for the scoped document.
		 * @param handlers.addUndoMeta       Handler to add metadata to undo items.
		 * @param handlers.onUndoLevelOpened Handler for new undo levels.
		 * @param handlers.restoreUndoMeta   Handler to restore metadata from undo items.
		 */
		addToScope(
			objectType: ObjectType,
			objectId: ObjectID,
			ymap: Y.Map< any >,
			handlers: UndoMetaHandlers
		): void {
			const ydoc = ymap.doc;
			if ( ydoc === null ) {
				// Necessary for a type check, but this shouldn't happen.
				return;
			}

			const entityId = getEntityId( objectType, objectId );
			yUndoManagers.get( entityId )?.destroy();

			const yUndoManager = new Y.UndoManager( ymap, {
				// Throttle undo/redo captures after 500ms of inactivity.
				// 500 was selected from subjective local UX testing, shorter
				// timeouts may cause mid-word undo stack items.
				captureTimeout: 500,
				// Ensure that we only scope the undo/redo to the current editor.
				trackedOrigins: new Set( [ LOCAL_EDITOR_ORIGIN ] ),
			} );

			yUndoManager.on( 'stack-item-added', ( event: StackItemEvent ) => {
				handlers.addUndoMeta( ydoc, event.stackItem.meta );

				// Undo and redo add stack items too, but the consumer
				// already holds those levels.
				if ( 'undo' !== event.type || isApplyingHistory ) {
					return;
				}

				// A local edit opened a new level, which is now the most
				// recent one. Other entities must not merge later changes
				// into their older levels, and their redo levels are gone
				// from the consumer's history.
				yUndoManagers.forEach( ( other ) => {
					if ( other !== yUndoManager ) {
						other.stopCapturing();
						other.clear( false, true );
					}
				} );

				handlers.onUndoLevelOpened?.();
			} );

			yUndoManager.on( 'stack-item-popped', ( event: StackItemEvent ) => {
				handlers.restoreUndoMeta( ydoc, event.stackItem.meta );
			} );

			// Yjs destroys the undo manager with its document.
			ydoc.on( 'destroy', () => {
				if ( yUndoManagers.get( entityId ) === yUndoManager ) {
					yUndoManagers.delete( entityId );
				}
			} );

			yUndoManagers.set( entityId, yUndoManager );
		},

		/**
		 * Undo the most recent level of an entity. Its document updates the
		 * entity record through its observers.
		 *
		 * @param {ObjectType} objectType Object type.
		 * @param {ObjectID}   objectId   Object ID.
		 * @return Whether a level was undone. False when none is left, for
		 *         example because the entity was unloaded.
		 */
		undo( objectType: ObjectType, objectId: ObjectID ): boolean {
			return applyHistory( 'undo', objectType, objectId );
		},

		/**
		 * Redo the most recently undone level of an entity.
		 *
		 * @param {ObjectType} objectType Object type.
		 * @param {ObjectID}   objectId   Object ID.
		 * @return Whether a level was redone.
		 */
		redo( objectType: ObjectType, objectId: ObjectID ): boolean {
			return applyHistory( 'redo', objectType, objectId );
		},

		/**
		 * Check if any entity has changes that can be undone.
		 *
		 * @return {boolean} Whether there are changes to undo.
		 */
		hasUndo(): boolean {
			return [ ...yUndoManagers.values() ].some( ( yUndoManager ) =>
				yUndoManager.canUndo()
			);
		},

		/**
		 * Check if any entity has changes that can be redone.
		 *
		 * @return {boolean} Whether there are changes to redo.
		 */
		hasRedo(): boolean {
			return [ ...yUndoManagers.values() ].some( ( yUndoManager ) =>
				yUndoManager.canRedo()
			);
		},

		/**
		 * Close the current undo level of every entity, so the next change
		 * opens a new one. Deferred changes made before this call still
		 * belong to the current level.
		 */
		stopCapturing(): void {
			flushPendingUpdates();
			yUndoManagers.forEach( ( yUndoManager ) =>
				yUndoManager.stopCapturing()
			);
		},

		/**
		 * Drop the redo levels of every entity. Yjs does this on its own for
		 * a new change to the same entity; the consumer calls it when any
		 * other edit ends the redo history.
		 */
		clearRedo(): void {
			flushPendingUpdates();
			yUndoManagers.forEach( ( yUndoManager ) =>
				yUndoManager.clear( false, true )
			);
		},
	};
}
