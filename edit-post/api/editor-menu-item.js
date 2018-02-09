/* eslint no-console: [ 'error', { allow: [ 'error' ] } ] */

/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import { applyFilters } from '@wordpress/hooks';
import { isString } from 'util';
import { activatePlugin } from './plugins-core';

const menuItems = {};

/**
 * Registers a plugin under the ellipsis menu.
 *
 * @param {string}   menuItemId        The unique identifier of the plugin. Should be in
 *                                     `[namespace]/[name]` format.
 * @param {Object}   settings          The settings for this menu item.
 * @param {string}   settings.title    The name to show in the settings menu.
 * @param {func}     settings.pluginId The registerd plugin activation function that is called
 *                                     when the menu item is clicked.
 * @param {string}   [settings.icon]   SVG Icon url.
 *
 * @return {Object} The final sidebar settings object.
 */
export function registerEditorMenuItem( menuItemId, settings ) {
	settings = {
		menuItemId,
		...settings,
	};

	if ( typeof name !== 'string' ) {
		console.error(
			'Ellipsis menu items names must be strings.'
		);
		return null;
	}
	if ( ! /^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/.test( menuItemId ) ) {
		console.error(
			'Ellipsis menu item names must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-sidebar'
		);
		return null;
	}
	if ( menuItems[ menuItemId ] ) {
		console.error(
			'Menu item "' + menuItemId + '" is already registered.'
		);
	}

	if ( ! settings.title ) {
		console.error(
			'Menu item "' + menuItemId + '" must have a title.'
		);
		return null;
	}
	if ( typeof settings.title !== 'string' ) {
		console.error(
			'Menu items title must be strings.'
		);
		return null;
	}

	if ( settings.icon && isString( settings.icon ) ) {
		console.error(
			'Menu item icon must be a react component'
		);
		return null;
	}

	settings.callback = activatePlugin.bind( null, settings.pluginId );

	settings = applyFilters( 'editor.registerEllipsisMenuItem', settings, menuItemId );

	return menuItems[ menuItemId ] = settings;
}

/**
 * Retrieves all menu items that are registered.
 *
 * @return {Object} Registered menu items.
 */
export function getEditorMenuItems() {
	return menuItems;
}
