/**
 * External dependencies
 */
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import {
	fetchFromAPI,
	receiveTerms,
	receiveUserQuery,
	receiveEntityRecords,
	receiveThemeSupportsFromIndex,
} from './actions';
import { getKindEntities } from './entities';

/**
 * Requests categories from the REST API, yielding action objects on request
 * progress.
 */
export function* getCategories() {
	const categories = yield fetchFromAPI( { path: '/wp/v2/categories?per_page=-1' } );
	yield receiveTerms( 'categories', categories );
}

/**
 * Requests authors from the REST API.
 */
export function* getAuthors() {
	const users = yield fetchFromAPI( { path: '/wp/v2/users/?who=authors&per_page=-1' } );
	yield receiveUserQuery( 'authors', users );
}

/**
 * Requests an entity's record from the REST API.
 *
 * @param {Object} state  State tree
 * @param {string} kind   Entity kind.
 * @param {string} name   Entity name.
 * @param {number} key    Record's key
 */
export async function* getEntityRecord( state, kind, name, key ) {
	const entities = yield* await getKindEntities( state, kind );
	const entity = find( entities, { kind, name } );
	if ( ! entity ) {
		return;
	}
	const record = await apiFetch( { path: `${ entity.baseURL }/${ key }?context=edit` } );
	yield receiveEntityRecords( kind, name, record );
}

/**
 * Requests the entity's records from the REST API.
 *
 * @param {Object} state  State tree
 * @param {string} kind   Entity kind.
 * @param {string} name   Entity name.
 */
export async function* getEntityRecords( state, kind, name ) {
	const entities = yield* await getKindEntities( state, kind );
	const entity = find( entities, { kind, name } );
	if ( ! entity ) {
		return;
	}
	const records = await apiFetch( { path: `${ entity.baseURL }?context=edit` } );
	yield receiveEntityRecords( kind, name, Object.values( records ) );
}

/**
 * Requests theme supports data from the index.
 */
export function* getThemeSupports() {
	const index = yield fetchFromAPI( { path: '/' } );
	yield receiveThemeSupportsFromIndex( index );
}
