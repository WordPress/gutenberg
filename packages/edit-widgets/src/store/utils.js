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
export const buildSidebarPostId = ( menuId ) => `sidebar-post-${ menuId }`;

/**
 * Builds a query to resolve sidebars.
 *
 * @return {Object} Query.
 */
export function buildSidebarsPostsQuery() {
	return { type: 'sidebar-page' };
}
