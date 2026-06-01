/**
 * Internal dependencies
 */
import type { RequestUtils } from './index';

/**
 * Reset user preferences
 *
 * @param this Request utils.
 */
export async function resetPreferences( this: RequestUtils ) {
	await this.rest( {
		path: '/wp/v2/users/me',
		method: 'PUT',
		data: {
			meta: {
				persisted_preferences: {},
			},
		},
	} );
}

/**
 * Set scoped user preferences via the REST API.
 *
 * Reads the current persisted preferences, merges the new values under the
 * given scope, and writes them back.
 *
 * @param this        Request utils.
 * @param scope       The preference scope (e.g. 'core/edit-post').
 * @param preferences Key/value map of preference names to values.
 */
export async function setPreferences(
	this: RequestUtils,
	scope: string,
	preferences: Record< string, any >
) {
	const user = await this.rest< {
		meta: { persisted_preferences: Record< string, any > };
	} >( {
		path: '/wp/v2/users/me',
		method: 'GET',
		params: { context: 'edit' },
	} );

	const currentPreferences = user.meta?.persisted_preferences ?? {};

	await this.rest( {
		path: '/wp/v2/users/me',
		method: 'PUT',
		data: {
			meta: {
				persisted_preferences: {
					...currentPreferences,
					[ scope ]: {
						...( currentPreferences[ scope ] ?? {} ),
						...preferences,
					},
				},
			},
		},
	} );
}
