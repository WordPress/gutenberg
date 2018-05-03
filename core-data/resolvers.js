/**
 * External dependencies
 */
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import apiRequest from '@wordpress/api-request';
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	receiveTerms,
	receiveUserQuery,
	receiveEntityRecords,
	receiveThemeSupportsFromIndex,
	addEntities,
} from './actions';
import {
	hasEntitiesByKind,
} from './selectors';
import { kinds } from './entities';

/**
 * Requests categories from the REST API, yielding action objects on request
 * progress.
 */
export async function* getCategories() {
	const categories = await apiRequest( { path: '/wp/v2/categories?per_page=-1' } );
	yield receiveTerms( 'categories', categories );
}

/**
 * Requests authors from the REST API.
 */
export async function* getAuthors() {
	const users = await apiRequest( { path: '/wp/v2/users/?who=authors&per_page=-1' } );
	yield receiveUserQuery( 'authors', users );
}

async function* loadKindEntities( state, kind ) {
	const hasEntities = hasEntitiesByKind( state, kind );

	if ( hasEntities ) {
		return;
	}

	const kindConfig = find( kinds, { name: kind } );
	if ( ! kindConfig ) {
		return;
	}

	const entities = await kindConfig.loadEntities();
	yield addEntities( entities );
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
	yield* loadKindEntities( state, kind );
	// I can't use the state because it's outdated at this point
	const entity = select( 'core' ).getEntity( kind, name );
	if ( ! entity ) {
		return;
	}
	const record = await apiRequest( { path: `${ entity.baseUrl }/${ key }?context=edit` } );
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
	const entity = getEntity( kind, name );
	const records = await apiRequest( { path: `${ entity.baseUrl }?context=edit` } );
	yield receiveEntityRecords( kind, name, Object.values( records ) );
}

/**
 * Requests theme supports data from the index.
 */
export async function* getThemeSupports() {
	const index = await apiRequest( { path: '/' } );
	yield receiveThemeSupportsFromIndex( index );
}
