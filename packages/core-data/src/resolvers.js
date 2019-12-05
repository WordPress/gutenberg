/**
 * External dependencies
 */
import { find, includes, get, hasIn, compact } from 'lodash';

/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import {
	receiveUserQuery,
	receiveCurrentUser,
	receiveEntityRecords,
	receiveThemeSupports,
	receiveEmbedPreview,
	receiveUserPermission,
	receiveAutosaves,
} from './actions';
import { getKindEntities } from './entities';
import { apiFetch, resolveSelect } from './controls';

/**
 * Requests authors from the REST API.
 */
export function* getAuthors() {
	const users = yield apiFetch( { path: '/wp/v2/users/?who=authors&per_page=-1' } );
	yield receiveUserQuery( 'authors', users );
}

/**
 * Requests the current user from the REST API.
 */
export function* getCurrentUser() {
	const currentUser = yield apiFetch( { path: '/wp/v2/users/me' } );
	yield receiveCurrentUser( currentUser );
}

/**
 * Requests an entity's record from the REST API.
 *
 * @param {string} kind   Entity kind.
 * @param {string} name   Entity name.
 * @param {number} key    Record's key
 */
export function* getEntityRecord( kind, name, key = '' ) {
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
 *
 * @deprecated since 5.0. Callers should use the more generic `canUser()` selector instead of
 *            `hasUploadPermissions()`, e.g. `canUser( 'create', 'media' )`.
 */
export function* hasUploadPermissions() {
	deprecated( "select( 'core' ).hasUploadPermissions()", {
		alternative: "select( 'core' ).canUser( 'create', 'media' )",
	} );
	yield* canUser( 'create', 'media' );
}

/**
 * Checks whether the current user can perform the given action on the given
 * REST resource.
 *
 * @param {string}  action   Action to check. One of 'create', 'read', 'update',
 *                           'delete', or a JSON Hyper Schema targetSchema key.
 * @param {string}  resource REST resource to check, e.g. 'media' or 'posts'.
 * @param {?string} id       ID of the rest resource to check.
 */
export function* canUser( action, resource, id ) {
	const methods = {
		create: 'POST',
		read: 'GET',
		update: 'PUT',
		delete: 'DELETE',
	};

	const isCustomAction = ! methods.hasOwnProperty( action );

	let path = '/wp/v2/' + resource;

	if ( id ) {
		path += '/' + id;
	}

	if ( isCustomAction ) {
		path = addQueryArgs( path, { context: 'edit' } );
	}

	let response;
	try {
		response = yield apiFetch( {
			path,
			// Ideally, this should only be a GET request if requesting details
			// of a custom action. Until required WordPress support reaches 5.3
			// or newer, the `id` condition must be included, due to a previous
			// bug in the REST API where the Allow header was not on OPTIONS
			// requests to /posts/:id routes.
			//
			// See: https://core.trac.wordpress.org/ticket/45753
			method: id || isCustomAction ? 'GET' : 'OPTIONS',

			// Only parse response as JSON if requesting permissions of a custom
			// actions. Non-custom actions derive permissions from the response
			// headers, which aren't available on the parsed result.
			parse: isCustomAction,
		} );
	} catch ( error ) {
		// Do nothing if our OPTIONS request comes back with an API error (4xx or
		// 5xx). The previously determined isAllowed value will remain in the store.
		return;
	}

	let isAllowed;
	if ( isCustomAction ) {
		isAllowed = hasIn( response, [ '_links', 'wp:action-' + action ] );
	} else {
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

		isAllowed = includes( allowHeader, methods[ action ] );
	}

	const key = compact( [ action, resource, id ] ).join( '/' );
	yield receiveUserPermission( key, isAllowed );
}

/**
 * Request autosave data from the REST API.
 *
 * @param {string} postType The type of the parent post.
 * @param {number} postId   The id of the parent post.
 */
export function* getAutosaves( postType, postId ) {
	const { rest_base: restBase } = yield resolveSelect( 'getPostType', postType );
	const autosaves = yield apiFetch( { path: `/wp/v2/${ restBase }/${ postId }/autosaves?context=edit` } );

	if ( autosaves && autosaves.length ) {
		yield receiveAutosaves( postId, autosaves );
	}
}

/**
 * Request autosave data from the REST API.
 *
 * This resolver exists to ensure the underlying autosaves are fetched via
 * `getAutosaves` when a call to the `getAutosave` selector is made.
 *
 * @param {string} postType The type of the parent post.
 * @param {number} postId   The id of the parent post.
 */
export function* getAutosave( postType, postId ) {
	yield resolveSelect( 'getAutosaves', postType, postId );
}
