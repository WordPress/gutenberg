/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import type { EngineSessionCodec } from './engines/session';
import {
	createYjsSessionCodec,
	type YjsSessionOptions,
} from './engines/yjs-relay';
import { createIntentLogManager } from './engines/intent-log-manager';
import { createSyncManager } from './manager';
import type { SyncManager } from './types';

/**
 * A sync engine adapter: the client half of a server sync engine
 * (WP_Sync_Engine on the PHP side). The adapter owns the MEANING of sync
 * payloads — how local changes become updates and how received updates
 * become entity changes. Transports own the MOVEMENT of updates and are
 * registered separately (see providers/).
 *
 * The server announces which engine a site speaks (window._wpCollaborationSync,
 * enforced per-request with 409 rest_sync_engine_mismatch); the client looks
 * the announced slug up here and refuses to join when it cannot provide it.
 * Swapping engines is therefore a server-side configuration change — clients
 * follow the announcement.
 *
 * Phase note: today an adapter yields the full SyncManager, because the
 * only engine (the Yjs relay) and the manager are one and the same. When a
 * second engine lands, this interface grows a session-level contract and
 * the manager becomes engine-neutral; the registry and handshake below are
 * already engine-count-agnostic.
 */
export interface SyncEngineAdapter {
	/** Engine slug, matching the server engine's slug (e.g. 'yjs-relay'). */
	slug: string;

	/**
	 * Engine protocol version. Must equal the server engine's protocol
	 * version for the client to join. This is the WIRE/semantics version —
	 * distinct from CRDT_DOC_VERSION, which versions the persisted document
	 * schema.
	 */
	protocolVersion: number;

	/** Creates the sync manager implementing this engine. */
	createManager: ( debug?: boolean ) => SyncManager;

	/**
	 * Creates the transport-facing session codec for one entity/room. The
	 * options are engine-specific — the engine's manager calls this, closing
	 * the codec over engine state (for the Yjs relay, a Y.Doc and Awareness)
	 * — so they are typed opaquely here. Transports only ever receive the
	 * engine-generic codec.
	 */
	createSessionCodec?: ( options?: unknown ) => EngineSessionCodec;
}

/**
 * The sync configuration announced by the server, if any.
 */
export interface AnnouncedSync {
	engine: string;
	engineProtocol: number;
	transports: string[];
	transportProtocol: number;
}

/**
 * Slug of the built-in Yjs relay engine. Must match
 * WP_Yjs_Relay_Engine::SLUG on the PHP side.
 */
export const YJS_RELAY_ENGINE_SLUG = 'yjs-relay';

/**
 * Slug of the built-in intent-log engine. Must match
 * WP_Intent_Log_Engine::SLUG on the PHP side.
 */
export const INTENT_LOG_ENGINE_SLUG = 'intent-log';

/**
 * Protocol version of the built-in intent-log engine. Must match
 * WP_Intent_Log_Engine::PROTOCOL_VERSION on the PHP side.
 */
export const INTENT_LOG_ENGINE_PROTOCOL = 1;

/**
 * Protocol version of the built-in Yjs relay engine. Must match
 * WP_Yjs_Relay_Engine::PROTOCOL_VERSION on the PHP side.
 */
export const YJS_RELAY_ENGINE_PROTOCOL = 1;

/**
 * Transport slug of the built-in HTTP short-polling provider.
 */
export const HTTP_POLLING_TRANSPORT_SLUG = 'http-polling';

let engineAdapters: Record< string, SyncEngineAdapter > | null = null;

/**
 * The built-in engine adapters.
 *
 * @return Default adapters, keyed by slug.
 */
function getDefaultEngineAdapters(): SyncEngineAdapter[] {
	return [
		{
			slug: YJS_RELAY_ENGINE_SLUG,
			protocolVersion: YJS_RELAY_ENGINE_PROTOCOL,
			createManager: createSyncManager,
			createSessionCodec: ( options?: unknown ) =>
				createYjsSessionCodec( options as YjsSessionOptions ),
		},
		{
			slug: INTENT_LOG_ENGINE_SLUG,
			protocolVersion: INTENT_LOG_ENGINE_PROTOCOL,
			createManager: createIntentLogManager,
		},
	];
}

/**
 * Type guard for filter return values.
 *
 * @param adapter Candidate adapter.
 * @return Whether the candidate is a usable adapter.
 */
function isEngineAdapter( adapter: unknown ): adapter is SyncEngineAdapter {
	return (
		!! adapter &&
		'object' === typeof adapter &&
		'string' === typeof ( adapter as SyncEngineAdapter ).slug &&
		'number' === typeof ( adapter as SyncEngineAdapter ).protocolVersion &&
		'function' === typeof ( adapter as SyncEngineAdapter ).createManager
	);
}

/**
 * Returns the registered engine adapters, keyed by slug. Plugins may register
 * additional adapters via the `sync.engines` filter.
 *
 * @return Registered adapters by slug.
 */
export function getEngineAdapters(): Record< string, SyncEngineAdapter > {
	if ( engineAdapters ) {
		return engineAdapters;
	}

	/**
	 * Filter the available sync engine adapters.
	 */
	const filtered: unknown = applyFilters(
		'sync.engines',
		getDefaultEngineAdapters()
	);

	engineAdapters = {};
	if ( Array.isArray( filtered ) ) {
		for ( const adapter of filtered ) {
			if ( isEngineAdapter( adapter ) ) {
				engineAdapters[ adapter.slug ] = adapter;
			}
		}
	}

	return engineAdapters;
}

/**
 * Returns the server-announced sync configuration, or null when the server
 * did not announce one (pre-handshake servers).
 *
 * @return Announced configuration, or null.
 */
export function getAnnouncedSync(): AnnouncedSync | null {
	const announced = window._wpCollaborationSync;
	if (
		! announced ||
		'string' !== typeof announced.engine ||
		'number' !== typeof announced.engineProtocol
	) {
		return null;
	}

	return {
		engine: announced.engine,
		engineProtocol: announced.engineProtocol,
		transports: Array.isArray( announced.transports )
			? announced.transports
			: [],
		transportProtocol:
			'number' === typeof announced.transportProtocol
				? announced.transportProtocol
				: 1,
	};
}

/**
 * Resolves the engine adapter for this session from the server announcement.
 *
 * - No announcement (pre-handshake server): the Yjs relay adapter, matching
 *   pre-handshake behavior.
 * - Announced engine registered at the announced protocol version: that
 *   adapter.
 * - Anything else: null — the client must NOT join sync rooms. Callers
 *   surface this as "collaboration unavailable" and WordPress's regular
 *   post locking takes over (the same posture as collaboration disabled).
 *
 * @return The adapter to use, or null on engine mismatch.
 */
export function resolveEngineAdapter(): SyncEngineAdapter | null {
	const adapters = getEngineAdapters();
	const announced = getAnnouncedSync();

	if ( ! announced ) {
		return adapters[ YJS_RELAY_ENGINE_SLUG ] ?? null;
	}

	const adapter = adapters[ announced.engine ];
	if ( ! adapter || adapter.protocolVersion !== announced.engineProtocol ) {
		return null;
	}

	return adapter;
}

/**
 * Resets the adapter cache. Test use only.
 */
export function resetEngineAdaptersForTesting(): void {
	engineAdapters = null;
}
