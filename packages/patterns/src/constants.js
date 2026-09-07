export const PATTERN_TYPES = {
	theme: 'pattern',
	user: 'wp_block',
};

export const PATTERN_DEFAULT_CATEGORY = 'all-patterns';
export const PATTERN_USER_CATEGORY = 'my-patterns';
export const EXCLUDED_PATTERN_SOURCES = [
	'core',
	'pattern-directory/core',
	'pattern-directory/featured',
];
export const PATTERN_SYNC_TYPES = {
	full: 'fully',
	unsynced: 'unsynced',
};

export const PATTERN_OVERRIDES_BINDING_SOURCE = 'core/pattern-overrides';

/**
 * Post meta on a `wp_block` post holding the name of the registered pattern
 * the post is an edited copy of.
 */
export const PATTERN_SLUG_META_KEY = 'wp_pattern_slug';
