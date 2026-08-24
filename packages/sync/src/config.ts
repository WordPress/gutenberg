/**
 * CRDT documents can hold meta information in a map. This map exists only in
 * memory and is not synced or persisted. This key can be used to indicate that
 * a (temporary) document has been loaded from persistence.
 */
export const CRDT_DOC_META_PERSISTENCE_KEY = 'fromPersistence';

/**
 * Root-level key for the map that holds the entity record data.
 */
export const CRDT_RECORD_MAP_KEY = 'document';

/**
 * Origin string for CRDT document changes originating from the local editor.
 */
export const LOCAL_EDITOR_ORIGIN = 'gutenberg';

/**
 * Origin string for CRDT document changes that should be synced but not
 * recorded in the undo history (e.g. status changes during publish).
 *
 * This origin is intentionally NOT included in the UndoManager's
 * `trackedOrigins`, so changes made with this origin will be applied to
 * the CRDT document (and synced to peers) without creating undo levels.
 */
export const LOCAL_UNDO_IGNORED_ORIGIN = 'gutenberg-undo-ignored';
