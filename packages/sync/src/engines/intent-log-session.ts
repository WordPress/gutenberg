/**
 * Internal dependencies
 */
import {
	authorIntent,
	clientReceive,
	createClient,
	predictedDisposition,
} from './intent-log/client.js';
import { createIntent } from './intent-log/intents.js';
import type {
	EngineDocument,
	IntentDisposition,
	IntentEnvelope,
} from './intent-log/engine-types';
import { applyServerAwarenessStates } from './awareness-sync';
import type {
	AwarenessState,
	EngineDisposition,
	EngineSessionCodec,
	EngineLocalUpdateListener,
	EngineUpdate,
	LocalAwarenessState,
} from './session';

/*
 * The intent-log engine's client half behind the transport-facing
 * EngineSessionCodec seam — the counterpart of WP_Intent_Log_Engine on the
 * server. This file lives OUTSIDE the tsc-excluded engine-core directory so
 * it is fully type-checked; the core's surface is typed by hand-written
 * declaration files (engine-types.d.ts and siblings).
 *
 * Wire protocol (see the server class for authority):
 * - receive `snapshot` → bootstrap the local replica from the genesis doc;
 * - receive `intent`   → append the server's authoritative (transformed)
 *   form to the replica's log copy, replanning pending work over it;
 * - receive `proposal` → record an escalated intent for the review lane;
 * - receive `voided`   → informational marker (the ack path settles ours);
 * - send `intent` rows authored locally, optimistically applied;
 * - `dispositions` in the poll response are the ack, delivered AFTER the
 *   same response's rows (the transport guarantees this ordering): rows
 *   already settle what they supersede — an accepted intent's
 *   authoritative form, an escalation's proposal — so the ack covers the
 *   remainder and the document never regresses mid-response.
 *
 * Sessions surface documents/dispositions/proposals through callbacks; the
 * entity bridge (Phase 2c) subscribes to them. Until then the extended
 * surface doubles as the dev/test API.
 */

/**
 * Slug of the intent-log engine. Must match WP_Intent_Log_Engine::SLUG on the
 * PHP side. Defined here (rather than in engines.ts, which re-exports it) so
 * the codec can stamp its own identity without an import cycle.
 */
export const INTENT_LOG_ENGINE_SLUG = 'intent-log';

/**
 * Protocol version of the intent-log engine. Must match
 * WP_Intent_Log_Engine::PROTOCOL_VERSION on the PHP side.
 */
export const INTENT_LOG_ENGINE_PROTOCOL = 1;

/**
 * Wire kinds, matching WP_Intent_Log_Engine::UPDATE_TYPE_*.
 */
export const INTENT_LOG_UPDATE_TYPES = {
	INTENT: 'intent',
	PROPOSAL: 'proposal',
	RESOLVED: 'resolved',
	SNAPSHOT: 'snapshot',
	VOIDED: 'voided',
} as const;

/**
 * An escalated intent parked in the proposal lane, as received. The engine
 * enriches rows with the settlement seq, a server timestamp, and a short
 * excerpt of the target field at escalation time (context for review).
 */
export interface IntentLogProposal {
	intent: IntentEnvelope;
	actorId: string;
	reason: string;
	at?: number;
	time?: number;
	context?: { excerpt?: string };
}

/** A proposal's terminal state, as received. */
export interface IntentLogResolution {
	proposalId: string;
	resolution: 'restored' | 'dismissed';
	resolvedBy?: string;
	time?: number;
}

/**
 * A settled outcome surfaced to disposition listeners, joined with the
 * planner's local prediction when one existed.
 */
export interface SettledDisposition extends EngineDisposition {
	predicted?: IntentDisposition | null;
}

export interface IntentLogSessionOptions {
	/** WordPress user id (the authenticated half of the actor id). */
	userId: number;

	/** Per-tab client id; minted when omitted. */
	clientId?: number;

	/**
	 * Presence surface (a y-protocols Awareness instance, constructed over a
	 * stub doc — see createAwarenessDoc). When provided, local awareness is
	 * read from it and server states are applied onto it, so the editor's
	 * collaborator UI works; when omitted, awareness passes through plain
	 * objects (tests, headless use).
	 */
	awareness?: import('y-protocols/awareness').Awareness;
}

/** Origin tag for awareness removals applied by this session. */
const INTENT_LOG_SESSION_ORIGIN = 'intent-log-session';

/**
 * The intent-log session: EngineSessionCodec toward the transport, plus the
 * document/intent surface the entity bridge consumes.
 */
export interface IntentLogSession extends EngineSessionCodec {
	/** The server-verifiable actor id this session authors as. */
	actorId: string;

	/**
	 * Authors one intent against the optimistic document, applies it
	 * locally, and queues it for the transport. Throws before the snapshot
	 * arrives (there is no document to author against).
	 */
	author: (
		type: string,
		payload: Record< string, unknown >,
		options?: { txnId?: string }
	) => IntentEnvelope;

	/** The optimistic document (acked + pending), or null pre-snapshot. */
	getDocument: () => EngineDocument | null;

	/** The acked document, or null pre-snapshot. */
	getBaseDocument: () => EngineDocument | null;

	/** Escalated intents received for this room, in arrival order. */
	getProposals: () => IntentLogProposal[];

	/**
	 * Escalated intents not yet resolved (arrival order): the review list.
	 * Reconstructs entirely from retained rows — no client persistence.
	 */
	getOpenProposals: () => IntentLogProposal[];

	/**
	 * Sends a resolution for a parked proposal. `restored` callers author
	 * the recovered content as ordinary intents FIRST — restoration is a
	 * normal edit; this only closes the proposal. Idempotent server-side.
	 */
	resolveProposal: (
		proposalId: string,
		resolution: 'restored' | 'dismissed'
	) => void;

	/** Subscribes to review-list changes (proposal arrived or resolved). */
	onProposalsChange: ( listener: () => void ) => void;

	/** Number of authored intents not yet settled by the server. */
	getPendingCount: () => number;

	/** The engine log position this session has observed (intent rows). */
	getSeq: () => number;

	/** Whether the genesis snapshot has arrived. */
	isInitialized: () => boolean;

	/** Latest remote awareness states, keyed by client id. */
	getPeers: () => AwarenessState;

	/** Sets the local awareness state sent with each poll. */
	setLocalAwareness: ( state: LocalAwarenessState ) => void;

	/** Subscribes to document changes (local or remote). */
	onChange: ( listener: () => void ) => void;

	/** Subscribes to settled dispositions (the server's acks). */
	onDisposition: (
		listener: ( settled: SettledDisposition ) => void
	) => void;

	/** Subscribes to arriving proposals (escalations, any author). */
	onProposal: ( listener: ( proposal: IntentLogProposal ) => void ) => void;

	/**
	 * Subscribes to horizon resets: the server compacted history this
	 * replica never observed and re-bootstrapped it from a checkpoint.
	 * Pending unacked intents are dropped (their offsets reference trimmed
	 * history); the bridge re-derives them from the editor tree on the next
	 * capture.
	 */
	onReset: ( listener: () => void ) => void;
}

/**
 * Creates an intent-log session codec.
 *
 * @param options Session options.
 * @return The session.
 */
export function createIntentLogSession(
	options: IntentLogSessionOptions
): IntentLogSession {
	const clientId =
		options.clientId ?? Math.floor( Math.random() * ( 2 ** 31 - 1 ) ) + 1;
	const actorId = `u${ options.userId }c${ clientId }`;

	let replica: ReturnType< typeof createClient > | null = null;
	let localUpdateListener: EngineLocalUpdateListener | null = null;
	let localAwareness: LocalAwarenessState = {};
	let peers: AwarenessState = {};
	const proposals: IntentLogProposal[] = [];
	const resolvedIds = new Set< string >();
	const proposalsChangeListeners = new Set< () => void >();
	const notifyProposalsChange = () => {
		proposalsChangeListeners.forEach( ( listener ) => listener() );
	};
	const changeListeners = new Set< () => void >();
	const dispositionListeners = new Set<
		( settled: SettledDisposition ) => void
	>();
	const proposalListeners = new Set<
		( proposal: IntentLogProposal ) => void
	>();
	const resetListeners = new Set< () => void >();

	const notifyChange = () => {
		changeListeners.forEach( ( listener ) => listener() );
	};

	/**
	 * Removes a settled intent from the pending outbox. The replica's
	 * predictions rebuild on the next replan; removal just stops the intent
	 * from being replanned as pending.
	 *
	 * @param intentId Intent id to settle.
	 * @return Whether the intent was pending.
	 */
	const settlePending = ( intentId: string ): boolean => {
		if ( ! replica ) {
			return false;
		}
		const before = replica.outbox.length;
		replica.outbox = replica.outbox.filter(
			( intent ) => intent.intentId !== intentId
		);
		return replica.outbox.length !== before;
	};

	return {
		actorId,
		clientId,
		engineSlug: INTENT_LOG_ENGINE_SLUG,
		engineProtocol: INTENT_LOG_ENGINE_PROTOCOL,

		// ---- EngineSessionCodec (transport-facing) ----

		getInitialUpdates: () => {
			// Nothing to announce: the server pushes the snapshot row.
			return [];
		},

		receiveUpdate: ( update: EngineUpdate ): void => {
			const decoded = JSON.parse( update.data );
			switch ( update.type ) {
				case INTENT_LOG_UPDATE_TYPES.SNAPSHOT: {
					const snapshotSeq = ( decoded.seq as number ) ?? 0;
					if ( ! replica ) {
						// First snapshot wins; genesis carries seq 0 and a
						// compaction checkpoint carries its engine seq.
						replica = createClient(
							actorId,
							decoded.doc as EngineDocument,
							snapshotSeq
						);
						notifyChange();
						return;
					}
					if ( snapshotSeq > replica.cursor ) {
						/*
						 * Horizon reset: the server trimmed history between
						 * our cursor and this checkpoint — one-sided
						 * transforms over the gap are impossible, so the
						 * replica re-bootstraps. Pending intents are
						 * dropped; the manager re-captures the editor tree
						 * against the reset document, re-deriving any
						 * unacked local work.
						 */
						replica = createClient(
							actorId,
							decoded.doc as EngineDocument,
							snapshotSeq
						);
						resetListeners.forEach( ( listener ) => listener() );
						notifyChange();
					}
					// Stale/duplicate snapshots (seq <= cursor) are ignored
					// (mirrors the server's first-snapshot-wins genesis).
					return;
				}
				case INTENT_LOG_UPDATE_TYPES.INTENT: {
					if ( ! replica ) {
						throw new Error(
							'Received an intent before the room snapshot.'
						);
					}
					const intent = decoded as IntentEnvelope;
					/*
					 * Normally our own accepted intents were settled by the
					 * dispositions ack in the same response. If that ack was
					 * lost (reconnect), settle here so the pending original
					 * and its authoritative form never coexist.
					 */
					settlePending( intent.intentId );
					clientReceive( replica, [ intent ], replica.cursor );
					notifyChange();
					return;
				}
				case INTENT_LOG_UPDATE_TYPES.PROPOSAL: {
					const proposal = decoded as IntentLogProposal;
					settlePending( proposal.intent.intentId );
					proposals.push( proposal );
					proposalListeners.forEach( ( listener ) =>
						listener( proposal )
					);
					notifyProposalsChange();
					notifyChange();
					return;
				}
				case INTENT_LOG_UPDATE_TYPES.RESOLVED: {
					const resolution = decoded as IntentLogResolution;
					if ( ! resolvedIds.has( resolution.proposalId ) ) {
						resolvedIds.add( resolution.proposalId );
						notifyProposalsChange();
					}
					return;
				}
				case INTENT_LOG_UPDATE_TYPES.VOIDED: {
					// Another client's voided marker (ours settle through
					// the ack); relevant only on ack loss.
					settlePending( decoded.intentId );
					return;
				}
				default:
					throw new Error(
						`Unknown intent-log update type: ${ update.type }`
					);
			}
		},

		receiveDispositions: ( dispositions: EngineDisposition[] ) => {
			for ( const disposition of dispositions ) {
				/*
				 * Best-effort: the row-processing that precedes this ack
				 * usually settled the intent already (predicted is then
				 * null). Prediction parity as an INVARIANT only holds for
				 * caught-up clients and is asserted by the engine's
				 * simulator, not here — a client that authored while behind
				 * the log can mispredict legitimately.
				 */
				const predicted = replica
					? predictedDisposition( replica, disposition.intentId )
					: null;
				settlePending( disposition.intentId );
				dispositionListeners.forEach( ( listener ) =>
					listener( { ...disposition, predicted } )
				);
			}
			notifyChange();
		},

		getLocalAwareness: () =>
			options.awareness
				? options.awareness.getLocalState() ?? {}
				: localAwareness,

		applyRemoteAwareness: ( state: AwarenessState ) => {
			peers = state;
			if ( options.awareness ) {
				applyServerAwarenessStates(
					state,
					options.awareness,
					INTENT_LOG_SESSION_ORIGIN
				);
			}
		},

		createCompactionUpdate: (): EngineUpdate => {
			// The server never nominates intent-log clients to compact
			// (should_compact is always false); snapshotting is a server
			// concern for this engine.
			throw new Error(
				'Intent-log sessions do not compact client-side.'
			);
		},

		createCompactionFromUpdates: (): EngineUpdate => {
			throw new Error(
				'Intent-log sessions do not compact client-side.'
			);
		},

		onLocalUpdate: ( listener: EngineLocalUpdateListener ) => {
			localUpdateListener = listener;
		},

		destroy: () => {
			localUpdateListener = null;
			changeListeners.clear();
			dispositionListeners.clear();
			proposalListeners.clear();
			resetListeners.clear();
			proposalsChangeListeners.clear();
		},

		// ---- Bridge/dev surface ----

		author: ( type, payload, authorOptions = {} ) => {
			if ( ! replica ) {
				throw new Error(
					'Cannot author intents before the room snapshot arrives.'
				);
			}
			const intent = createIntent( type, payload, {
				actorId,
				baseSeq: replica.cursor,
				txnId: authorOptions.txnId,
			} );
			authorIntent( replica, intent );
			const data = JSON.stringify( intent );
			if ( localUpdateListener ) {
				localUpdateListener(
					{ data, type: INTENT_LOG_UPDATE_TYPES.INTENT },
					new TextEncoder().encode( data ).length
				);
			}
			notifyChange();
			return intent;
		},

		getDocument: () => replica?.doc ?? null,
		getBaseDocument: () => replica?.baseDoc ?? null,
		getProposals: () => [ ...proposals ],
		getOpenProposals: () =>
			proposals.filter(
				( proposal ) => ! resolvedIds.has( proposal.intent.intentId )
			),
		resolveProposal: ( proposalId, resolution ) => {
			const data = JSON.stringify( { proposalId, resolution } );
			if ( localUpdateListener ) {
				localUpdateListener(
					{ data, type: INTENT_LOG_UPDATE_TYPES.RESOLVED },
					new TextEncoder().encode( data ).length
				);
			}
			// Optimistic: the list shrinks immediately; the relayed row (or
			// the idempotent ack) confirms.
			if ( ! resolvedIds.has( proposalId ) ) {
				resolvedIds.add( proposalId );
				notifyProposalsChange();
			}
		},
		onProposalsChange: ( listener ) => {
			proposalsChangeListeners.add( listener );
		},
		getPendingCount: () => replica?.outbox.length ?? 0,
		getSeq: () => replica?.cursor ?? 0,
		isInitialized: () => null !== replica,
		getPeers: () => peers,
		setLocalAwareness: ( state: LocalAwarenessState ) => {
			localAwareness = state;
		},
		onChange: ( listener ) => {
			changeListeners.add( listener );
		},
		onDisposition: ( listener ) => {
			dispositionListeners.add( listener );
		},
		onProposal: ( listener ) => {
			proposalListeners.add( listener );
		},
		onReset: ( listener ) => {
			resetListeners.add( listener );
		},
	};
}
