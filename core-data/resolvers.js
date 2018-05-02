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
	receiveMedia,
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
 * Requests a entity's record from the REST API.
 *
 * @param {Object} state       State tree
 * @param {string} kind        Entity kind.
 * @param {string} name        Entity name.
 * @param {number} primaryKey  Record's Primary key
 */
export async function* getEntityRecord( state, kind, name, primaryKey ) {
	const entity = getEntity( kind, name );
	const record = await apiRequest( { path: `${ entity.baseUrl }/${ primaryKey }?context=edit` } );
	yield receiveEntityRecords( kind, name, record );
}

/**
 * Requests theme supports data from the index.
 */
export async function* getThemeSupports() {
	const index = await apiRequest( { path: '/' } );
	yield receiveThemeSupportsFromIndex( index );
}
