/**
 * WordPress dependencies
 */
import apiRequest from '@wordpress/api-request';

/**
 * Internal dependencies
 */
import { setRequested, receiveTerms } from './actions';

/**
 * Requests categories from the REST API, yielding action objects on request
 * progress.
 */
export async function* getCategories() {
	yield setRequested( 'terms', 'categories' );
	const categories = await apiRequest( { path: '/wp/v2/categories' } );
	yield receiveTerms( 'categories', categories );
}
