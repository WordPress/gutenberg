/**
 * Returns if the params match the list page route.
 *
 * @param {Object}  params                The url params.
 * @param {string}  params.path           The current path.
 * @param {string}  [params.categoryType] The current category type.
 * @param {string}  [params.categoryId]   The current category id.
 * @param {string}  [params.postType]     The current post type.
 * @param {string}  [params.postId]       The current post id.
 * @param {boolean} isMobileViewport      Is mobile viewport.
 *
 * @return {boolean} Is list page or not.
 */
export default function getIsListPage(
	{ path, categoryType, categoryId, postType, postId },
	isMobileViewport
) {
	return (
		path === '/wp_template/all' ||
		path === '/wp_template_part/all' ||
		path === '/media' ||
		( path && path.startsWith( '/media' ) ) ||
		( postType === 'attachment' && !! postId ) ||
		( path === '/patterns' &&
			// Don't treat "/patterns" without categoryType and categoryId as a
			// list page in mobile because the sidebar covers the whole page.
			( ! isMobileViewport || ( !! categoryType && !! categoryId ) ) )
	);
}
