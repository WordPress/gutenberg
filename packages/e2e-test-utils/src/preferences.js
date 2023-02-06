/**
 * Internal dependencies
 */
import { rest } from './rest-api';

/**
 * Clears all user meta preferences.
 */
export async function resetPreferences() {
	await rest( {
		path: '/wp/v2/users/me',
		method: 'PUT',
		data: {
			meta: {
				persisted_preferences: {},
			},
		},
	} );
}
