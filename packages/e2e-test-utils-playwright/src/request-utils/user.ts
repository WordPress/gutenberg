/**
 * Internal dependencies
 */
import type { RequestUtils } from './index';

/**
 * Get current user
 *
 * @param {this} this Request utils.
 */
export async function getCurrentUser( this: RequestUtils ) {
	const response = await this.rest( {
		path: '/wp/v2/users/me',
		method: 'GET',
	} );

	return response;
}
