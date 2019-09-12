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
 *
 * @type {string}
 */
export const STORE_KEY = 'core/editor';

export const POST_UPDATE_TRANSACTION_ID = 'post-update';
export const SAVE_POST_NOTICE_ID = 'SAVE_POST_NOTICE_ID';
export const TRASH_POST_NOTICE_ID = 'TRASH_POST_NOTICE_ID';
export const PERMALINK_POSTNAME_REGEX = /%(?:postname|pagename)%/;
export const ONE_MINUTE_IN_MS = 60 * 1000;
export const AUTOSAVE_PROPERTIES = [ 'title', 'excerpt', 'content' ];
