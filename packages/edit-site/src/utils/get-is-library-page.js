/*
 * Returns if the params match the library page route.
 *
 * @param {Object} params      The url params.
 * @param {string} params.path The current path.
 *
 * @return {boolean} Is library page or not.
 */
export default function getIsLibraryPage( { path } ) {
	return path === '/library';
}
