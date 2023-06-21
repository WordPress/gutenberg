export const DEFAULT_CATEGORY = 'header';
export const DEFAULT_TYPE = 'wp_template_part';
export const PATTERNS = 'pattern';
export const TEMPLATE_PARTS = 'wp_template_part';
export const USER_PATTERNS = 'wp_block';
export const USER_PATTERN_CATEGORY = 'custom-patterns';

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
