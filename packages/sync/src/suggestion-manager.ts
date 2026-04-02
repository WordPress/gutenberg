/**
 * External dependencies
 */
import * as Y from '@y/y';
/**
 * Internal dependencies
 */
import { LOCAL_EDITOR_ORIGIN, LOCAL_EDITOR_PASSTHROUGH_ORIGIN } from './config';
import { getProviderCreators } from './providers';
import type {
	CRDTDoc,
	EntityID,
	ObjectID,
	ObjectType,
	ProviderCreatorResult,
} from './types';
import { createYjsDoc, initializeYjsDoc } from './utils';

/**
 * The suggestion mode for a given entity.
 * - 'editing': Changes flow through to currentDoc (no suggestions created).
 * - 'suggesting': Changes stay in nextDoc only (suggestions are created).
 */
export type SuggestionMode = 'editing' | 'suggesting';

/**
 * Per-entity state managed by the SuggestionManager.
 */
interface EntitySuggestionState {
	/** The DiffAttributionManager linking currentDoc and nextDoc. */
	am: Y.DiffAttributionManager;
	/** The current suggestion mode for this entity. */
	mode: SuggestionMode;
	/** The nextDoc containing pending suggestions. */
	nextDoc: CRDTDoc;
	/** Providers for syncing nextDoc. */
	providers: ProviderCreatorResult[];
	/** Map of Yjs clientID → WordPress user ID. */
	userMap: Map< number, number >;
}

/**
 * The SuggestionManager orchestrates the two-document model for suggested
 * edits. For each entity, it maintains:
 *
 * - currentDoc: The accepted content (synced via the existing room).
 * - nextDoc: Content including pending suggestions (synced via :suggestions room).
 * - DiffAttributionManager: Tracks the diff between the two documents.
 */
export interface SuggestionManager {
	/**
	 * Initialize suggestion tracking for an entity. Creates the nextDoc,
	 * DiffAttributionManager, and syncs nextDoc via a :suggestions room.
	 */
	initEntity: (
		entityId: EntityID,
		objectType: ObjectType,
		objectId: ObjectID,
		currentDoc: CRDTDoc
	) => Promise< CRDTDoc >;

	/**
	 * Destroy suggestion state for an entity.
	 */
	destroyEntity: ( entityId: EntityID ) => void;

	/**
	 * Set the suggestion mode for an entity.
	 */
	setMode: ( entityId: EntityID, mode: SuggestionMode ) => void;

	/**
	 * Get the current suggestion mode for an entity.
	 */
	getMode: ( entityId: EntityID ) => SuggestionMode;

	/**
	 * Get the nextDoc for an entity (what the editor reads/writes to).
	 */
	getNextDoc: ( entityId: EntityID ) => CRDTDoc | undefined;

	/**
	 * Get the DiffAttributionManager for an entity.
	 */
	getAttributionManager: (
		entityId: EntityID
	) => Y.DiffAttributionManager | undefined;

	/**
	 * Accept all pending suggestions for an entity.
	 */
	acceptAll: ( entityId: EntityID ) => void;

	/**
	 * Reject all pending suggestions for an entity.
	 */
	rejectAll: ( entityId: EntityID ) => void;

	/**
	 * Register a mapping from Yjs clientID to WordPress user ID.
	 */
	registerUser: (
		entityId: EntityID,
		clientId: number,
		wpUserId: number
	) => void;

	/**
	 * Get the WordPress user ID for a given Yjs clientID.
	 */
	getUserId: ( entityId: EntityID, clientId: number ) => number | undefined;

	/**
	 * Check if any entity has suggestion tracking initialized.
	 */
	hasEntity: ( entityId: EntityID ) => boolean;

	/**
	 * Temporarily suspend suggestion mode for all entities (used during
	 * undo/redo). Returns a restore function.
	 *
	 * @param undoManagerDocs Per-doc UndoManager map from YMultiDocUndoManager.
	 *                        The per-doc UndoManagers are added to AM
	 *                        suggestionOrigins so undo transactions propagate.
	 */
	suspendSuggestionMode: ( undoManagerDocs?: Map< any, any > ) => () => void;
}

/**
 * Create a SuggestionManager instance.
 */
export function createSuggestionManager(): SuggestionManager {
	const states: Map< EntityID, EntitySuggestionState > = new Map();

	async function initEntity(
		entityId: EntityID,
		objectType: ObjectType,
		objectId: ObjectID,
		currentDoc: CRDTDoc
	): Promise< CRDTDoc > {
		if ( states.has( entityId ) ) {
			return states.get( entityId )!.nextDoc;
		}

		const nextDoc = createYjsDoc( { objectType, suggestions: true } );

		// Bootstrap nextDoc with currentDoc's state so they start in sync.
		const currentState = Y.encodeStateAsUpdateV2( currentDoc );
		Y.applyUpdateV2( nextDoc, currentState );

		// Create the DiffAttributionManager linking prevDoc (currentDoc) and
		// nextDoc. By default, suggestionMode is true, meaning all changes to
		// nextDoc are treated as suggestions.
		const am = new Y.DiffAttributionManager( currentDoc, nextDoc );

		// We use suggestionMode=false and control flow via suggestionOrigins.
		// In editing mode, LOCAL_EDITOR_ORIGIN is in suggestionOrigins so
		// changes flow through. In suggesting mode, it's removed.
		am.suggestionMode = false;
		am.suggestionOrigins = [
			LOCAL_EDITOR_ORIGIN,
			LOCAL_EDITOR_PASSTHROUGH_ORIGIN,
		];

		// Sync nextDoc via a :suggestions room. Do NOT pass awareness here —
		// the suggestion room only syncs document state. Sharing the same
		// awareness instance with both rooms causes duplicate listeners that
		// emit spurious leave/rejoin events for the current user on load.
		const providerCreators = getProviderCreators();
		const providers = await Promise.all(
			providerCreators.map( async ( create ) => {
				return create( {
					objectType,
					objectId: `${ objectId }:suggestions`,
					ydoc: nextDoc,
				} );
			} )
		);

		initializeYjsDoc( nextDoc );

		const state: EntitySuggestionState = {
			am,
			mode: 'editing',
			nextDoc,
			providers,
			userMap: new Map(),
		};

		states.set( entityId, state );
		return nextDoc;
	}

	function destroyEntity( entityId: EntityID ): void {
		const state = states.get( entityId );
		if ( ! state ) {
			return;
		}

		state.providers.forEach( ( p ) => p.destroy() );
		state.am.destroy();
		state.nextDoc.destroy();
		states.delete( entityId );
	}

	function setMode( entityId: EntityID, mode: SuggestionMode ): void {
		const state = states.get( entityId );
		if ( ! state ) {
			return;
		}

		state.mode = mode;

		if ( mode === 'editing' ) {
			// In editing mode, editor changes flow through to currentDoc.
			state.am.suggestionOrigins = [
				LOCAL_EDITOR_ORIGIN,
				LOCAL_EDITOR_PASSTHROUGH_ORIGIN,
			];
		} else {
			// In suggesting mode, only passthrough changes flow through.
			// Block content changes (LOCAL_EDITOR_ORIGIN) are blocked.
			state.am.suggestionOrigins = [ LOCAL_EDITOR_PASSTHROUGH_ORIGIN ];
		}
	}

	function getMode( entityId: EntityID ): SuggestionMode {
		return states.get( entityId )?.mode ?? 'editing';
	}

	function getNextDoc( entityId: EntityID ): CRDTDoc | undefined {
		return states.get( entityId )?.nextDoc;
	}

	function getAttributionManager(
		entityId: EntityID
	): Y.DiffAttributionManager | undefined {
		return states.get( entityId )?.am;
	}

	function acceptAll( entityId: EntityID ): void {
		const state = states.get( entityId );
		if ( ! state ) {
			return;
		}
		state.am.acceptAllChanges();
	}

	function rejectAll( entityId: EntityID ): void {
		const state = states.get( entityId );
		if ( ! state ) {
			return;
		}
		state.am.rejectAllChanges();
	}

	function registerUser(
		entityId: EntityID,
		clientId: number,
		wpUserId: number
	): void {
		const state = states.get( entityId );
		if ( ! state ) {
			return;
		}
		state.userMap.set( clientId, wpUserId );
	}

	function getUserId(
		entityId: EntityID,
		clientId: number
	): number | undefined {
		return states.get( entityId )?.userMap.get( clientId );
	}

	function hasEntity( entityId: EntityID ): boolean {
		return states.has( entityId );
	}

	function suspendSuggestionMode(
		undoManagerDocs?: Map< any, any >
	): () => void {
		// Save current mode for each entity and switch to editing.
		const savedModes: Map< EntityID, SuggestionMode > = new Map();

		states.forEach( ( state, entityId ) => {
			savedModes.set( entityId, state.mode );

			if ( state.mode === 'suggesting' ) {
				setMode( entityId, 'editing' );
			}

			// Add per-doc UndoManagers for the nextDoc to AM's
			// suggestionOrigins. During undo/redo, Y.UndoManager uses
			// itself as the transaction origin. Without this, the AM
			// would treat undo reversals as suggestions instead of
			// propagating them to currentDoc.
			if ( undoManagerDocs ) {
				const um = undoManagerDocs.get( state.nextDoc );
				if ( um ) {
					state.am.suggestionOrigins = [
						...( state.am.suggestionOrigins ?? [] ),
						um,
					];
				}
			}
		} );

		// Return restore function. Calling setMode resets
		// suggestionOrigins to the correct values for the mode,
		// removing the UndoManager origins we added above.
		return () => {
			savedModes.forEach( ( mode, entityId ) => {
				setMode( entityId, mode );
			} );
		};
	}

	return {
		acceptAll,
		destroyEntity,
		getAttributionManager,
		getMode,
		getNextDoc,
		getUserId,
		hasEntity,
		initEntity,
		registerUser,
		rejectAll,
		setMode,
		suspendSuggestionMode,
	};
}
