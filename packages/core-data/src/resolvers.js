/**
 * External dependencies
 */
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import {
	receiveUserQuery,
	receiveEntityRecords,
	receiveThemeSupportsFromIndex,
	receiveEmbedPreview,
} from './actions';
import { getKindEntities } from './entities';
import { apiFetch } from './controls';

/**
 * Requests authors from the REST API.
 */
export function* getAuthors() {
	const users = yield apiFetch( { path: '/wp/v2/users/?who=authors&per_page=100' } );
	yield receiveUserQuery( 'authors', users );
}

/**
 * Request a single author from the REST API.
 *
 * @param {Object} state  State tree.
 * @param {string} id     Author id.
 */
export function* getAuthor( state, id = '' ) {
	const users = yield apiFetch( { path: `/wp/v2/users/${ id }?who=authors&per_page=100` } );
	yield receiveUserQuery( 'author', users );
}

/**
 * Requests an entity's record from the REST API.
 *
 * @param {string} kind   Entity kind.
 * @param {string} name   Entity name.
 * @param {number} key    Record's key
 */
export function* getEntityRecord( kind, name, key ) {
	const entities = yield getKindEntities( kind );
	const entity = find( entities, { kind, name } );
	if ( ! entity ) {
		return;
	}
	const record = yield apiFetch( { path: `${ entity.baseURL }/${ key }?context=edit` } );
	yield receiveEntityRecords( kind, name, record );
}

/**
 * Requests the entity's records from the REST API.
 *
 * @param {string}  kind   Entity kind.
 * @param {string}  name   Entity name.
 * @param {Object?} query  Query Object.
 */
export function* getEntityRecords( kind, name, query = {} ) {
	const entities = yield getKindEntities( kind );
	const entity = find( entities, { kind, name } );
	if ( ! entity ) {
		return;
	}
	const path = addQueryArgs( entity.baseURL, {
		...query,
		context: 'edit',
	} );
	const records = yield apiFetch( { path } );
	yield receiveEntityRecords( kind, name, Object.values( records ), query );
}

/**
 * Requests theme supports data from the index.
 */
export function* getThemeSupports() {
	const index = yield apiFetch( { path: '/' } );
	yield receiveThemeSupportsFromIndex( index );
}

/**
 * Requests a preview from the from the Embed API.
 *
 * @param {string} url   URL to get the preview for.
 */
export function* getEmbedPreview( url ) {
	try {
		const embedProxyResponse = yield apiFetch( { path: addQueryArgs( '/oembed/1.0/proxy', { url } ) } );
		yield receiveEmbedPreview( url, embedProxyResponse );
	} catch ( error ) {
		// Embed API 404s if the URL cannot be embedded, so we have to catch the error from the apiRequest here.
		yield receiveEmbedPreview( url, false );
	}
}
