/**
 * Returns whether any command loader is currently loading.
 *
 * @param {Object} state State tree.
 *
 * @return {boolean} Whether any loader is loading.
 */
export function isLoading( state ) {
	return Object.values( state.loaderStates ).some( Boolean );
}
