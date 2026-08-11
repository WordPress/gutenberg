import {
	privateApis as syncPrivateApis,
	type SyncManager,
} from '@wordpress/sync';
import { unlock } from './lock-unlock';

const {
	ConnectionErrorCode,
	createSyncManager,
	Delta,
	CRDT_DOC_META_PERSISTENCE_KEY,
	CRDT_RECORD_MAP_KEY,
	LOCAL_EDITOR_ORIGIN,
	LOCAL_UNDO_IGNORED_ORIGIN,
	retrySyncConnection,
} = unlock( syncPrivateApis );

export {
	ConnectionErrorCode,
	Delta,
	CRDT_DOC_META_PERSISTENCE_KEY,
	CRDT_RECORD_MAP_KEY,
	LOCAL_EDITOR_ORIGIN,
	LOCAL_UNDO_IGNORED_ORIGIN,
	retrySyncConnection,
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

export function getSyncManager(): SyncManager | undefined {
	if ( syncManager ) {
		return syncManager;
	}

	syncManager = createSyncManager();

	return syncManager;
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
