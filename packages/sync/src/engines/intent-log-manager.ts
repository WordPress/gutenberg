/**
 * Internal dependencies
 */
import {
	deriveIntents,
	engineDocumentToBlocks,
	type BridgeBlock,
} from './intent-log-bridge';
import {
	createIntentLogSession,
	type IntentLogSession,
} from './intent-log-session';
import { getProviderCreators } from '../providers';
import type {
	ObjectData,
	ObjectID,
	ObjectType,
	ProviderCreatorResult,
	RecordHandlers,
	SyncConfig,
	SyncManager,
} from '../types';

/*
 * The intent-log SyncManager: the engine adapter surface core-data drives,
 * implemented over an IntentLogSession per entity plus the capture bridge.
 *
 * Where the Yjs manager maintains a CRDT doc and diffs into Y types, this
 * manager keeps the session's engine document as the shared state:
 *
 * - editor → wire: update() derives verified intents from the incoming
 *   block tree (capture bridge) and authors them through the session, which
 *   emits wire updates to the transport;
 * - wire → editor: session change events map the engine document back to
 *   blocks and dispatch editRecord, guarded against echo loops by
 *   canonical-state comparison.
 *
 * v1 scope (documented in ARCHITECTURE.md):
 * - Only the `blocks` property syncs. Other entity properties (title,
 *   status, …) flow through WordPress saves as usual — the intent log's
 *   entity-graph layer arrives later.
 * - Undo rides core's default WPUndoManager (`undoManager` stays
 *   undefined; core-data falls back automatically). Escalated intents are
 *   surfaced via console warning; the review-lane UI is Phase 2d.
 * - No CRDT-doc persistence/snapshots (server materializes instead), so
 *   createPersistedCRDTDoc/getEntitySnapshot return null/undefined and
 *   entityContainsSnapshot returns false (callers fail open).
 */

interface EntityState {
	session: IntentLogSession;
	handlers: RecordHandlers;
	providers: ProviderCreatorResult[];
	unloaded: boolean;
	/** Canonical form of the last state pushed to (or from) the editor. */
	lastPushedState: string | null;
	/**
	 * Whether update() is currently authoring captured intents. The
	 * session emits change events synchronously per authored intent;
	 * those are the editor's own state and must not bounce back.
	 */
	capturing: boolean;
}

/**
 * Canonical form of a bridge block tree for echo suppression.
 *
 * @param blocks Bridge blocks.
 * @return Canonical JSON.
 */
function canonicalBlocksJson( blocks: BridgeBlock[] ): string {
	return JSON.stringify( blocks );
}

/**
 * Creates an intent-log sync manager.
 *
 * @param debug Whether to log debug output.
 * @return Sync manager.
 */
export function createIntentLogManager( debug = false ): SyncManager {
	const entityStates = new Map< string, EntityState >();
	const userId =
		Number(
			( window as { _wpCollaborationUserId?: unknown } )
				._wpCollaborationUserId
		) || 0;

	const log = ( message: string, context: object = {} ) => {
		if ( debug ) {
			// eslint-disable-next-line no-console
			console.log( `[IntentLogManager]: ${ message }`, context );
		}
	};

	const entityKey = ( objectType: ObjectType, objectId: ObjectID | null ) =>
		`${ objectType }_${ objectId }`;

	async function loadEntity(
		syncConfig: SyncConfig,
		objectType: ObjectType,
		objectId: ObjectID,
		record: ObjectData,
		handlers: RecordHandlers
	): Promise< void > {
		const key = entityKey( objectType, objectId );
		if ( entityStates.has( key ) ) {
			return;
		}
		if ( false === syncConfig.shouldSync?.( objectType, objectId ) ) {
			return;
		}
		const providerCreators = getProviderCreators();
		if ( 0 === providerCreators.length ) {
			return;
		}

		const session = createIntentLogSession( { userId } );
		const state: EntityState = {
			session,
			handlers,
			providers: [],
			unloaded: false,
			lastPushedState: null,
			capturing: false,
		};
		entityStates.set( key, state );

		session.onChange( () => {
			if (
				state.unloaded ||
				state.capturing ||
				! session.isInitialized()
			) {
				return;
			}
			const blocks = engineDocumentToBlocks( session.getDocument()! );
			const canonical = canonicalBlocksJson( blocks );
			if ( canonical === state.lastPushedState ) {
				return; // Echo of our own capture; nothing new for the editor.
			}
			state.lastPushedState = canonical;
			handlers.editRecord( { blocks }, { undoIgnore: true } );
		} );

		session.onProposal( ( proposal ) => {
			// Phase 2d surfaces these in UI; for now they must at least be
			// visible and countable.
			// eslint-disable-next-line no-console
			console.warn(
				'[IntentLog] An edit was escalated for review (%s): %o',
				proposal.reason,
				proposal.intent
			);
		} );

		log( 'connecting', { key } );
		state.providers = await Promise.all(
			providerCreators.map( async ( create ) => {
				const provider = await create( {
					objectType,
					objectId,
					session,
				} );
				provider.on( 'status', handlers.onStatusChange );
				return provider;
			} )
		);

		if ( state.unloaded ) {
			state.providers.forEach( ( provider ) => provider.destroy() );
			return;
		}
		void record;
	}

	return {
		load: loadEntity,

		loadCollection: async () => {
			// Collection rooms (post lists, taxonomies) are not part of the
			// intent-log v1 scope; entities cover the editing surface.
		},

		update( objectType, objectId, changes, origin ) {
			const state = entityStates.get( entityKey( objectType, objectId ) );
			if ( ! state || state.unloaded ) {
				return;
			}
			if ( ! state.session.isInitialized() ) {
				return; // Snapshot not yet received; the editor still owns state.
			}
			const blocks = changes.blocks as BridgeBlock[] | undefined;
			if ( ! blocks ) {
				return; // v1: only block content syncs.
			}

			const derived = deriveIntents(
				state.session.getDocument()!,
				blocks
			);
			if ( ! derived ) {
				return;
			}
			if ( derived.coarseBlockCount > 0 ) {
				log( 'coarse capture', {
					origin,
					blocks: derived.coarseBlockCount,
				} );
			}
			state.capturing = true;
			try {
				for ( const intent of derived.intents ) {
					state.session.author( intent.type, intent.payload );
				}
			} finally {
				state.capturing = false;
			}
			// Record the state we just captured so later change events do
			// not bounce it back into the editor.
			state.lastPushedState = canonicalBlocksJson(
				engineDocumentToBlocks( state.session.getDocument()! )
			);
		},

		getAwareness: ( objectType, objectId ) => {
			void entityKey( objectType, objectId );
			// The Yjs Awareness class does not exist here. Peer state is
			// available via the session; the presence UI integration is
			// Phase 2d work.
			return undefined;
		},

		// The server materializes; there is no client-side persisted doc.
		createPersistedCRDTDoc: async () => null,
		getEntitySnapshot: () => undefined,
		entityContainsSnapshot: () => false,

		// Core's default undo manager applies (see module note).
		undoManager: undefined,

		unload( objectType, objectId ) {
			const key = entityKey( objectType, objectId );
			const state = entityStates.get( key );
			if ( ! state ) {
				return;
			}
			state.unloaded = true;
			state.providers.forEach( ( provider ) => provider.destroy() );
			state.session.destroy();
			entityStates.delete( key );
		},

		unloadAll() {
			for ( const [ , state ] of entityStates ) {
				state.unloaded = true;
				state.providers.forEach( ( provider ) => provider.destroy() );
				state.session.destroy();
			}
			entityStates.clear();
		},
	};
}
