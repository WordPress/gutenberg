import type * as Y from 'yjs';
import type { HistoryRecord } from '@wordpress/undo-manager';

/**
 * Internal dependencies
 */
import { DEFAULT_UNDO_SCOPE, LOCAL_EDITOR_ORIGIN } from './config';
import { YMultiDocUndoManager } from './y-utilities/y-multidoc-undomanager';
import type {
	ObjectData,
	RecordHandlers,
	SyncUndoManager,
	SyncUndoStackState,
} from './types';

type UndoMetaHandlers = Pick<
	RecordHandlers,
	'addUndoMeta' | 'onUndoStackChange' | 'restoreUndoMeta'
>;

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
	const undoMetaHandlers = new Map< Y.Doc, UndoMetaHandlers >();
	// Every editing scope gets its own undo manager, but they all track the
	// same CRDT documents. Documents loaded later are added to the scope of
	// every manager, including the ones that are currently inactive.
	const scopedTypes = new Set< Y.Map< any > >();
	const scopedUndoManagers = new Map< string, YMultiDocUndoManager >();
	let activeScope = DEFAULT_UNDO_SCOPE;

	const getUndoStackState = (): SyncUndoStackState => ( {
		hasRedo: getActiveUndoManager().canRedo(),
		hasUndo: getActiveUndoManager().canUndo(),
	} );

	const notifyUndoStackChange = ( ydoc: Y.Doc ): void => {
		undoMetaHandlers
			.get( ydoc )
			?.onUndoStackChange?.( getUndoStackState() );
	};

	const notifyAllUndoStackChanges = (): void => {
		undoMetaHandlers.forEach( ( handlers ) => {
			handlers.onUndoStackChange?.( getUndoStackState() );
		} );
	};

	const createScopedUndoManager = (): YMultiDocUndoManager => {
		const yUndoManager = new YMultiDocUndoManager( [], {
			// Throttle undo/redo captures after 500ms of inactivity.
			// 500 was selected from subjective local UX testing, shorter timeouts
			// may cause mid-word undo stack items.
			captureTimeout: 500,
			// Ensure that we only scope the undo/redo to the current editor.
			// The editor origin is only tracked while this is the active scope,
			// so that editing in one editing context can't be undone from
			// another one.
			trackedOrigins: new Set(),
		} );

		yUndoManager.on( 'stack-item-added', ( event: StackItemEvent ) => {
			const handlers = undoMetaHandlers.get( event.ydoc );
			if ( ! handlers ) {
				return;
			}

			handlers.addUndoMeta( event.ydoc, event.stackItem.meta );
			notifyUndoStackChange( event.ydoc );
		} );

		yUndoManager.on( 'stack-item-updated', ( event: StackItemEvent ) => {
			notifyUndoStackChange( event.ydoc );
		} );

		yUndoManager.on( 'stack-item-popped', ( event: StackItemEvent ) => {
			const handlers = undoMetaHandlers.get( event.ydoc );
			if ( ! handlers ) {
				return;
			}

			handlers.restoreUndoMeta( event.ydoc, event.stackItem.meta );
			notifyUndoStackChange( event.ydoc );
		} );

		yUndoManager.on( 'stack-cleared', () => {
			notifyAllUndoStackChanges();
		} );

		scopedTypes.forEach( ( ytype ) => yUndoManager.addToScope( ytype ) );

		return yUndoManager;
	};

	const getScopedUndoManager = ( scope: string ): YMultiDocUndoManager => {
		let yUndoManager = scopedUndoManagers.get( scope );

		if ( ! yUndoManager ) {
			yUndoManager = createScopedUndoManager();
			scopedUndoManagers.set( scope, yUndoManager );
		}

		return yUndoManager;
	};

	function getActiveUndoManager(): YMultiDocUndoManager {
		return getScopedUndoManager( activeScope );
	}

	getActiveUndoManager().addTrackedOrigin( LOCAL_EDITOR_ORIGIN );

	return {
		/**
		 * Set the editing scope that undo levels are captured in and undone
		 * from. Each scope keeps its own history, so returning to a scope that
		 * was active before restores its undo and redo stacks.
		 *
		 * @param scope Scope identifier.
		 */
		setScope( scope: string = DEFAULT_UNDO_SCOPE ): void {
			if ( scope === activeScope ) {
				return;
			}

			// Only the manager of the active scope captures undo levels.
			const previousUndoManager = getActiveUndoManager();
			previousUndoManager.removeTrackedOrigin( LOCAL_EDITOR_ORIGIN );

			// Don't keep managers around for scopes that were merely visited,
			// they'd observe every document for as long as this manager lives.
			if (
				! previousUndoManager.canUndo() &&
				! previousUndoManager.canRedo()
			) {
				scopedUndoManagers.delete( activeScope );
				previousUndoManager.destroy();
			}

			activeScope = scope;
			getActiveUndoManager().addTrackedOrigin( LOCAL_EDITOR_ORIGIN );

			notifyAllUndoStackChanges();
		},

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
		 * @param {Y.Map< any >} ymap                       The Yjs map to add to the scope.
		 * @param                handlers                   Handlers for the scoped document.
		 * @param                handlers.addUndoMeta       Handler to add metadata to undo items.
		 * @param                handlers.onUndoStackChange Handler for undo stack changes.
		 * @param                handlers.restoreUndoMeta   Handler to restore metadata from undo items.
		 */
		addToScope( ymap: Y.Map< any >, handlers: UndoMetaHandlers ): void {
			if ( ymap.doc === null ) {
				// Necessary for a type check, but this shouldn't happen.
				return;
			}

			const ydoc = ymap.doc;
			scopedTypes.add( ymap );
			scopedUndoManagers.forEach( ( yUndoManager ) =>
				yUndoManager.addToScope( ymap )
			);

			if ( ! undoMetaHandlers.has( ydoc ) ) {
				ydoc.on( 'destroy', () => {
					undoMetaHandlers.delete( ydoc );
					scopedTypes.forEach( ( ytype ) => {
						if ( ytype.doc === ydoc ) {
							scopedTypes.delete( ytype );
						}
					} );
				} );
			}
			undoMetaHandlers.set( ydoc, handlers );
		},

		/**
		 * Undo the last recorded changes.
		 *
		 */
		undo(): HistoryRecord< ObjectData > | undefined {
			const yUndoManager = getActiveUndoManager();

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
			const yUndoManager = getActiveUndoManager();

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
			return getActiveUndoManager().canUndo();
		},

		/**
		 * Check if there are changes that can be redone.
		 *
		 * @return {boolean} Whether there are changes to redo.
		 */
		hasRedo(): boolean {
			return getActiveUndoManager().canRedo();
		},

		/**
		 * Stop capturing changes into the current undo item.
		 * The next change will create a new undo item.
		 */
		stopCapturing(): void {
			getActiveUndoManager().stopCapturing();
		},
	};
}
