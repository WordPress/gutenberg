/**
 * WordPress dependencies
 */
import apiRequest from '@wordpress/api-request';

/**
 * Internal dependencies
 */
import { setRequested, receiveTerms, receiveMedia } from './actions';
import { getTaxonomyRESTBase } from './settings';

/**
 * Requests terms from the REST API, yielding action objects on request
 * progress.
 *
 * @param {string} taxonomy Taxonomy for which terms should be requested.
 */
export async function* getTerms( taxonomy ) {
	yield setRequested( 'terms', taxonomy );
	const restBase = getTaxonomyRESTBase( taxonomy );
	const terms = await apiRequest( { path: '/wp/v2/' + restBase } );
	yield receiveTerms( taxonomy, terms );
}

/**
 * Requests categories from the REST API, yielding action objects on request
 * progress.
 *
 * @return {AsyncGenerator} Terms request generator.
 */
export function getCategories() {
	return getTerms( 'category' );
}

/**
 * Requests a media element from the REST API.
 *
 * @param {Object} state State tree
 * @param {number} id    Media id
 */
export async function* getMedia( state, id ) {
	const media = await apiRequest( { path: `/wp/v2/media/${ id }` } );
	yield receiveMedia( media );
}
