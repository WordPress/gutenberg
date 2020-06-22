/**
 * "Kind" of the navigation post.
 *
 * @type {string}
 */
export const KIND = 'root';

/**
 * "post type" of the navigation post.
 *
 * @type {string}
 */
export const POST_TYPE = 'postType';

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
