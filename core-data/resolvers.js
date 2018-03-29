/**
 * WordPress dependencies
 */
import apiRequest from '@wordpress/api-request';

/**
 * Internal dependencies
 */
import {
	setRequested,
	receiveTerms,
	receiveMedia,
	receivePostTypes,
} from './actions';

/**
 * Requests categories from the REST API, yielding action objects on request
 * progress.
 */
export async function* getCategories() {
	yield setRequested( 'terms', 'categories' );
	const categories = await apiRequest( { path: '/wp/v2/categories' } );
	yield receiveTerms( 'categories', categories );
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

/**
 * Requests a post type element from the REST API.
 *
 * @param {Object} state State tree
 * @param {number} slug  Post Type slug
 */
export async function* getPostType( state, slug ) {
	const postType = await apiRequest( { path: `/wp/v2/types/${ slug }?context=edit` } );
	yield receivePostTypes( postType );
}
