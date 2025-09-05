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
