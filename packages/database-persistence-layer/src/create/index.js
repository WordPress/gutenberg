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
	let abortController = null;

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

		abortController?.abort();

		abortController =
			typeof AbortController === 'undefined'
				? undefined
				: new AbortController();

		const promise = apiFetch( {
			path: '/wp/v2/users/me',
			method: 'PUT',
			data: {
				meta: {
					persisted_preferences: newData,
				},
			},
			signal: abortController?.signal,
		} )
			.catch( ( error ) => {
				if ( error.code !== error.ABORT_ERR ) {
					throw error;
				}
			} )
			.finally( () => {
				abortController = null;
			} );

		return promise;
	}

	return {
		get,
		set,
	};
}
