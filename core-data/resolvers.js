/**
 * WordPress dependencies
 */
import apiRequest from '@wordpress/api-request';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import {
	toggleIsRequestingTerms,
	receiveTerms,
	receiveUserQuery,
	receiveEntityRecords,
	receiveThemeSupportsFromIndex,
} from './actions';
import { getEntity } from './entities';
import { hasRequestedCategories } from './selectors';

/**
 * Requests categories from the REST API, yielding action objects on request
 * progress.
 */
export const getCategories = {
	fulfill: async function* ( state, query ) {
		yield toggleIsRequestingTerms( 'categories', query, true );
		const path = addQueryArgs( '/wp/v2/categories', query );
		const categories = await apiRequest( { path } );
		yield receiveTerms( 'categories', query, categories );
		yield toggleIsRequestingTerms( 'categories', query, false );
	},
	isFulfilled: hasRequestedCategories,
};

/**
 * Requests authors from the REST API.
 */
export async function* getAuthors() {
	const users = await apiRequest( { path: '/wp/v2/users/?who=authors&per_page=-1' } );
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
