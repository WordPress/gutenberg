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
 *
 *
 * @param {Object} options
 * @param {Object} options.preloadedData          Any persisted data that should be preloaded.
 * @param {number} options.requestDebounceMS      Debounce requests to the API so that they only occur
 *                                                don't swamp the server.
 * @param {string} options.localStorageRestoreKey The key to use for restoring the localStorage backup.
 *
 * @return {Object} A database persistence layer.
 */
export default function create( {
	localStorageRestoreKey,
	preloadedData,
	requestDebounceMS = 2500,
} ) {
	let cache = preloadedData;
	const debounce = createAsyncDebounce( requestDebounceMS );
	const localStorage = window.localStorage;

	async function get() {
		if ( cache ) {
			return cache;
		}

		const user = await apiFetch( {
			path: '/wp/v2/users/me',
		} );

		const serverData = user?.meta?.persisted_preferences;
		const localData = JSON.parse(
			localStorage.getItem( localStorageRestoreKey )
		);
		const serverTimestamp = serverData?.__timestamp ?? 0;
		const localTimestamp = localData?.__timestamp ?? 0;

		// Prefer server data if it exists and is more recent.
		// Otherwise fallback to localStorage data.
		if ( serverData && serverTimestamp > localTimestamp ) {
			cache = serverData;
		} else if ( localData ) {
			cache = localData;
		} else {
			cache = {};
		}

		return cache;
	}

	async function set( newData ) {
		const dataWithTimestamp = { ...newData, __timestamp: Date.now() };
		cache = dataWithTimestamp;

		// Store data in local storage as a fallback. If for some reason the
		// api request does not complete, this data can be used to restore
		// preferences.
		localStorage.setItem(
			localStorageRestoreKey,
			JSON.stringify( dataWithTimestamp )
		);

		// The user meta endpoint seems susceptible to errors when consecutive
		// requests are made in quick succession. Ensure there's a gap between
		// any consecutive requests.
		debounce( () =>
			apiFetch( {
				path: '/wp/v2/users/me',
				method: 'PUT',
				// `keepalive` will still send the request in the background,
				// even when a browser unload event might interrupt it.
				// This should hopefully make things more resilient.
				// This does have a size limit of 64kb, but the data is usually
				// much less.
				keepalive: true,
				data: {
					meta: {
						persisted_preferences: dataWithTimestamp,
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
