/**
 * The editor store is referenced by its registered name rather than being
 * imported directly to avoid a module cycle between the suggestion-mode
 * subsystem, the editor store, and the editor provider (which mounts
 * `SuggestionOverlayProvider`).
 */
export const EDITOR_STORE_NAME = 'core/editor';

/**
 * Mirror of the `suggest` intent value defined in the editor store's
 * constants. Duplicated here to avoid the module cycle described above.
 */
export const SUGGEST_INTENT = 'suggest';
