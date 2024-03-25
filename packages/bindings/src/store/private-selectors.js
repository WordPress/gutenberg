/**
 * Internal dependencies
 */
import { generateBindingsConnectionKey } from './utils';

/**
 * Returns all the bindings sources registered.
 *
 * @param {Object} state - Data state.
 * @return {Object}        All registered sources handlers.
 */
export function getAllBindingsSources( state ) {
	return state.sources;
}

/**
 * Returns a specific bindings source.
 *
 * @param {Object} state      - Data state.
 * @param {string} sourceName - Source handler name.
 * @return {Object}             The specific binding source.
 */
export function getBindingsSource( state, sourceName ) {
	return state.sources[ sourceName ];
}

/**
 * Return the bindings connection key,
 * based on the source handler name and the binding arguments.
 *
 * @param {Object} state           - Data state.
 * @param {Object} settings        - Settings.
 * @param {string} settings.source - The source handler name.
 * @param {Object} settings.args   - The binding arguments.
 * @return {string|undefined}        The generated key.
 */
export function getBindingsConnectionKey( state, settings ) {
	return generateBindingsConnectionKey( settings );
}

/**
 * Return the bindings connection handler,
 * based on the connection key.
 *
 * @param {Object} state - Data state.
 * @param {string} key   - The connection key.
 * @return {Object}        The connection handler.
 */
export function getBindingsConnectionHandler( state, key ) {
	return state.connections?.[ key ];
}

/**
 * Return the bindings connection value,
 * based on the connection key.
 *
 * @param {Object} state - Data state.
 * @param {string} key   - The connection key.
 * @return {*}             The connection value.
 */
export function getBindingsConnectionValue( state, key ) {
	return getBindingsConnectionHandler( state, key )?.get();
}
