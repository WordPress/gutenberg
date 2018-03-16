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
