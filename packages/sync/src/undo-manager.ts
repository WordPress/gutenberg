/**
 * External dependencies
 */
import type * as Y from 'yjs';

/**
 * WordPress dependencies
 */
import { isShallowEqual } from '@wordpress/is-shallow-equal';
import {
	createUndoManager as createWPUndoManager,
	type HistoryRecord,
	type UndoManager as WPUndoManager,
} from '@wordpress/undo-manager';

/**
 * Internal dependencies
 */
import { LOCAL_EDITOR_ORIGIN } from './config';
import { YMultiDocUndoManager } from './y-utilities/y-multidoc-undomanager';
import type {
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

type UndoSource = { type: 'sync'; ydoc: Y.Doc } | { type: 'fallback' };

const getEntityKey = ( objectType: string, objectId: string ): string =>
	`${ objectType }:${ objectId }`;

const isRecordEmpty = ( record?: HistoryRecord< any > ): boolean =>
	! record?.some( ( { changes } ) =>
		Object.values( changes ).some(
			( { from, to } ) =>
				typeof from !== 'function' &&
				typeof to !== 'function' &&
				! isShallowEqual( from, to )
		)
	);

/**
 * Implementation of the WordPress UndoManager interface using YMultiDocUndoManager
 * internally. This allows undo/redo operations to be transacted against multiple
 * CRDT documents (one per entity) and giving each peer their own undo/redo stack
 * without conflicts.
 */
export function createUndoManager(): SyncUndoManager {
	const undoMetaHandlers = new Map< Y.Doc, UndoMetaHandlers >();
	const syncedEntities = new Map< string, Y.Doc >();
	let fallbackUndoManager: WPUndoManager< any > = createWPUndoManager();
	let undoSources: UndoSource[] = [];
	let redoSources: UndoSource[] = [];
	let reservedSyncSources: Y.Doc[] = [];
	let unclaimedSyncSources: Y.Doc[] = [];
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

	const getUndoStackState = (): SyncUndoStackState => ( {
		hasRedo: redoSources.length > 0 || fallbackUndoManager.hasRedo(),
		hasUndo: undoSources.length > 0 || fallbackUndoManager.hasUndo(),
	} );

	const notifyAllUndoStackChanges = (): void => {
		const state = getUndoStackState();
		undoMetaHandlers.forEach( ( handlers ) => {
			handlers.onUndoStackChange?.( state );
		} );
	};

	const notifyUndoStackChange = ( ydoc: Y.Doc ): void => {
		undoMetaHandlers
			.get( ydoc )
			?.onUndoStackChange?.( getUndoStackState() );
	};

	yUndoManager.on( 'stack-item-added', ( event: StackItemEvent ) => {
		const handlers = undoMetaHandlers.get( event.ydoc );
		if ( ! handlers ) {
			return;
		}

		handlers.addUndoMeta( event.ydoc, event.stackItem.meta );
		if ( event.type === 'undo' && ! isApplyingHistory ) {
			const reservationIndex = reservedSyncSources.indexOf( event.ydoc );
			if ( reservationIndex === -1 ) {
				undoSources.push( { type: 'sync', ydoc: event.ydoc } );
				redoSources = [];
				unclaimedSyncSources.push( event.ydoc );
			} else {
				reservedSyncSources.splice( reservationIndex, 1 );
			}
		}
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

	const getRecordSource = ( record: HistoryRecord< any > ): UndoSource => {
		let sourceDoc: Y.Doc | undefined;
		for ( const { id } of record ) {
			if ( typeof id === 'string' ) {
				return { type: 'fallback' };
			}
			const { kind, name, recordId } = id;
			if (
				typeof kind !== 'string' ||
				typeof name !== 'string' ||
				( typeof recordId !== 'string' && typeof recordId !== 'number' )
			) {
				return { type: 'fallback' };
			}
			const ydoc = syncedEntities.get(
				getEntityKey( `${ kind }/${ name }`, String( recordId ) )
			);
			if ( ! ydoc || ( sourceDoc && sourceDoc !== ydoc ) ) {
				return { type: 'fallback' };
			}
			sourceDoc = ydoc;
		}
		return sourceDoc
			? { type: 'sync', ydoc: sourceDoc }
			: { type: 'fallback' };
	};

	const sourcesMatch = ( first: UndoSource, second: UndoSource ): boolean =>
		first.type === second.type &&
		( first.type === 'fallback' ||
			( second.type === 'sync' && first.ydoc === second.ydoc ) );

	return {
		/**
		 * Record changes into the history.
		 * Since Yjs automatically tracks changes, this method translates the WordPress
		 * HistoryRecord format into Yjs operations.
		 *
		 * @param record   A record of changes to record.
		 * @param isStaged Whether to immediately create an undo point or not.
		 */
		addRecord( record?: HistoryRecord< any >, isStaged = false ): void {
			if ( ! record ) {
				fallbackUndoManager.addRecord();
				yUndoManager.stopCapturing();
				return;
			}
			if ( isRecordEmpty( record ) ) {
				return;
			}

			const source = getRecordSource( record );
			const previousSource = undoSources.at( -1 );
			const continuesPreviousSource =
				isStaged &&
				previousSource !== undefined &&
				sourcesMatch( previousSource, source );

			// A new edit invalidates redo history regardless of which backend
			// recorded the undone changes.
			redoSources = [];
			if ( source.type === 'sync' ) {
				fallbackUndoManager.addRecord();
				const unclaimedIndex = unclaimedSyncSources.lastIndexOf(
					source.ydoc
				);
				if ( unclaimedIndex !== -1 ) {
					unclaimedSyncSources.splice( unclaimedIndex, 1 );
				} else if ( ! continuesPreviousSource ) {
					yUndoManager.stopCapturing();
					undoSources.push( source );
					reservedSyncSources.push( source.ydoc );
				}
			} else {
				yUndoManager.clear( false, true );
				yUndoManager.stopCapturing();
				fallbackUndoManager.addRecord(
					record,
					continuesPreviousSource ? isStaged : false
				);
				if ( ! continuesPreviousSource ) {
					undoSources.push( source );
				}
			}
			notifyAllUndoStackChanges();
		},

		/**
		 * Add a Yjs map to the scope of the undo manager.
		 *
		 * @param {Y.Map< any >} ymap                       The Yjs map to add to the scope.
		 * @param {string}       objectType                 The entity object type.
		 * @param {string}       objectId                   The entity object ID.
		 * @param                handlers                   Handlers for the scoped document.
		 * @param                handlers.addUndoMeta       Handler to add metadata to undo items.
		 * @param                handlers.onUndoStackChange Handler for undo stack changes.
		 * @param                handlers.restoreUndoMeta   Handler to restore metadata from undo items.
		 */
		addToScope(
			ymap: Y.Map< any >,
			objectType: string,
			objectId: string,
			handlers: UndoMetaHandlers
		): void {
			if ( ymap.doc === null ) {
				// Necessary for a type check, but this shouldn't happen.
				return;
			}

			const ydoc = ymap.doc;
			yUndoManager.addToScope( ymap );
			syncedEntities.set( getEntityKey( objectType, objectId ), ydoc );

			if ( ! undoMetaHandlers.has( ydoc ) ) {
				ydoc.on( 'destroy', () => {
					undoMetaHandlers.delete( ydoc );
					for ( const [ key, doc ] of syncedEntities ) {
						if ( doc === ydoc ) {
							syncedEntities.delete( key );
						}
					}
					undoSources = undoSources.filter(
						( source ) =>
							source.type === 'fallback' || source.ydoc !== ydoc
					);
					redoSources = redoSources.filter(
						( source ) =>
							source.type === 'fallback' || source.ydoc !== ydoc
					);
					reservedSyncSources = reservedSyncSources.filter(
						( doc ) => doc !== ydoc
					);
					unclaimedSyncSources = unclaimedSyncSources.filter(
						( doc ) => doc !== ydoc
					);
					notifyAllUndoStackChanges();
				} );
			}
			undoMetaHandlers.set( ydoc, handlers );
		},

		/**
		 * Undo the last recorded changes.
		 *
		 */
		undo(): HistoryRecord< any > | undefined {
			const source = undoSources.pop();
			if ( ! source ) {
				const record = fallbackUndoManager.undo();
				if ( record ) {
					redoSources.push( { type: 'fallback' } );
				}
				notifyAllUndoStackChanges();
				return record;
			}
			redoSources.push( source );
			if ( source.type === 'fallback' ) {
				const record = fallbackUndoManager.undo();
				notifyAllUndoStackChanges();
				return record;
			}
			const unclaimedIndex = unclaimedSyncSources.lastIndexOf(
				source.ydoc
			);
			if ( unclaimedIndex !== -1 ) {
				unclaimedSyncSources.splice( unclaimedIndex, 1 );
			}
			isApplyingHistory = true;
			try {
				yUndoManager.undo();
			} finally {
				isApplyingHistory = false;
			}
			return [];
		},

		/**
		 * Redo the last undone changes.
		 */
		redo(): HistoryRecord< any > | undefined {
			const source = redoSources.pop();
			if ( ! source ) {
				const record = fallbackUndoManager.redo();
				if ( record ) {
					undoSources.push( { type: 'fallback' } );
				}
				notifyAllUndoStackChanges();
				return record;
			}
			undoSources.push( source );
			if ( source.type === 'fallback' ) {
				const record = fallbackUndoManager.redo();
				notifyAllUndoStackChanges();
				return record;
			}
			isApplyingHistory = true;
			try {
				yUndoManager.redo();
			} finally {
				isApplyingHistory = false;
			}
			return [];
		},

		/**
		 * Check if there are changes that can be undone.
		 *
		 * @return {boolean} Whether there are changes to undo.
		 */
		hasUndo(): boolean {
			return getUndoStackState().hasUndo;
		},

		/**
		 * Check if there are changes that can be redone.
		 *
		 * @return {boolean} Whether there are changes to redo.
		 */
		hasRedo(): boolean {
			return getUndoStackState().hasRedo;
		},

		setFallbackUndoManager( undoManager: WPUndoManager< any > ): void {
			fallbackUndoManager = undoManager;
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
