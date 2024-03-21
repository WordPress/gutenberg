/**
 * Internal dependencies
 */
import { generateSourcePropertyKey } from './utils';

/**
 * Returns all the bindings sources registered.
 *
 * @param {Object} state Data state.
 *
 * @return {Object} All the registered sources and their properties.
 */
export function getAllBindingsSources( state ) {
	return state.sources;
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
	return state.sources[ sourceName ];
}

export function getExternalPropertyKey( state, { source, args } ) {
	return generateSourcePropertyKey( source, args );
}

export function getExternalPropertyHandler( state, key ) {
	return state.sourceProperties?.[ key ];
}

export function getExternalPropertieValue( state, key ) {
	return getExternalPropertyHandler( state, key )?.get();
}
