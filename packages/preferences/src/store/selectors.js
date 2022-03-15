/**
 * Returns a boolean indicating whether a prefer is active for a particular
 * scope.
 *
 * @param {Object} state The store state.
 * @param {string} scope The scope of the feature (e.g. core/edit-post).
 * @param {string} name  The name of the feature.
 *
 * @return {*} Is the feature enabled?
 */
export function get( state, scope, name ) {
	const value = state.preferences[ scope ]?.[ name ];
	return value ?? state.defaults[ scope ]?.[ name ];
}
