export const ALL_PATTERNS_CATEGORY = 'all-patterns';
export const DEFAULT_CATEGORY = ALL_PATTERNS_CATEGORY;
export const PATTERNS = 'pattern';
export const DEFAULT_TYPE = PATTERNS;
export const TEMPLATE_PARTS = 'wp_template_part';
export const USER_PATTERNS = 'wp_block';

export const CORE_PATTERN_SOURCES = [
	'core',
	'pattern-directory/core',
	'pattern-directory/featured',
	'pattern-directory/theme',
];

export const SYNC_TYPES = {
	full: 'fully',
	unsynced: 'unsynced',
};

export const filterOutDuplicatesByName = ( currentItem, index, items ) =>
	index === items.findIndex( ( item ) => currentItem.name === item.name );
