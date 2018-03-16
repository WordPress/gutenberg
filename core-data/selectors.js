/**
 * Returns all the available categories.
 *
 * @param {Object} state Data state.
 *
 * @return {Array} Categories list.
 */
export function getCategories( state ) {
	return state.categories;
}

/**
 * Returns true if a request has been issued for the given data type, or false
 * otherwise.
 *
 * @param {Object} state    Data state.
 * @param {string} dataType Data type to test.
 *
 * @return {boolean} Whether data type has been requested.
 */
export function hasRequested( state, dataType ) {
	return !! state.requested[ dataType ];
}

/**
 * Returns true if a request is in progress for categories data, or false
 * otherwise.
 *
 * @param {Object} state    Data state.
 *
 * @return {boolean} Whether a request is in progress for categories.
 */
export function isRequestingCategories( state ) {
	return (
		hasRequested( state, 'categories' ) &&
		getCategories( state ) === null
	);
}
