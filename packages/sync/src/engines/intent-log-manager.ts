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
	type RawContentAdapter,
	type RichTextFieldsResolver,
	type BridgeBlock,
} from './intent-log-bridge';
import {
	createIntentLogSession,
	type IntentLogSession,
} from './intent-log-session';
import { mintSyncId } from './intent-log/sync-id.js';
import { fieldToHtml } from './intent-log/rich-text.js';
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
 * Scope (documented in ARCHITECTURE.md):
 * - Blocks sync through the capture bridge; whitelisted entity properties
 *   (SYNCED_PROPERTIES — currently the title) sync as per-name registers
 *   via set_property intents. Other entity properties (status, …) flow
 *   through WordPress saves as usual.
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
	/**
	 * Last property values pushed to (or captured from) the editor, for
	 * property echo suppression. Seeded from the loaded record so the
	 * genesis snapshot's properties are not re-pushed as edits.
	 */
	lastPushedProps: Record< string, string >;
	/**
	 * Rich-text attribute names per block type (from the entity syncConfig,
	 * backed by the block registry). Names both the fields the bridge
	 * captures and the fields it serializes back into attributes.
	 */
	fieldsResolver: RichTextFieldsResolver;
	rawContent?: RawContentAdapter;
}

/**
 * Entity properties synced as per-name registers (set_property intents).
 * Must be raw strings in both the edited record and the engine document.
 */
const SYNCED_PROPERTIES = [ 'title' ];

/**
 * Reads a synced property from a record or edits object as a raw string.
 * REST records carry title as `{ raw, rendered }`; editor edits carry it as
 * a plain string.
 *
 * @param source Record or edits object.
 * @param name   Property name.
 * @return The raw string value, or undefined.
 */
function rawPropertyValue(
	source: Record< string, unknown >,
	name: string
): string | undefined {
	const value = source[ name ];
	if ( 'string' === typeof value ) {
		return value;
	}
	if (
		value &&
		'object' === typeof value &&
		'string' === typeof ( value as { raw?: unknown } ).raw
	) {
		return ( value as { raw: string } ).raw;
	}
	return undefined;
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
		/*
		 * Seed property echo suppression from the record the editor loaded:
		 * a genesis snapshot whose properties match what the editor already
		 * shows must not be re-pushed as an edit. A ROOM value that differs
		 * (another client changed the title before we joined) still pushes.
		 */
		const initialProps: Record< string, string > = {};
		for ( const name of SYNCED_PROPERTIES ) {
			const value = rawPropertyValue(
				record as Record< string, unknown >,
				name
			);
			if ( undefined !== value ) {
				initialProps[ name ] = value;
			}
		}

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
			lastPushedProps: initialProps,
			fieldsResolver:
				syncConfig.richTextFields ?? ( () => [ 'content' ] ),
			rawContent:
				syncConfig.isRawContentBlock && syncConfig.serializeRawContent
					? {
							is: syncConfig.isRawContentBlock,
							serialize: syncConfig.serializeRawContent,
							hydrate: syncConfig.hydrateRawContent,
					  }
					: undefined,
		};
		entityStates.set( key, state );

		/**
		 * Pushes engine property values the editor has not seen yet.
		 */
		const pushPropertyChanges = () => {
			const doc = session.getDocument();
			if ( ! doc ) {
				return;
			}
			const edits: Record< string, string > = {};
			for ( const name of SYNCED_PROPERTIES ) {
				const value = doc.props?.[ name ];
				if ( 'string' !== typeof value ) {
					continue;
				}
				if ( state.lastPushedProps[ name ] === value ) {
					continue;
				}
				state.lastPushedProps[ name ] = value;
				edits[ name ] = value;
			}
			if ( Object.keys( edits ).length > 0 ) {
				handlers.editRecord( edits, { undoIgnore: true } );
			}
		};

		session.onChange( () => {
			if ( state.unloaded || ! session.isInitialized() ) {
				return;
			}
			const blocks = engineDocumentToBlocks(
				session.getDocument()!,
				state.fieldsResolver,
				state.rawContent
			);
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
			// Entity properties push independently of the block logic below
			// (its early returns must not swallow a title change).
			pushPropertyChanges();
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

		session.onReset( () => {
			/*
			 * Horizon reset: the replica re-bootstrapped from a server
			 * checkpoint and pending intents were dropped. Clear the echo
			 * suppression state so the reset document pushes to the editor,
			 * and clear staleness bookkeeping derived from the old replica.
			 * The editor tree still holds any un-acked local work; the next
			 * capture diffs it against the reset document and re-authors.
			 */
			state.lastPushedState = null;
			state.lastPushedProps = {};
			state.docTombstones.clear();
			state.prevDocIds = new Set();
			log( 'session reset from server checkpoint', { key } );
		} );

		/*
		 * Escalation notices derive from the SETTLED open-proposal list, on
		 * a microtask after the delivery batch: a bootstrap replay delivers
		 * proposal rows before their resolution rows, and notifying on raw
		 * arrival would re-surface long-resolved conflicts on every reload.
		 */
		const notifiedProposalIds = new Set< string >();
		let proposalsNotifyScheduled = false;
		const summarizeProposal = ( proposal: {
			intent: { type: string; payload: Record< string, unknown > };
		} ): string | undefined => {
			const { type, payload } = proposal.intent;
			switch ( type ) {
				case 'insert_text':
				case 'replace_text':
					return payload.text as string;
				case 'replace_attr_content':
					return payload.newText as string;
				case 'delete_text':
					return undefined; // A lost deletion has no content to show.
				case 'set_attr':
					return `${ payload.key as string }: ${ JSON.stringify(
						payload.value
					) }`;
				case 'set_property':
					return `${ payload.name as string }: ${ JSON.stringify(
						payload.value
					) }`;
				case 'format_text':
					return payload.format as string;
				case 'insert_block': {
					// The reviewer must SEE what they would approve —
					// notably a raw-attr block's markup (core/html).
					const block = payload.block as
						| {
								blockType?: string;
								text?: string;
								fields?: {
									content?: { text?: string };
								};
								attrs?: Record< string, unknown >;
						  }
						| undefined;
					const text =
						block?.fields?.content?.text ??
						block?.text ??
						( typeof block?.attrs?.content === 'string'
							? ( block.attrs.content as string )
							: undefined );
					return text
						? `${ block?.blockType ?? 'block' }: ${ text }`
						: block?.blockType;
				}
				default:
					return undefined;
			}
		};
		// A parked new-block proposal (insert_block) has no block in the
		// reviewer's canvas to anchor to. Surface its intended position and
		// a readable content preview so the editor can render it INLINE
		// where it would land, with approve/discard in place.
		const proposedInsertionFor = ( proposal: {
			intent: { type: string; payload: Record< string, unknown > };
		} ) => {
			if ( 'insert_block' !== proposal.intent.type ) {
				return undefined;
			}
			const payload = proposal.intent.payload;
			const block = payload.block as
				| {
						blockType?: string;
						fields?: {
							content?: { text: string; formats?: unknown[] };
						};
						attrs?: Record< string, unknown >;
				  }
				| undefined;
			const field = block?.fields?.content;
			let html = '';
			if ( field ) {
				html = fieldToHtml( field as never );
			} else if ( typeof block?.attrs?.content === 'string' ) {
				html = block.attrs.content as string;
			}
			return {
				blockType: block?.blockType,
				html,
				afterSiblingId:
					typeof payload.afterSiblingId === 'string'
						? payload.afterSiblingId
						: undefined,
				parentId:
					typeof payload.parentId === 'string'
						? payload.parentId
						: undefined,
			};
		};
		const mapReviewItems = () =>
			session.getOpenProposals().map( ( proposal ) => ( {
				id: proposal.intent.intentId,
				unitId: proposal.intent.txnId ?? proposal.intent.intentId,
				isLocal: proposal.actorId === session.actorId,
				actorId: proposal.actorId,
				reason: proposal.reason,
				intentType: proposal.intent.type,
				summary: summarizeProposal( proposal ),
				excerpt: proposal.context?.excerpt,
				targetId:
					typeof proposal.intent.payload.syncId === 'string'
						? proposal.intent.payload.syncId
						: undefined,
				proposedInsertion: proposedInsertionFor( proposal ),
			} ) );
		session.onProposalsChange( () => {
			if ( proposalsNotifyScheduled ) {
				return;
			}
			proposalsNotifyScheduled = true;
			void Promise.resolve().then( () => {
				proposalsNotifyScheduled = false;
				if ( state.unloaded ) {
					return;
				}
				const items = mapReviewItems();
				handlers.onProposalsChange?.( items );
				for ( const item of items ) {
					if ( notifiedProposalIds.has( item.id ) ) {
						continue;
					}
					notifiedProposalIds.add( item.id );
					if ( handlers.onEscalation ) {
						handlers.onEscalation( {
							reason: item.reason,
							isLocal: item.isLocal,
							proposalId: item.id,
							summary: item.summary,
							excerpt: item.excerpt,
						} );
					} else {
						// eslint-disable-next-line no-console
						console.warn(
							'[IntentLog] An edit was escalated for review (%s): %s',
							item.reason,
							item.id
						);
					}
				}
			} );
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

			/*
			 * Entity property capture: an edits object carries a property
			 * only when the editor changed it, so presence IS intent (unlike
			 * block-tree absence). Same-value writes are echoes of our own
			 * push or of the document state and are suppressed.
			 */
			const doc = state.session.getDocument()!;
			for ( const name of SYNCED_PROPERTIES ) {
				if ( ! ( name in changes ) ) {
					continue;
				}
				const value = rawPropertyValue(
					changes as Record< string, unknown >,
					name
				);
				if ( undefined === value || doc.props?.[ name ] === value ) {
					continue;
				}
				state.lastPushedProps[ name ] = value;
				state.capturing = true;
				try {
					state.session.author( 'set_property', {
						name,
						value,
						observedVersion: doc.propVersions?.[ name ] ?? 0,
					} );
				} finally {
					state.capturing = false;
				}
			}

			const blocks = changes.blocks as BridgeBlock[] | undefined;
			if ( ! blocks ) {
				return; // Only whitelisted properties and blocks sync.
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
					richTextFields: state.fieldsResolver,
					rawContent: state.rawContent,
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
				state.session.getDocument()!,
				state.fieldsResolver,
				state.rawContent
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

		resolveProposal( objectType, objectId, proposalId, resolution ) {
			const state = entityStates.get( entityKey( objectType, objectId ) );
			if ( ! state || state.unloaded ) {
				return;
			}
			state.session.resolveProposal( proposalId, resolution );
		},

		restoreProposal( objectType, objectId, proposalId ) {
			const state = entityStates.get( entityKey( objectType, objectId ) );
			if ( ! state || state.unloaded ) {
				return;
			}
			const session = state.session;
			const proposal = session
				.getOpenProposals()
				.find( ( open ) => open.intent.intentId === proposalId );
			if ( ! proposal ) {
				return;
			}
			/*
			 * Best-effort re-author at the current head — restoration is an
			 * ORDINARY edit through the normal planning rules, never a
			 * privileged replay. Text appends to the target field (or a
			 * fresh paragraph when the block is gone); register writes
			 * re-apply at current observed versions. Types with no sensible
			 * auto-restore just resolve; the notice showed the content for
			 * manual recovery.
			 */
			const { type, payload } = proposal.intent;
			const doc = session.getDocument();
			const findBlock = (
				blocks: import('./intent-log/engine-types').EngineBlock[],
				id: string
			): import('./intent-log/engine-types').EngineBlock | null => {
				for ( const block of blocks ) {
					if ( block.syncId === id ) {
						return block;
					}
					const inChildren = findBlock( block.children, id );
					if ( inChildren ) {
						return inChildren;
					}
				}
				return null;
			};
			const restoreText = ( text: string ) => {
				const targetId = payload.syncId as string;
				const field = ( payload.field as string ) ?? 'content';
				const block = doc ? findBlock( doc.root, targetId ) : null;
				if ( block ) {
					const current = block.fields[ field ]?.text ?? '';
					session.author( 'insert_text', {
						syncId: targetId,
						field,
						offset: current.length,
						text,
					} );
				} else {
					session.author( 'insert_block', {
						block: {
							syncId: mintSyncId(),
							blockType: 'core/paragraph',
							text,
						},
						parentId: null,
						afterSiblingId: doc?.root.at( -1 )?.syncId ?? null,
					} );
				}
			};
			let restoredText: string | null = null;
			if ( 'insert_text' === type || 'replace_text' === type ) {
				restoredText = payload.text as string;
			} else if ( 'replace_attr_content' === type ) {
				restoredText = payload.newText as string;
			}
			if ( restoredText ) {
				restoreText( restoredText );
			} else if ( 'set_attr' === type && doc ) {
				const block = findBlock( doc.root, payload.syncId as string );
				if ( block ) {
					session.author( 'set_attr', {
						syncId: payload.syncId as string,
						key: payload.key as string,
						value: payload.value,
						observedVersion:
							block.attrVersions[ payload.key as string ] ?? 0,
					} );
				}
			} else if ( 'set_property' === type && doc ) {
				session.author( 'set_property', {
					name: payload.name as string,
					value: payload.value,
					observedVersion:
						doc.propVersions?.[ payload.name as string ] ?? 0,
				} );
			} else if ( 'insert_block' === type && doc ) {
				/*
				 * Re-insert the parked block spec under FRESH identities
				 * (the original insert never applied; reminting sidesteps
				 * any duplicate/tombstone history). Anchors degrade: a
				 * vanished parent falls back to the root, a vanished
				 * sibling to the end. This is what makes restoring a
				 * requires-approval block an approval — the re-authored
				 * intent carries the RESTORER's capability.
				 */
				type SpecShape = {
					syncId: string;
					children?: SpecShape[];
					[ key: string ]: unknown;
				};
				const remint = ( spec: SpecShape ): SpecShape => ( {
					...spec,
					syncId: mintSyncId(),
					children: ( spec.children ?? [] ).map( remint ),
				} );
				const parentId =
					typeof payload.parentId === 'string' &&
					findBlock( doc.root, payload.parentId )
						? ( payload.parentId as string )
						: null;
				const afterSiblingId =
					typeof payload.afterSiblingId === 'string' &&
					findBlock( doc.root, payload.afterSiblingId )
						? ( payload.afterSiblingId as string )
						: ( ! parentId && doc.root.at( -1 )?.syncId ) || null;
				session.author( 'insert_block', {
					block: remint( payload.block as SpecShape ),
					parentId,
					afterSiblingId,
				} );
			}
			session.resolveProposal( proposalId, 'restored' );
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
