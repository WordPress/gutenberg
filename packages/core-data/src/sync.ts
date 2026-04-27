/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import {
	privateApis as syncPrivateApis,
	type SyncManager,
} from '@wordpress/sync';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { unlock } from './lock-unlock';
import { POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE } from './utils/crdt';

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
 * Fetch the latest persisted CRDT document for a post from REST and merge it
 * into the live in-memory Y.Doc. Intended for use immediately before a save
 * that happens while the sync transport is disconnected. Concurrent changes
 * made by other peers  and persisted to `meta._crdt_document` on the server are
 * pulled in locally so this client's save does not overwrite them.
 *
 * Returns `true` if the merge was applied, and `false` for any other reason.
 *
 * @param {string}        kind     Entity kind (e.g. `postType`).
 * @param {string}        name     Entity name (e.g. `post`).
 * @param {string|number} recordId Post ID.
 * @param {string}        baseURL  REST base URL for the entity (e.g. `/wp/v2/posts`).
 * @return {Promise<boolean>} Whether the merge was applied.
 */
/**
 * Module-level cache for the server CRDT fetched during the pre-save check.
 * Storing it here avoids putting a potentially large serialized blob into
 * Redux state and avoids re-fetching when the user acts on the merge dialog.
 */
let pendingServerCRDT: {
	kind: string;
	name: string;
	recordId: string | number;
	serialized: string;
} | null = null;

/**
 * Fetch the latest persisted CRDT document for a post from REST and check
 * whether it contains changes not yet present in the local Y.Doc. If changes
 * are found the serialized CRDT is cached in the module so it can be merged
 * later without another round-trip.
 *
 * Returns `{ hasChanges: false }` on any error so the caller can fall through
 * to a normal save (fail-safe).
 *
 * @param {string}        kind     Entity kind (e.g. `postType`).
 * @param {string}        name     Entity name (e.g. `post`).
 * @param {string|number} recordId Post ID.
 * @param {string}        baseURL  REST base URL for the entity.
 * @return {Promise<{ hasChanges: boolean }>} Whether the server has new changes.
 */
export async function fetchServerCRDTChanges(
	kind: string,
	name: string,
	recordId: string | number,
	baseURL: string
): Promise< { hasChanges: boolean } > {
	try {
		const record = ( await apiFetch( {
			path: addQueryArgs( `${ baseURL }/${ recordId }`, {
				context: 'edit',
				_fields: 'meta',
			} ),
		} ) ) as { meta?: Record< string, unknown > };

		const serialized =
			record?.meta?.[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ];

		if ( typeof serialized !== 'string' || ! serialized ) {
			return { hasChanges: false };
		}

		const hasChanges =
			getSyncManager()?.hasPersistedCRDTDocChanges(
				`${ kind }/${ name }`,
				String( recordId ),
				serialized
			) ?? false;

		if ( hasChanges ) {
			pendingServerCRDT = { kind, name, recordId, serialized };
		}

		return { hasChanges };
	} catch {
		return { hasChanges: false };
	}
}

/**
 * Merge the previously cached server CRDT into the live Y.Doc and clear
 * the cache. Intended to be called when the user confirms "Merge changes"
 * in the merge confirmation dialog.
 *
 * @return {boolean} Whether the merge was applied.
 */
export function mergeFromPendingServerCRDT(): boolean {
	if ( ! pendingServerCRDT ) {
		return false;
	}

	const { kind, name, recordId, serialized } = pendingServerCRDT;
	pendingServerCRDT = null;

	return (
		getSyncManager()?.mergePersistedCRDTDoc(
			`${ kind }/${ name }`,
			String( recordId ),
			serialized
		) ?? false
	);
}

/**
 * Clear the cached server CRDT without merging. Called when the user
 * dismisses the merge dialog or chooses to overwrite.
 */
export function clearPendingServerCRDT(): void {
	pendingServerCRDT = null;
}

export async function mergePersistedCRDTDocFromServer(
	kind: string,
	name: string,
	recordId: string | number,
	baseURL: string
): Promise< boolean > {
	try {
		const record = ( await apiFetch( {
			path: addQueryArgs( `${ baseURL }/${ recordId }`, {
				context: 'edit',
				_fields: 'meta',
			} ),
		} ) ) as { meta?: Record< string, unknown > };

		const serialized =
			record?.meta?.[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ];

		if ( typeof serialized !== 'string' || ! serialized ) {
			return false;
		}

		return (
			getSyncManager()?.mergePersistedCRDTDoc(
				`${ kind }/${ name }`,
				String( recordId ),
				serialized
			) ?? false
		);
	} catch {
		return false;
	}
}
