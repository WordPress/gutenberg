/**
 * Returns an action object used in signalling that the registered post meta
 * fields for a post type have been received.
 *
 * @param {string} postType           Post type slug.
 * @param {Object} registeredPostMeta Registered post meta.
 *
 * @return {Object} Action object.
 */
export function receiveRegisteredPostMeta( postType, registeredPostMeta ) {
	return {
		type: 'RECEIVE_REGISTERED_POST_META',
		postType,
		registeredPostMeta,
	};
}
