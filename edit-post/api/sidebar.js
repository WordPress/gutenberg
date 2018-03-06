/* eslint no-console: [ 'error', { allow: [ 'error' ] } ] */

/* External dependencies */
import { isFunction } from 'lodash';

/* Internal dependencies */
import store from '../store';
import { setGeneralSidebarActivePanel, openGeneralSidebar } from '../store/actions';
import { applyFilters } from '@wordpress/hooks';

const sidebars = {};

/**
 * Registers a sidebar to the editor.
 *
 * A button will be shown in the settings menu to open the sidebar. The sidebar
 * can be manually opened by calling the `activateSidebar` function.
 *
 * @param {string} name              The name of the sidebar. Should be in
 *                                   `[plugin]/[sidebar]` format.
 * @param {Object}   settings        The settings for this sidebar.
 * @param {string}   settings.title  The name to show in the settings menu.
 * @param {Function} settings.render The function that renders the sidebar.
 *
 * @return {Object} The final sidebar settings object.
 */
export function registerSidebar( name, settings ) {
	settings = {
		name,
		...settings,
	};

	if ( typeof name !== 'string' ) {
		console.error(
			'Sidebar names must be strings.'
		);
		return null;
	}
	if ( ! /^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/.test( name ) ) {
		console.error(
			'Sidebar names must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-sidebar.'
		);
		return null;
	}
	if ( ! settings || ! isFunction( settings.render ) ) {
		console.error(
			'The "render" property must be specified and must be a valid function.'
		);
		return null;
	}
	if ( sidebars[ name ] ) {
		console.error(
			`Sidebar ${ name } is already registered.`
		);
	}

	if ( ! settings.title ) {
		console.error(
			`The sidebar ${ name } must have a title.`
		);
		return null;
	}
	if ( typeof settings.title !== 'string' ) {
		console.error(
			'Sidebar titles must be strings.'
		);
		return null;
	}

	settings = applyFilters( 'editor.registerSidebar', settings, name );

	return sidebars[ name ] = settings;
}

/**
 * Retrieves the sidebar settings object.
 *
 * @param {string} name The name of the sidebar to retrieve the settings for.
 *
 * @return {Object} The settings object of the sidebar. Or null if the
 *                         sidebar doesn't exist.
 */
export function getSidebarSettings( name ) {
	if ( ! sidebars.hasOwnProperty( name ) ) {
		return null;
	}
	return sidebars[ name ];
}
/**
 * Activates the given sidebar.
 *
 * @param  {string} name The name of the sidebar to activate.
 * @return {void}
 */
export function activateSidebar( name ) {
	store.dispatch( openGeneralSidebar( 'plugin' ) );
	store.dispatch( setGeneralSidebarActivePanel( 'plugin', name ) );
}
