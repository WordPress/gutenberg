/* eslint no-console: [ 'error', { allow: [ 'error' ] } ] */
/**
 * External dependencies.
 */
import { isFunction } from 'lodash';

const plugins = {};

/**
 * Register a plugin component.
 *
 * @param {string}   id       The unique identifier of the plugin. Should be in
 *                                `[namespace]/[name]` format.
 * @param {Function} activate Plugin activation function.
 * @param {Object?}  settings Plugin settings.
 */
export function registerPlugin( id, activate, settings ) {
	if ( ! validatePluginId( id ) ) {
		return;
	}
	if ( ! isFunction( activate ) ) {
		console.error(
			'Activate must be a valid function'
		);
	}
	plugins[ id ] = activate.bind( null, settings );
}

/**
 * Validates the plugin id.
 *
 * @param {string} id Plugin identifier.
 * @return {boolean} Whether the pluginId is valid.
 */
function validatePluginId( id ) {
	if ( typeof id !== 'string' ) {
		console.error(
			'Plugin identifier must be a string.'
		);
		return false;
	}
	if ( ! /^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/.test( id ) ) {
		console.error(
			'Plugin identifier must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-sidebar'
		);
		return false;
	}
	return true;
}

/**
 * Calls the plugins's activation function.
 *
 * @param {string} id                The unique plugin identifier.
 */
export function activatePlugin( id ) {
	if ( ! plugins[ id ] ) {
		console.error(
			`Plugin with id "${ id }" has not been registered`
		);
		return;
	}
	plugins[ id ]();
}
