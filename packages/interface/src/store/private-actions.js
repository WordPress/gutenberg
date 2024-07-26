/**
 * Returns an action object signalling that the sidebar width is toggled.
 *
 * @param {boolean} isWide
 * @return {Object} Action object.
 */
export function setWideSidebar( isWide ) {
	return {
		type: 'SET_WIDE_SIDEBAR',
		isWide,
	};
}
