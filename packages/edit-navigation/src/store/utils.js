/**
 * A WP nav_menu_item object.
 * For more documentation on the individual fields present on a menu item please see:
 * https://core.trac.wordpress.org/browser/tags/5.7.1/src/wp-includes/nav-menu.php#L789
 *
 * Changes made here should also be mirrored in packages/block-library/src/navigation/map-menu-items-to-blocks.js.
 *
 * @typedef WPNavMenuItem
 *
 * @property {Object} title       stores the raw and rendered versions of the title/label for this menu item.
 * @property {Array}  xfn         the XFN relationships expressed in the link of this menu item.
 * @property {Array}  classes     the HTML class attributes for this menu item.
 * @property {string} attr_title  the HTML title attribute for this menu item.
 * @property {string} object      The type of object originally represented, such as 'category', 'post', or 'attachment'.
 * @property {string} object_id   The DB ID of the original object this menu item represents, e.g. ID for posts and term_id for categories.
 * @property {string} description The description of this menu item.
 * @property {string} url         The URL to which this menu item points.
 * @property {string} type        The family of objects originally represented, such as 'post_type' or 'taxonomy'.
 * @property {string} target      The target attribute of the link element for this menu item.
 */

/**
 * Builds an ID for a new navigation post.
 *
 * @param {number} menuId Menu id.
 * @return {string} An ID.
 */
export const buildNavigationPostId = ( menuId ) =>
	`navigation-post-${ menuId }`;

/**
 * Builds a query to resolve menu items.
 *
 * @param {number} menuId Menu id.
 * @return {Object} Query.
 */
export function menuItemsQuery( menuId ) {
	return { menus: menuId, per_page: -1 };
}

/**
 * Get the internal record id from block.
 *
 * @typedef  {Object} Attributes
 * @property {string}     __internalRecordId The internal record id.
 * @typedef  {Object} Block
 * @property {Attributes} attributes         The attributes of the block.
 *
 * @param    {Block}      block              The block.
 * @return {string} The internal record id.
 */
export function getRecordIdFromBlock( block ) {
	return block.attributes.__internalRecordId;
}

/**
 * Add internal record id to block's attributes.
 *
 * @param {Block}  block    The block.
 * @param {string} recordId The record id.
 * @return {Block} The updated block.
 */
export function addRecordIdToBlock( block, recordId ) {
	return {
		...block,
		attributes: {
			...( block.attributes || {} ),
			__internalRecordId: recordId,
		},
	};
}

/**
 * Checks if a given block should be persisted as a menu item.
 *
 * @param {Object} block Block to check.
 * @return {boolean} True if a given block should be persisted as a menu item, false otherwise.
 */
export const isBlockSupportedInNav = ( block ) =>
	[ 'core/navigation-link', 'core/navigation-submenu' ].includes(
		block.name
	);
