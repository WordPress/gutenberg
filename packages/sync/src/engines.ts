import { applyFilters } from '@wordpress/hooks';
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
 */
export interface SyncEngineAdapter {
	/** Engine slug, matching the server engine's slug (e.g. 'yjs-relay'). */
	slug: string;

	/**
	 * Engine protocol version. Must equal the server engine's protocol
	 * version for the client to join. This is the WIRE/semantics version —
	 * distinct from any persisted-document schema version an engine may
	 * maintain internally.
	 */
	protocolVersion: number;

	/**
	 * Creates the sync manager implementing this engine. Adapters compose the
	 * engine-neutral `createSyncManager( engine, { debug } )` with their own
	 * `SyncEngine`; the engine owns the transport-facing session codec, so
	 * transports only ever receive the engine-generic codec.
	 */
	createManager: ( debug?: boolean ) => SyncManager;
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

/*
 * Memoized adapter registry: the merged view of the `sync.engines` filter
 * and imperative `registerSyncEngine` registrations, keyed by slug.
 * Invalidated whenever a new adapter registers.
 */
let engineAdapters: Record< string, SyncEngineAdapter > | null = null;

/**
 * Engine adapters registered imperatively through the private API
 * `registerSyncEngine` (used by the engines plugin). Kept separate from the
 * `sync.engines` filter so plugins can register from module side effects.
 */
const registeredEngineAdapters: SyncEngineAdapter[] = [];

/**
 * Registers a sync engine adapter (private API). Later registration of a slug
 * wins. Invalidates the adapter cache so the next resolution sees it.
 *
 * @param adapter Engine adapter.
 */
export function registerSyncEngine( adapter: SyncEngineAdapter ): void {
	if ( isEngineAdapter( adapter ) ) {
		registeredEngineAdapters.push( adapter );
		engineAdapters = null;
	}
}

/**
 * The built-in engine adapters.
 *
 * @return Default adapters, keyed by slug.
 */
function getDefaultEngineAdapters(): SyncEngineAdapter[] {
	// The framework ships NO built-in engines. Both the Yjs relay and the
	// intent-log engine live in the Gutenberg Sync Engines plugin, which
	// registers them through `registerSyncEngine`. Without that plugin the
	// registry is empty and RTC stays disabled (the server announces no engine
	// and the client resolves none).
	return [];
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
	 * Filter the available sync engine adapters. The base list is the
	 * built-ins plus any registered imperatively via `registerSyncEngine`.
	 */
	const filtered: unknown = applyFilters( 'sync.engines', [
		...getDefaultEngineAdapters(),
		...registeredEngineAdapters,
	] );

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
 * - No announcement (collaboration disabled, or a server with no engine
 *   registered): null — no engine to speak.
 * - Announced engine registered at the announced protocol version: that
 *   adapter.
 * - Anything else: null — the client must NOT join sync rooms. Callers
 *   surface this as "collaboration unavailable" and WordPress's regular
 *   post locking takes over (the same posture as collaboration disabled).
 *
 * The framework registers no engines itself; adapters come from an engine
 * plugin via `registerSyncEngine`. Without one, this always returns null.
 *
 * @return The adapter to use, or null on engine mismatch.
 */
export function resolveEngineAdapter(): SyncEngineAdapter | null {
	const announced = getAnnouncedSync();

	if ( ! announced ) {
		return null;
	}

	const adapters = getEngineAdapters();
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
	registeredEngineAdapters.length = 0;
}
