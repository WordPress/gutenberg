/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import createAsyncDebounce from './create-async-debounce';

/**
 * Creates a database persistence layer, storing data in the user meta.
 *
 * @param {Object} options
 * @param {Object} options.preloadedData     Any persisted data that should be preloaded.
 * @param {number} options.requestDebounceMS Throttle requests to the API so that they only
 *                                           happen every n milliseconds.
 *
 * @return {Object} A database persistence layer.
 */
export default function create( { preloadedData, requestDebounceMS = 2500 } ) {
	let cache = preloadedData;
	const debounce = createAsyncDebounce( requestDebounceMS );

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

		// The user meta endpoint seems susceptible to errors when consecutive
		// requests are made in quick succession. Ensure there's a gap between
		// any consecutive requests.
		debounce( () =>
			apiFetch( {
				path: '/wp/v2/users/me',
				method: 'PUT',
				// `keepalive` will still send the request in the background,
				// even when a browser unload event might interrupt it.
				keepalive: true,
				data: {
					meta: {
						persisted_preferences: newData,
					},
				},
			} )
		);
	}

	return {
		get,
		set,
	};
}
