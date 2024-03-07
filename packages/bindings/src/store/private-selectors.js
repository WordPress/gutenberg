/**
 * Returns all the bindings sources registered.
 *
 * @param {Object} state Data state.
 *
 * @return {Object} All the registered sources and their properties.
 */
export function getAllBindingsSources( state ) {
	return state.bindingsSources;
}

/**
 * Returns a specific bindings source.
 *
 * @param {Object} state      Data state.
 * @param {string} sourceName Name of the source to get.
 *
 * @return {Object} The specific binding source and its properties.
 */
export function getBindingsSource( state, sourceName ) {
	return state.bindingsSources[ sourceName ];
}
