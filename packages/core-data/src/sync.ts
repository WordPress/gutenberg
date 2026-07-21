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
 * Read the last recorded autosave time for a user from a synced entity's
 * CRDT document. Returns undefined when the entity is not being synced or
 * no marker exists.
 *
 * @param {string}        kind     Entity kind.
 * @param {string}        name     Entity name.
 * @param {string|number} recordId Record ID.
 * @param {number}        authorId WordPress user ID of the autosave author.
 * @return {number|undefined} Autosave modified time as epoch seconds (UTC).
 */
export function getEntityAutosavedAt(
	kind: string,
	name: string,
	recordId: string | number,
	authorId: number
): number | undefined {
	if ( ! hasSyncManager() ) {
		return undefined;
	}

	return getSyncManager()?.getEntityAutosavedAt(
		`${ kind }/${ name }`,
		`${ recordId }`,
		authorId
	);
}
