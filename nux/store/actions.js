/**
 * Returns an action object used to mark a tip as shown
 *
 * @param {Object} tipId The ID of the tip to show
 * @return {Object}      Action object
 */
export function markAsShown( tipId ) {
	return {
		type: 'core/nux/MARK_AS_SHOWN',
		tipId,
	};
}
