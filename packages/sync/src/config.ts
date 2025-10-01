/**
 * The version number for the CRDT Document.
 *
 * This version number should be incremented whenever there are breaking changes
 * to Yjs doc schema or in how it is interpreted by code in the SyncConfig. This
 * allows implementors to invalidate persisted CRDT docs, if any.
 *
 * @type {number}
 */
export const CRDT_DOC_VERSION = 1;

// Map keys in the root Yjs document.

/**
 * The key used to store the Y.Map containing the document content.
 *
 * @type {string}
 */
export const CRDT_RECORD_MAP_KEY = 'document';
/**
 * The key used to store the Y.Map containing the document state (metadata).
 *
 * @type {string}
 */
export const CRDT_STATE_MAP_KEY = 'state';

// Sub-keys.

/**
 * The key used to store the last persisted date in the state map.
 *
 * @type {string}
 */
export const CRDT_STATE_PERSISTED_AT_KEY = 'persistedAt';
/**
 * The key used to store the user ID of the last user who persisted the document.
 *
 * @type {string}
 */
export const CRDT_STATE_PERSISTED_BY_KEY = 'persistedBy';
/**
 * The key used to store the date when the document was last restored.
 *
 * @type {string}
 */
export const CRDT_STATE_RESTORED_AT_KEY = 'restoredAt';
/**
 * The key used to store the user ID of the last user who restored the document.
 *
 * @type {string}
 */
export const CRDT_STATE_RESTORED_BY_KEY = 'restoredBy';
/**
 * The key used to store the version of the document.
 *
 * @type {string}
 */
export const CRDT_STATE_VERSION_KEY = 'version';

// Origin strings.

/**
 * The origin string used to identify changes made by the editor.
 *
 * @type {string}
 */
export const LOCAL_EDITOR_ORIGIN = 'gutenberg';
/**
 * The origin string used to identify changes made by the sync provider.
 *
 * @type {string}
 */
export const LOCAL_SYNC_PROVIDER_ORIGIN = 'syncProvider';
