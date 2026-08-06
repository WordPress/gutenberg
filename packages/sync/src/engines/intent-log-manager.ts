/**
 * Internal dependencies
 */
/**
 * External dependencies
 */
import type { Awareness } from 'y-protocols/awareness';

/**
 * Internal dependencies
 */
import { createAwarenessDoc } from './awareness-sync';
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
	/** Presence surface for the collaborator UI (see getAwareness). */
	awareness?: Awareness;
	/**
	 * Stable clientId per syncId for blocks pushed to the editor. The
	 * block-editor store keys blocks by clientId; pushing without one makes
	 * the canvas silently drop the tree (debug bundles) or remount blocks
	 * on every push (losing selection). Stability across pushes lets React
	 * reconcile in place.
	 */
	clientIds: Map< string, string >;
	/** Monotonic push counter, guarding delayed re-push staleness. */
	pushSeq: number;
	/** Canonical form of the last state pushed to (or from) the editor. */
	lastPushedState: string | null;
	/**
	 * Whether update() is currently authoring captured intents. The
	 * session emits change events synchronously per authored intent;
	 * those are the editor's own state and must not bounce back.
	 */
	capturing: boolean;
	/**
	 * Ids the editor has actually displayed (last agreed view). Only these
	 * may be DELETED by a capture diff: a document block missing from the
	 * editor tree but never displayed is staleness, not a deletion.
	 */
	editorIds: Set< string > | null;
	/** Document ids as of the previous session change (tombstone diffing). */
	prevDocIds: Set< string >;
	/**
	 * Ids removed from the document by remote intents. A stale editor tree
	 * still showing them must not resurrect them.
	 */
	docTombstones: Set< string >;
}

/**
 * Collects all syncIds in a bridge block tree (metadata.syncId).
 *
 * @param blocks Bridge blocks.
 * @param into   Accumulator.
 * @return The accumulator.
 */
function collectBlockIds(
	blocks: BridgeBlock[],
	into: Set< string > = new Set()
): Set< string > {
	for ( const block of blocks ) {
		const metadata = block.attributes?.metadata as
			| { syncId?: string }
			| undefined;
		if ( metadata?.syncId ) {
			into.add( metadata.syncId );
		}
		collectBlockIds( block.innerBlocks, into );
	}
	return into;
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
 * A bridge block extended with the editor-required clientId.
 */
type EditorBlock = BridgeBlock & {
	clientId: string;
	isValid: boolean;
	innerBlocks: EditorBlock[];
};

/**
 * Assigns stable clientIds (keyed by syncId) to a bridge block tree so the
 * block-editor store accepts and reconciles it.
 *
 * @param blocks    Bridge blocks (syncId present in metadata).
 * @param clientIds syncId → clientId map (grown as needed).
 * @return Editor-ready blocks.
 */
function toEditorBlocks(
	blocks: BridgeBlock[],
	clientIds: Map< string, string >
): EditorBlock[] {
	return blocks.map( ( block ) => {
		const syncId = ( block.attributes?.metadata as { syncId?: string } )
			?.syncId;
		let clientId = syncId ? clientIds.get( syncId ) : undefined;
		if ( ! clientId ) {
			clientId = globalThis.crypto.randomUUID();
			if ( syncId ) {
				clientIds.set( syncId, clientId );
			}
		}
		return {
			...block,
			clientId,
			isValid: true,
			innerBlocks: toEditorBlocks( block.innerBlocks, clientIds ),
		};
	} );
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

		/*
		 * The presence surface: the entity's syncConfig constructs the typed
		 * Awareness (e.g. PostEditorAwareness with collaborator info and
		 * selection tracking). The y-protocols Awareness base only reads
		 * `clientID` (and a destroy listener) from its doc argument, so a
		 * stub suffices — presence is transport data, engine-independent.
		 */
		const clientId = Math.floor( Math.random() * ( 2 ** 31 - 1 ) ) + 1;
		const awareness = syncConfig.createAwareness?.(
			createAwarenessDoc( clientId ) as never,
			objectId
		);
		const session = createIntentLogSession( {
			userId,
			clientId,
			awareness,
		} );
		const state: EntityState = {
			session,
			awareness,
			handlers,
			providers: [],
			unloaded: false,
			lastPushedState: null,
			capturing: false,
			editorIds: null,
			prevDocIds: new Set(),
			docTombstones: new Set(),
			clientIds: new Map(),
			pushSeq: 0,
		};
		entityStates.set( key, state );

		session.onChange( () => {
			if ( state.unloaded || ! session.isInitialized() ) {
				return;
			}
			const blocks = engineDocumentToBlocks( session.getDocument()! );
			const docIds = collectBlockIds( blocks );
			/*
			 * Tombstone maintenance: ids that left the document through
			 * REMOTE intents (own authorship is under the capturing guard)
			 * must not be resurrected by a stale editor tree. Reappearing
			 * ids clear their tombstone.
			 */
			if ( ! state.capturing ) {
				for ( const id of state.prevDocIds ) {
					if ( ! docIds.has( id ) ) {
						state.docTombstones.add( id );
					}
				}
			}
			for ( const id of docIds ) {
				state.docTombstones.delete( id );
			}
			state.prevDocIds = docIds;

			if ( state.capturing ) {
				return;
			}
			/*
			 * Never push an EMPTY shared document over a live editor as the
			 * first push (fresh post: the genesis is empty while the user
			 * may already be typing). The first capture seeds the document
			 * instead.
			 */
			if ( 0 === blocks.length && null === state.lastPushedState ) {
				return;
			}
			const canonical = canonicalBlocksJson( blocks );
			if ( canonical === state.lastPushedState ) {
				return; // Echo of our own capture; nothing new for the editor.
			}
			state.lastPushedState = canonical;
			/*
			 * Deliberately NOT marking the pushed ids as editor-displayed:
			 * a push only proves we dispatched, not that the editor
			 * rendered it. Ids become removable when the editor itself
			 * hands us a tree containing them (its echo of this push).
			 */
			handlers.editRecord(
				{ blocks: toEditorBlocks( blocks, state.clientIds ) },
				{ undoIgnore: true }
			);
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

			/*
			 * The incoming tree is the editor's own testimony about what it
			 * displays: every id it carries becomes removable from now on.
			 * (A push becomes removable when its echo arrives here.)
			 */
			const treeIds = collectBlockIds( blocks );
			if ( null === state.editorIds ) {
				state.editorIds = new Set();
			}
			for ( const id of treeIds ) {
				state.editorIds.add( id );
			}

			const derived = deriveIntents(
				state.session.getDocument()!,
				blocks,
				{
					// Only blocks the editor has displayed may be deleted
					// by its tree's absence; never-seen blocks are retained.
					removableIds: state.editorIds,
					// Remotely removed blocks in a stale tree are not
					// resurrected.
					excludeIds: state.docTombstones,
				}
			);
			if ( ! derived ) {
				return;
			}
			// Id-less blocks in the tree confirm their adopted/minted ids.
			const confirmIds = ( specs: typeof derived.specs ) => {
				for ( const spec of specs ) {
					state.editorIds!.add( spec.syncId as string );
					confirmIds(
						( spec.children as typeof derived.specs ) ?? []
					);
				}
			};
			confirmIds( derived.specs );
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
			const captured = engineDocumentToBlocks(
				state.session.getDocument()!
			);
			const capturedJson = canonicalBlocksJson( captured );
			state.prevDocIds = collectBlockIds( captured );

			/*
			 * Push the editor forward when its tree was behind the shared
			 * document: missing identities (freshly parsed or new blocks
			 * needing their adopted/minted ids — the churn bug), retained
			 * never-displayed remote blocks, or blocks dropped because a
			 * remote deletion outranked the stale tree.
			 */
			const editorHadAllIds = blocks.every( function hasId(
				block: BridgeBlock
			): boolean {
				const metadata = block.attributes?.metadata as
					| { syncId?: string }
					| undefined;
				return !! metadata?.syncId && block.innerBlocks.every( hasId );
			} );
			const treeHasTombstoned = [ ...treeIds ].some( ( id ) =>
				state.docTombstones.has( id )
			);
			/*
			 * Identity remapping also counts as "behind": when adoption
			 * resolved a tree id onto a different document identity (or
			 * minted one), the editor must receive the document's
			 * authoritative ids — the document is the identity authority,
			 * and saved content must carry ITS ids, identical across all
			 * peers, for identity to be durable across sessions.
			 */
			const specIdSet = new Set< string >();
			const collectFromSpecs = ( specs: typeof derived.specs ) => {
				for ( const spec of specs ) {
					specIdSet.add( spec.syncId as string );
					collectFromSpecs(
						( spec.children as typeof derived.specs ) ?? []
					);
				}
			};
			collectFromSpecs( derived.specs );
			const idsRemapped = [ ...specIdSet ].some(
				( id ) => ! treeIds.has( id )
			);
			const editorIsBehind =
				! editorHadAllIds ||
				derived.retainedIds.size > 0 ||
				treeHasTombstoned ||
				idsRemapped;
			if ( editorIsBehind && capturedJson !== state.lastPushedState ) {
				state.handlers.editRecord(
					{ blocks: toEditorBlocks( captured, state.clientIds ) },
					{ undoIgnore: true }
				);
				/*
				 * The push can lose a race with the editor's own in-flight
				 * echo (its tree overwrites the record after us). While the
				 * user keeps typing, the next capture re-pushes — but the
				 * LAST capture of a burst has no successor, leaving the
				 * tree's identity metadata stale until the next
				 * interaction. One delayed re-dispatch of the same state
				 * closes that window; if the first push stuck, the repeat
				 * is a no-op for the editor.
				 */
				const pushSeq = ++state.pushSeq;
				setTimeout( () => {
					if (
						! state.unloaded &&
						pushSeq === state.pushSeq &&
						capturedJson === state.lastPushedState
					) {
						state.handlers.editRecord(
							{
								blocks: toEditorBlocks(
									captured,
									state.clientIds
								),
							},
							{ undoIgnore: true }
						);
					}
				}, 1200 );
			}
			state.lastPushedState = capturedJson;
		},

		getAwareness: < State extends Awareness >(
			objectType: ObjectType,
			objectId: ObjectID | null
		) => {
			return entityStates.get( entityKey( objectType, objectId ) )
				?.awareness as State | undefined;
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
			state.awareness?.destroy();
			state.session.destroy();
			entityStates.delete( key );
		},

		unloadAll() {
			for ( const [ , state ] of entityStates ) {
				state.unloaded = true;
				state.providers.forEach( ( provider ) => provider.destroy() );
				state.awareness?.destroy();
				state.session.destroy();
			}
			entityStates.clear();
		},
	};
}
