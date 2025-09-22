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

// TODO: This should not be hardcoded. Maybe there should be a config and/or an UI.
export const PARTIAL_SYNCING_SUPPORTED_BLOCKS = {
	'core/paragraph': [ 'content' ],
	'core/heading': [ 'content' ],
	'core/image': [ 'id', 'url', 'title', 'alt', 'caption' ],
	'core/button': [ 'url', 'text', 'linkTarget', 'rel' ],
	'core/post-date': [ 'datetime' ],
	'core/pullquote': [ 'citation', 'value' ],
};

export const PATTERN_OVERRIDES_BINDING_SOURCE = 'core/pattern-overrides';
