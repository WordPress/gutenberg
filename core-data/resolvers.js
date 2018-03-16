/**
 * Internal dependencies
 */
import { receiveCategories } from './actions';

/**
 * Requests categories from the REST API, returning a promise resolving to an
 * action object for receiving categories.
 *
 * @return {Promise<Object>} Categories request promise.
 */
export async function getCategories() {
	const categories = await wp.apiRequest( { path: '/wp/v2/categories' } );
	return receiveCategories( categories );
}
