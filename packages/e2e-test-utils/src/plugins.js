/**
 * External dependencies
 */
import { kebabCase } from 'lodash';

/**
 * Internal dependencies
 */
import { rest } from './rest-api';

/** @type {Record<string, string>} */
let pluginsCache;

/**
 * Fetch the plugins from API and cache them in memory,
 * since they are unlikely to change during testing.
 */
async function getPluginsMap() {
	if ( pluginsCache ) {
		return pluginsCache;
	}

	const plugins = await rest( { path: '/wp/v2/plugins' } );
	pluginsCache = {};
	for ( const plugin of plugins ) {
		// Ideally, we should be using sanitize_title() in PHP rather than kebabCase(),
		// but we don't have the exact port of it in JS.
		pluginsCache[ kebabCase( plugin.name ) ] = plugin.plugin;
	}
	return pluginsCache;
}

/**
 * Activates an installed plugin.
 *
 * @param {string} slug Plugin slug.
 */
async function activatePlugin( slug ) {
	const pluginsMap = await getPluginsMap();
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
	const pluginsMap = await getPluginsMap();
	const plugin = pluginsMap[ slug ];

	await rest( {
		method: 'PUT',
		path: `/wp/v2/plugins/${ plugin }`,
		data: { status: 'inactive' },
	} );
}

export { activatePlugin, deactivatePlugin };
