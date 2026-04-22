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
