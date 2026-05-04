/**
 * Set of post properties for which edits should assume a merging behavior,
 * assuming an object value.
 *
 * @type {Set}
 */
export const EDIT_MERGE_PROPERTIES = new Set( [ 'meta' ] );

/**
 * Constant for the store module (or reducer) key.
 */
export const STORE_NAME = 'core/editor';

export const PERMALINK_POSTNAME_REGEX = /%(?:postname|pagename)%/;
export const ONE_MINUTE_IN_MS = 60 * 1000;
export const AUTOSAVE_PROPERTIES = [ 'title', 'excerpt', 'content' ];
export const TEMPLATE_PART_AREA_DEFAULT_CATEGORY = 'uncategorized';
export const TEMPLATE_POST_TYPE = 'wp_template';
export const TEMPLATE_PART_POST_TYPE = 'wp_template_part';
export const PATTERN_POST_TYPE = 'wp_block';
export const NAVIGATION_POST_TYPE = 'wp_navigation';
export const ATTACHMENT_POST_TYPE = 'attachment';
export const TEMPLATE_ORIGINS = {
	custom: 'custom',
	theme: 'theme',
	plugin: 'plugin',
};
export const TEMPLATE_POST_TYPES = [ 'wp_template', 'wp_template_part' ];
export const GLOBAL_POST_TYPES = [
	...TEMPLATE_POST_TYPES,
	'wp_block',
	'wp_navigation',
];
export const DESIGN_POST_TYPES = [
	TEMPLATE_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
	PATTERN_POST_TYPE,
	NAVIGATION_POST_TYPE,
];

/**
 * Editor intent values. The intent represents the user's current editing
 * purpose (edit the post directly, suggest changes, or view in read-only).
 *
 * Orthogonal to the `editorMode` preference (visual vs. code): a user can
 * be in `suggest` intent in either visual or code mode.
 *
 * Storage and defaults:
 *   - Persisted via `@wordpress/preferences` under (`core`, `editorIntent`),
 *     so the intent survives reloads.
 *   - The per-app default is registered in `packages/edit-post/src/index.js`
 *     and `packages/edit-site/src/index.js` (both default to `'edit'`).
 *   - `getEditorIntent` falls back to `EDITOR_INTENT_EDIT` when no value
 *     is set, so consumers can rely on a non-null result.
 *
 * Suggest Mode context:
 * Phase 1 of the Suggest Mode feature only wires the intent state and the
 * UI surface (menu + keyboard shortcuts). Subsequent phases use the
 * `suggest` intent to capture edits as in-memory overlays, render them as
 * suggestions, and let other users apply or reject them. Adding a new
 * intent here also requires updates to:
 *   - packages/editor/src/components/intent-switcher/index.js (UI choices)
 *   - packages/editor/src/components/global-keyboard-shortcuts/* (shortcut
 *     registration and dispatch)
 */
export const EDITOR_INTENT_EDIT = 'edit';
export const EDITOR_INTENT_SUGGEST = 'suggest';
export const EDITOR_INTENT_VIEW = 'view';
export const EDITOR_INTENTS = [
	EDITOR_INTENT_EDIT,
	EDITOR_INTENT_SUGGEST,
	EDITOR_INTENT_VIEW,
] as const;
export type EditorIntent = ( typeof EDITOR_INTENTS )[ number ];
