/**
 * External dependencies
 */
import { paramCase as kebabCase } from 'change-case';

/**
 * Internal dependencies
 */
import { rest } from './rest-api';

const pluginsMapPromise = ( async function getPluginsMap() {
	const plugins = await rest( { path: '/wp/v2/plugins' } );
	const map = {};
	for ( const plugin of plugins ) {
		// Ideally, we should be using sanitize_title() in PHP rather than kebabCase(),
		// but we don't have the exact port of it in JS.
		map[ kebabCase( plugin.name ) ] = plugin.plugin;
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
