/**
 * Private prop key for `ColorPalette` inline editing configuration.
 *
 * Uses an opaque string because React won't forward props with Symbol keys.
 * Hidden from public types. First-party code reads it via `unlock( componentsPrivateApis ).colorEditingKey`.
 */
export const colorEditingKey =
	'wp.components.colorPalette.colorEditing' as const;

export type ColorEditingPropKey = typeof colorEditingKey;
