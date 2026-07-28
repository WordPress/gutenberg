/**
 * WordPress dependencies
 */
import {
	privateApis as syncPrivateApis,
	type SyncManager,
} from '@wordpress/sync';

/**
 * Internal dependencies
 */
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

/**
 * Subscribe to a synced entity's "synced" flag, which flips true once the
 * entity's CRDT document has received its initial state from the sync backend.
 * The callback fires once: immediately if the document has already synced,
 * otherwise when it does. The subscription may be attached before the entity
 * is loaded, so this bootstraps the sync manager rather than no-opping when
 * none exists yet. Returns an unsubscribe function.
 *
 * @param {string}        kind     Entity kind.
 * @param {string}        name     Entity name.
 * @param {string|number} recordId Record ID.
 * @param {Function}      callback Called once the document has synced.
 * @return {Function} Unsubscribe function.
 */
export function subscribeHasInitialSync(
	kind: string,
	name: string,
	recordId: string | number,
	callback: () => void
): () => void {
	return (
		getSyncManager()?.subscribeHasInitialSync(
			`${ kind }/${ name }`,
			`${ recordId }`,
			callback
		) ?? ( () => {} )
	);
}
