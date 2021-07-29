/**
 * Internal dependencies
 */
import { rest } from './rest-api';

/**
 * Sanitize a string to a slug.
 * A shimmed version of WordPress's `sanitize_title()` in JavaScript.
 *
 * @param {string} str The input string,
 * @return {string} The slug.
 */
function slugify( str ) {
	return str
		.trim() // Trim white spaces.
		.toLowerCase() // Convert to lower cases.
		.replace( /\s+/g, '-' ) // Collapse whitespace and replace by a dash.
		.replace( /-+/g, '-' ) // Collapse dashes.
		.replace( /[^a-z0-9 -]/g, '' ); // Remove invalid chars.
}

const pluginsMapPromise = ( async function getPluginsMap() {
	const plugins = await rest( { path: '/wp/v2/plugins' } );
	const map = {};
	for ( const plugin of plugins ) {
		map[ slugify( plugin.name ) ] = plugin.plugin;
	}
	return map;
} )();

/**
 * Activates an installed plugin.
 *
 * @param {string} slug Plugin slug.
 */
async function activatePlugin( slug ) {
	const pluginsMap = await pluginsMapPromise;
	const plugin = pluginsMap[ slug ];

	await rest( {
		method: 'PUT',
		path: `/wp/v2/plugins/${ plugin }`,
		data: { status: 'active' },
	} );
}

/**
 * Deactivates an active plugin.
 *
 * @param {string} slug Plugin slug.
 */
async function deactivatePlugin( slug ) {
	const pluginsMap = await pluginsMapPromise;
	const plugin = pluginsMap[ slug ];

	await rest( {
		method: 'PUT',
		path: `/wp/v2/plugins/${ plugin }`,
		data: { status: 'inactive' },
	} );
}

export { activatePlugin, deactivatePlugin };
