/**
 * WordPress dependencies
 */

import apiFetch from '@wordpress/api-fetch';

/**
 * Retrieve the list of registered icons from the API.
 *
 * @return {Array} Array of icons.
 */
export default async function getIcons() {
	const icons = await apiFetch( { path: '/wp/v2/icons' } );
	return icons;
}
