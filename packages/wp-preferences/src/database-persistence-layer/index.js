/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

export default function createDatabasePersistenceLayer() {
	let data;

	async function get() {
		if ( data ) {
			return data;
		}

		const userData = await apiFetch( {
			path: '/wp/v2/users/me',
		} );

		data = userData?.meta?.persisted_preferences;

		return data;
	}

	async function set( newData ) {
		data = { ...newData };

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
