/**
 * Returns an action object used in signalling that the request for a given
 * data type has been made.
 *
 * @param {string} dataType Data type requested.
 *
 * @return {Object} Action object.
 */
export function setRequested( dataType ) {
	return {
		type: 'SET_REQUESTED',
		dataType,
	};
}

/**
 * Returns an action object used in signalling that categories have been
 * received.
 *
 * @param {Object[]} categories Categories received.
 *
 * @return {Object} Action object.
 */
export function receiveCategories( categories ) {
	return {
		type: 'RECEIVE_CATEGORIES',
		categories,
	};
}
