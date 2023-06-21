/**
 * Returns if the params match the list page route.
 *
 * @param {Object}  params                The url params.
 * @param {string}  params.path           The current path.
 * @param {string}  [params.categoryType] The current category type.
 * @param {string}  [params.categoryId]   The current category id.
 * @param {boolean} isMobileViewport      Is mobile viewport.
 *
 * @return {boolean} Is list page or not.
 */
export default function getIsListPage(
	{ path, categoryType, categoryId },
	isMobileViewport
) {
	return (
		path === '/wp_template/all' ||
		( path === '/library' &&
			// Don't treat "/library" without categoryType and categoryId as a list page
			// in mobile because the sidebar covers the whole page.
			( ! isMobileViewport || ( !! categoryType && !! categoryId ) ) )
	);
}
