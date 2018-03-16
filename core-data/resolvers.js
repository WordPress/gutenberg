/**
 * Internal dependencies
 */
import { setRequested, receiveCategories } from './actions';

/**
 * Requests categories from the REST API, yielding action objects on request
 * progress.
 */
export async function* getCategories() {
	yield setRequested( 'categories' );
	const categories = await wp.apiRequest( { path: '/wp/v2/categories' } );
	yield receiveCategories( categories );
}
