/**
 * Set of post properties for which edits should assume a merging behavior,
 * assuming an object value.
 *
 * @type {Set}
 */
export const EDIT_MERGE_PROPERTIES = new Set( [
	'meta',
] );

/**
 * Constant for the store module (or reducer) key.
 * @type {string}
 */
export const MODULE_KEY = 'core/editor';

export const POST_UPDATE_TRANSACTION_ID = 'post-update';
export const SAVE_POST_NOTICE_ID = 'SAVE_POST_NOTICE_ID';
export const TRASH_POST_NOTICE_ID = 'TRASH_POST_NOTICE_ID';
export const PERMALINK_POSTNAME_REGEX = /%(?:postname|pagename)%/;
export const INSERTER_UTILITY_HIGH = 3;
export const INSERTER_UTILITY_MEDIUM = 2;
export const INSERTER_UTILITY_LOW = 1;
export const INSERTER_UTILITY_NONE = 0;
export const MILLISECONDS_PER_HOUR = 3600 * 1000;
export const MILLISECONDS_PER_DAY = 24 * 3600 * 1000;
export const MILLISECONDS_PER_WEEK = 7 * 24 * 3600 * 1000;
export const ONE_MINUTE_IN_MS = 60 * 1000;
