/* eslint no-console: [ 'error', { allow: [ 'error' ] } ] */

/**
 * External dependencies
 */
import { isFunction } from 'lodash';

/**
 * WordPress dependencies
 */
import { applyFilters, doAction } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import PluginManager from '../api/plugin-manager';

/**
 * Defined behavior of a plugin type.
 *
 * @typedef {Object} WPPlugin
 *
 * @property {string}                    name   A string identifying the plugin. Must be
 *                                              unique across all registered plugins.
 *                                              unique across all registered plugins.
 * @property {string|WPElement|Function} icon   An icon to be shown in the UI. It can
 *                                              be a slug of the Dashicon, or an element
 *                                              (or function returning an element) if you
 *                                              choose to render your own SVG.
 * @property {Function}                  render A component containing the UI elements
 *                                              to be rendered.
 */

/**
 * Plugin manager class
 *
 * @typedef {Object} PluginManager
 */
const pluginManager = applyFilters( 'plugins.pluginManager', new PluginManager() );

/**
 * Registers a plugin to the editor.
 *
 * @param {string}   name     A string identifying the plugin.Must be
 *                            unique across all registered plugins.
 * @param {WPPlugin} settings The settings for this plugin.
 *
 * @example <caption>ES5</caption>
 * ```js
 * // Using ES5 syntax
 * var el = wp.element.createElement;
 * var Fragment = wp.element.Fragment;
 * var PluginSidebar = wp.editPost.PluginSidebar;
 * var PluginSidebarMoreMenuItem = wp.editPost.PluginSidebarMoreMenuItem;
 * var registerPlugin = wp.plugins.registerPlugin;
 *
 * function Component() {
 * 	return el(
 * 		Fragment,
 * 		{},
 * 		el(
 * 			PluginSidebarMoreMenuItem,
 * 			{
 * 				target: 'sidebar-name',
 * 			},
 * 			'My Sidebar'
 * 		),
 * 		el(
 * 			PluginSidebar,
 * 			{
 * 				name: 'sidebar-name',
 * 				title: 'My Sidebar',
 * 			},
 * 			'Content of the sidebar'
 * 		)
 * 	);
 * }
 * registerPlugin( 'plugin-name', {
 * 	icon: 'smiley',
 * 	render: Component,
 * } );
 * ```
 *
 * @example <caption>ESNext</caption>
 * ```js
 * // Using ESNext syntax
 * const { PluginSidebar, PluginSidebarMoreMenuItem } = wp.editPost;
 * const { registerPlugin } = wp.plugins;
 *
 * const Component = () => (
 * 	<>
 * 		<PluginSidebarMoreMenuItem
 * 			target="sidebar-name"
 * 		>
 * 			My Sidebar
 * 		</PluginSidebarMoreMenuItem>
 * 		<PluginSidebar
 * 			name="sidebar-name"
 * 			title="My Sidebar"
 * 		>
 * 			Content of the sidebar
 * 		</PluginSidebar>
 * 	</>
 * );
 *
 * registerPlugin( 'plugin-name', {
 * 	icon: 'smiley',
 * 	render: Component,
 * } );
 * ```
 *
 * @return {WPPlugin} The final plugin settings object.
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
	if ( pluginManager.getPlugin( name ) ) {
		console.error(
			`Plugin "${ name }" is already registered.`
		);
	}

	settings = applyFilters( 'plugins.registerPlugin', settings, name );

	if ( ! isFunction( settings.render ) ) {
		console.error(
			'The "render" property must be specified and must be a valid function.'
		);
		return null;
	}

	pluginManager.addPlugin(
		name,
		{
			icon: 'admin-plugins',
			...settings,
		}
	);

	doAction( 'plugins.pluginRegistered', settings, name );

	return settings;
}

/**
 * Unregisters a plugin by name.
 *
 * @param {string} name Plugin name.
 *
 * @example <caption>ES5</caption>
 * ```js
 * // Using ES5 syntax
 * var unregisterPlugin = wp.plugins.unregisterPlugin;
 *
 * unregisterPlugin( 'plugin-name' );
 * ```
 *
 * @example <caption>ESNext</caption>
 * ```js
 * // Using ESNext syntax
 * const { unregisterPlugin } = wp.plugins;
 *
 * unregisterPlugin( 'plugin-name' );
 * ```
 *
 * @return {?WPPlugin} The previous plugin settings object, if it has been
 *                     successfully unregistered; otherwise `undefined`.
 */
export function unregisterPlugin( name ) {
	if ( ! pluginManager.getPlugin( name ) ) {
		console.error(
			'Plugin "' + name + '" is not registered.'
		);
		return;
	}
	const oldPlugin = pluginManager.getPlugin( name );
	pluginManager.removePlugin( name );

	doAction( 'plugins.pluginUnregistered', oldPlugin, name );

	return oldPlugin;
}

/**
 * Returns a registered plugin settings.
 *
 * @param {string} name Plugin name.
 *
 * @return {?WPPlugin} Plugin setting.
 */
export function getPlugin( name ) {
	return pluginManager.getPlugin( name );
}

/**
 * Returns all registered plugins.
 *
 * @return {WPPlugin[]} Plugin settings.
 */
export function getPlugins() {
	return Object.values( pluginManager.getPlugins() );
}
