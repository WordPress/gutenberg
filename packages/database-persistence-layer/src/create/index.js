/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Creates a database persistence layer, storing data in the user meta.
 *
 * @param {Object} options
 * @param {Object} options.preloadedData Any persisted data that should be preloaded.
 *
 * @return {Object} A database persistence layer.
 */
export default function create( { preloadedData } ) {
	let cache = preloadedData;

	async function get() {
		if ( cache ) {
			return cache;
		}

		const user = await apiFetch( {
			path: '/wp/v2/users/me',
		} );

		cache = user?.meta?.persisted_preferences;

		return cache;
	}

	async function set( newData ) {
		cache = { ...newData };

		return apiFetch( {
			path: '/wp/v2/users/me',
			method: 'PUT',
			data: {
				meta: {
					persisted_preferences: newData,
				},
			},
		} );
	}

	return {
		get,
		set,
	};
}
