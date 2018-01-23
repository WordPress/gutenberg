/* eslint no-console: [ 'error', { allow: [ 'error' ] } ] */

/**
 * External dependencies 
 */
import { isFunction } from 'lodash';

/**
 * Internal dependencies 
 */
import { applyFilters } from '@wordpress/hooks';
import { isString } from 'util';

const menuItems = {};

/**
 * Registers a plugin under the ellipsis menu.
 *
 *
 * @param {string} name                The name of the plugin. Should be in
 *                                     `[namespace]/[name]` format.
 * @param {Object}   settings          The settings for this menu item.
 * @param {string}   settings.title    The name to show in the settings menu.
 * @param {func}     settings.callback The callback function that is called
 *                                     when the menu item is clicked.
 * @param {string}   [settings.icon]   SVG Icon url.
 *
 * @returns {Object} The final sidebar settings object.
 */
export function registerEllipsisMenuItem( name, settings ) {
	settings = {
		name,
		...settings,
	};

	if ( typeof name !== 'string' ) {
		console.error(
			'Ellipsis menu items names must be strings.'
		);
		return null;
	}
	if ( ! /^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/.test( name ) ) {
		console.error(
			'Ellipsis menu item names must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-sidebar'
		);
		return null;
	}
	if ( menuItems[ name ] ) {
		console.error(
			'Menu item "' + name + '" is already registered.'
		);
	}

	if ( ! settings.title ) {
		console.error(
			'Menu item "' + name + '" must have a title.'
		);
		return null;
	}
	if ( typeof settings.title !== 'string' ) {
		console.error(
			'Menu items title must be strings.'
		);
		return null;
	}

	if ( ! settings.callback ) {
		console.error(
			'Menu item "' + name + '" must have a callback'
		);
		return null;
	}
	if ( ! isFunction( settings.callback ) ) {
		console.error(
			'Menu item callback must be a function'
		);
		return null;
	}

	if ( settings.icon && isString( settings.icon ) ) {
		console.error(
			'Menu item icon must be a react component'
		);
		return null;
	}

	settings = applyFilters( 'editor.registerEllipsisMenuItem', settings, name );

	return menuItems[ name ] = settings;
}

/**
 * Retrieves all menu items that are registered.
 *
 * @returns {Object} Registered menu items.
 */
export function getEllipsisMenuItems() {
	return menuItems;
}
