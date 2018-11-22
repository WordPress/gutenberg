/**
 * External dependencies
 */
import { find, includes, get, hasIn } from 'lodash';

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
	receiveThemeSupports,
	receiveEmbedPreview,
	receiveUploadPermissions,
} from './actions';
import { getKindEntities } from './entities';
import { apiFetch } from './controls';

/**
 * Requests authors from the REST API.
 */
export function* getAuthors() {
	const users = yield apiFetch( { path: '/wp/v2/users/?who=authors&per_page=-1' } );
	yield receiveUserQuery( 'authors', users );
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

getEntityRecords.shouldInvalidate = ( action, kind, name ) => {
	return (
		action.type === 'RECEIVE_ITEMS' &&
		action.invalidateCache &&
		kind === action.kind &&
		name === action.name
	);
};

/**
 * Requests theme supports data from the index.
 */
export function* getThemeSupports() {
	const activeThemes = yield apiFetch( { path: '/wp/v2/themes?status=active' } );
	yield receiveThemeSupports( activeThemes[ 0 ].theme_supports );
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

/**
 * Requests Upload Permissions from the REST API.
 */
export function* hasUploadPermissions() {
	const response = yield apiFetch( { path: '/wp/v2/media', method: 'OPTIONS', parse: false } );

	let allowHeader;
	if ( hasIn( response, [ 'headers', 'get' ] ) ) {
		// If the request is fetched using the fetch api, the header can be
		// retrieved using the 'get' method.
		allowHeader = response.headers.get( 'allow' );
	} else {
		// If the request was preloaded server-side and is returned by the
		// preloading middleware, the header will be a simple property.
		allowHeader = get( response, [ 'headers', 'Allow' ], '' );
	}

	yield receiveUploadPermissions( includes( allowHeader, 'POST' ) );
}
