/* eslint no-console: [ 'error', { allow: [ 'error' ] } ] */

/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';
import { select, dispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { isFunction } from 'lodash';

/**
 * Registers a plugin to the editor.
 *
 * @param {string}   name   The name of the plugin.
 * @param {Object}   settings        The settings for this plugin.
 * @param {Function} settings.render The function that renders the plugin.
 *
 * @return {Object} The final plugin settings object.
 */
export function registerPlugin( name, settings ) {
	if ( typeof settings !== 'object' ) {
		console.error(
			'No settings object provided!'
		);
		return null;
	}
	if ( typeof name !== 'string' ) {
		console.error(
			'Plugin names must be strings.'
		);
		return null;
	}
	if ( ! /^[a-z][a-z0-9-]*$/.test( name ) ) {
		console.error(
			'Plugin names must include only lowercase alphanumeric characters or dashes, and start with a letter. Example: "my-plugin".'
		);
		return null;
	}
	if ( getPlugin( name ) ) {
		console.error(
			`Plugin "${ name }" is already registered.`
		);
	}
	if ( ! isFunction( settings.render ) ) {
		console.error(
			'The "render" property must be specified and must be a valid function.'
		);
		return null;
	}

	settings.name = name;

	settings = applyFilters( 'plugins.registerPlugin', settings, name );

	dispatch( 'core/plugins' ).registerPlugin( name, settings );

	return settings;
}

/**
 * Unregisters a plugin by name.
 *
 * @param {string} name Plugin name.
 *
 * @return {?WPPlugin} The previous plugin settings object, if it has been
 *                     successfully unregistered; otherwise `undefined`.
 */
export function unregisterPlugin( name ) {
	if ( ! getPlugin( name ) ) {
		console.error(
			'Plugin "' + name + '" is not registered.'
		);
		return;
	}
	const oldPlugin = getPlugin( name );
	dispatch( 'core/plugins' ).unregisterPlugin( name );
	return oldPlugin;
}

/**
 * Returns a registered plugin settings.
 *
 * @param {string} name Plugin name.
 *
 * @return {?Object} Plugin setting.
 */
export function getPlugin( name ) {
	return select( 'core/plugins' ).getPlugin( name );
}

/**
 * Returns all registered plugins.
 *
 * @return {Array} Plugin settings.
 */
export function getPlugins() {
	return select( 'core/plugins' ).getPlugins();
}
