/**
 * Returns an action object used to toggle a feature flag.
 *
 * This function is unstable, as it is mostly copied from the edit-post
 * package. Editor features and preferences have a lot of scope for
 * being generalized and refactored.
 *
 * @param {string} feature Feature name.
 *
 * @return {Object} Action object.
 */
export function __unstableToggleFeature( feature ) {
	return {
		type: 'TOGGLE_FEATURE',
		feature,
	};
}
