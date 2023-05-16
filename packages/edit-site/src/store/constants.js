/**
 * The identifier for the data store.
 *
 * @type {string}
 */
export const STORE_NAME = 'core/edit-site';

export const TEMPLATE_PART_AREA_HEADER = 'header';
export const TEMPLATE_PART_AREA_FOOTER = 'footer';
export const TEMPLATE_PART_AREA_SIDEBAR = 'sidebar';
export const TEMPLATE_PART_AREA_GENERAL = 'uncategorized';

/**
 * List of block types to treat as content blocks when editing a page in the
 * site editor. These blocks will be unlocked and editable.
 *
 * @type {string[]}
 */
export const CONTENT_BLOCK_TYPES = [
	'core/post-featured-image',
	'core/post-title',
	'core/post-content',
];
