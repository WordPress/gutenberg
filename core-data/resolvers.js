/**
 * Internal dependencies
 */
import { setRequested, receiveTerms } from './actions';

/**
 * Requests categories from the REST API, yielding action objects on request
 * progress.
 */
export async function* getCategories() {
	const categories = await wp.apiRequest( { path: '/wp/v2/categories' } );
	yield setRequested( 'terms', 'categories' );
	yield receiveTerms( 'categories', categories );
}
