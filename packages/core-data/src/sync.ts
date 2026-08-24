import {
	privateApis as syncPrivateApis,
	type SyncManager,
} from '@wordpress/sync';
import { unlock } from './lock-unlock';

const {
	ConnectionErrorCode,
	Delta,
	CRDT_DOC_META_PERSISTENCE_KEY,
	CRDT_RECORD_MAP_KEY,
	LOCAL_EDITOR_ORIGIN,
	LOCAL_UNDO_IGNORED_ORIGIN,
	resolveEngineAdapter,
} = unlock( syncPrivateApis );

export {
	ConnectionErrorCode,
	Delta,
	CRDT_DOC_META_PERSISTENCE_KEY,
	CRDT_RECORD_MAP_KEY,
	LOCAL_EDITOR_ORIGIN,
	LOCAL_UNDO_IGNORED_ORIGIN,
};

/**
 * Key under which an autosave records the CRDT snapshot describing its
 * content. Used both as the REST autosave request parameter and as the key in
 * the local (sessionStorage) autosave backup.
 *
 * This string must match CRDT_SNAPSHOT_PARAM in
 * Gutenberg_REST_Autosaves_Controller on the PHP side.
 */
export const CRDT_AUTOSAVE_SNAPSHOT_KEY = 'crdt_snapshot';

let syncManager: SyncManager;
let engineMismatchWarned = false;
let engineUnavailable = false;

export function getSyncManager(): SyncManager | undefined {
	if ( syncManager ) {
		return syncManager;
	}

	if ( ! globalThis.window?.__experimentalEnableRealTimeCollaboration ) {
		return undefined;
	}

	/*
	 * Engine handshake: the server announces the sync engine it speaks
	 * (window._wpCollaborationSync) and enforces it per-request with a 409.
	 * When this client cannot provide the announced engine at the announced
	 * protocol version, do not create a sync manager at all — entity syncing
	 * stays off. Callers observe this via isSyncEngineUnavailable() and must
	 * flip collaborationSupported so WordPress's regular post locking
	 * re-engages (without that flip the degraded state would be no sync AND
	 * no lock: concurrent editors silently overwrite each other on save).
	 */
	const adapter = resolveEngineAdapter();
	if ( ! adapter ) {
		engineUnavailable = true;
		if ( ! engineMismatchWarned ) {
			engineMismatchWarned = true;
			// eslint-disable-next-line no-console
			console.warn(
				'Real-time collaboration is unavailable: this client does not support the sync engine announced by the server. Falling back to exclusive post locking.'
			);
		}
		return undefined;
	}

	syncManager = adapter.createManager();

	return syncManager;
}

/**
 * Whether sync is unavailable because the server announced an engine this
 * client cannot provide (as opposed to collaboration simply being disabled).
 * Only meaningful after a getSyncManager() call attempted resolution.
 */
export function isSyncEngineUnavailable(): boolean {
	return engineUnavailable;
}

/**
 * Return whether a sync manager has already been created. Use this when you
 * only want to interact with an existing sync manager (e.g. to tear it down),
 * without `getSyncManager()` bootstrapping one if none exists.
 */
export function hasSyncManager(): boolean {
	return Boolean( syncManager );
}

/**
 * Retry the active sync connection after a connection error (wired to the
 * editor's connection-error modal). Transport-agnostic: it delegates to the
 * active manager, which asks its live providers to retry — no reaching into a
 * specific transport. A no-op when no manager exists (collaboration disabled or
 * the announced engine is unavailable).
 */
export function retrySyncConnection(): void {
	if ( ! hasSyncManager() ) {
		return;
	}
	getSyncManager()?.retry?.();
}

/**
 * Encode a synced entity's current CRDT state as a snapshot. Returns undefined
 * when the entity is not being synced.
 *
 * @param {string}        kind     Entity kind.
 * @param {string}        name     Entity name.
 * @param {string|number} recordId Record ID.
 * @return {string|undefined} Base64-encoded snapshot.
 */
export function getEntitySnapshot(
	kind: string,
	name: string,
	recordId: string | number
): string | undefined {
	if ( ! hasSyncManager() ) {
		return undefined;
	}

	return getSyncManager()?.getEntitySnapshot(
		`${ kind }/${ name }`,
		`${ recordId }`
	);
}

/**
 * Determine whether a synced entity's CRDT document contains everything the
 * given snapshot describes. Returns false when the entity is not being synced
 * or the snapshot cannot be decoded, so callers fail open.
 *
 * @param {string}        kind            Entity kind.
 * @param {string}        name            Entity name.
 * @param {string|number} recordId        Record ID.
 * @param {string}        encodedSnapshot Base64-encoded snapshot.
 * @return {boolean} Whether the document contains the snapshotted state.
 */
export function entityContainsSnapshot(
	kind: string,
	name: string,
	recordId: string | number,
	encodedSnapshot: string
): boolean {
	if ( ! hasSyncManager() ) {
		return false;
	}

	return (
		getSyncManager()?.entityContainsSnapshot(
			`${ kind }/${ name }`,
			`${ recordId }`,
			encodedSnapshot
		) ?? false
	);
}
