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
	receiveUserQuery,
	receiveEntityRecords,
	receiveThemeSupportsFromIndex,
} from './actions';
import { getEntity } from './entities';

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
 * Requests authors from the REST API.
 */
export async function* getAuthors() {
	const users = await apiRequest( { path: '/wp/v2/users/?who=authors' } );
	yield receiveUserQuery( 'authors', users );
}

/**
 * Requests a entity's record from the REST API.
 *
 * @param {Object} state  State tree
 * @param {string} kind   Entity kind.
 * @param {string} name   Entity name.
 * @param {number} key    Record's key
 */
export async function* getEntityRecord( state, kind, name, key ) {
	const entity = getEntity( kind, name );
	const record = await apiRequest( { path: `${ entity.baseUrl }/${ key }?context=edit` } );
	yield receiveEntityRecords( kind, name, record );
}

/**
 * Requests theme supports data from the index.
 */
export async function* getThemeSupports() {
	const index = await apiRequest( { path: '/' } );
	yield receiveThemeSupportsFromIndex( index );
}
