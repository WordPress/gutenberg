/**
 * External dependencies
 */
import { find, includes, get, hasIn, compact, uniq } from 'lodash';

/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';
import deprecated from '@wordpress/deprecated';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { getKindEntities, DEFAULT_ENTITY_KEY } from './entities';
import { ifNotResolved, getNormalizedCommaSeparable } from './utils';
import {
	__unstableAcquireStoreLock,
	__unstableReleaseStoreLock,
} from './locks';

/**
 * Requests authors from the REST API.
 *
 * @param {Object|undefined} query Optional object of query parameters to
 *                                 include with request.
 */
export const getAuthors = ( query ) => async ( { dispatch } ) => {
	const path = addQueryArgs(
		'/wp/v2/users/?who=authors&per_page=100',
		query
	);
	const users = await apiFetch( { path } );
	dispatch.receiveUserQuery( path, users );
};

/**
 * Temporary approach to resolving editor access to author queries.
 *
 * @param {number} id The author id.
 */
export const __unstableGetAuthor = ( id ) => async ( { dispatch } ) => {
	const path = `/wp/v2/users?who=authors&include=${ id }`;
	const users = await apiFetch( { path } );
	dispatch.receiveUserQuery( 'author', users );
};

/**
 * Requests the current user from the REST API.
 */
export const getCurrentUser = () => async ( { dispatch } ) => {
	const currentUser = await apiFetch( { path: '/wp/v2/users/me' } );
	dispatch.receiveCurrentUser( currentUser );
};

/**
 * Requests an entity's record from the REST API.
 *
 * @param {string}           kind  Entity kind.
 * @param {string}           name  Entity name.
 * @param {number|string}    key   Record's key
 * @param {Object|undefined} query Optional object of query parameters to
 *                                 include with request.
 */
export const getEntityRecord = ( kind, name, key = '', query ) => async ( {
	select,
	dispatch,
} ) => {
	const entities = await dispatch( getKindEntities( kind ) );
	const entity = find( entities, { kind, name } );
	if ( ! entity ) {
		return;
	}

	const lock = await dispatch(
		__unstableAcquireStoreLock(
			'core',
			[ 'entities', 'data', kind, name, key ],
			{ exclusive: false }
		)
	);
	try {
		if ( query !== undefined && query._fields ) {
			// If requesting specific fields, items and query assocation to said
			// records are stored by ID reference. Thus, fields must always include
			// the ID.
			query = {
				...query,
				_fields: uniq( [
					...( getNormalizedCommaSeparable( query._fields ) || [] ),
					entity.key || DEFAULT_ENTITY_KEY,
				] ).join(),
			};
		}

		// Disable reason: While true that an early return could leave `path`
		// unused, it's important that path is derived using the query prior to
		// additional query modifications in the condition below, since those
		// modifications are relevant to how the data is tracked in state, and not
		// for how the request is made to the REST API.

		// eslint-disable-next-line @wordpress/no-unused-vars-before-return
		const path = addQueryArgs( entity.baseURL + '/' + key, {
			...query,
			context: 'edit',
		} );

		if ( query !== undefined ) {
			query = { ...query, include: [ key ] };

			// The resolution cache won't consider query as reusable based on the
			// fields, so it's tested here, prior to initiating the REST request,
			// and without causing `getEntityRecords` resolution to occur.
			const hasRecords = select.hasEntityRecords( kind, name, query );
			if ( hasRecords ) {
				return;
			}
		}

		const record = await apiFetch( { path } );
		await dispatch.receiveEntityRecords( kind, name, record, query );
	} catch ( error ) {
		// We need a way to handle and access REST API errors in state
		// Until then, catching the error ensures the resolver is marked as resolved.
	} finally {
		await dispatch( __unstableReleaseStoreLock( lock ) );
	}
};

/**
 * Requests an entity's record from the REST API.
 */
export const getRawEntityRecord = ifNotResolved(
	getEntityRecord,
	'getEntityRecord'
);

/**
 * Requests an entity's record from the REST API.
 */
export const getEditedEntityRecord = ifNotResolved(
	getRawEntityRecord,
	'getRawEntityRecord'
);

/**
 * Requests the entity's records from the REST API.
 *
 * @param {string}  kind   Entity kind.
 * @param {string}  name   Entity name.
 * @param {Object?} query  Query Object.
 */
export const getEntityRecords = ( kind, name, query = {} ) => async ( {
	dispatch,
} ) => {
	const entities = await dispatch( getKindEntities( kind ) );
	const entity = find( entities, { kind, name } );
	if ( ! entity ) {
		return;
	}

	const lock = await dispatch(
		__unstableAcquireStoreLock(
			'core',
			[ 'entities', 'data', kind, name ],
			{ exclusive: false }
		)
	);
	try {
		if ( query._fields ) {
			// If requesting specific fields, items and query assocation to said
			// records are stored by ID reference. Thus, fields must always include
			// the ID.
			query = {
				...query,
				_fields: uniq( [
					...( getNormalizedCommaSeparable( query._fields ) || [] ),
					entity.key || DEFAULT_ENTITY_KEY,
				] ).join(),
			};
		}

		const path = addQueryArgs( entity.baseURL, {
			...query,
			context: 'edit',
		} );

		let records = Object.values( await apiFetch( { path } ) );
		// If we request fields but the result doesn't contain the fields,
		// explicitely set these fields as "undefined"
		// that way we consider the query "fullfilled".
		if ( query._fields ) {
			records = records.map( ( record ) => {
				query._fields.split( ',' ).forEach( ( field ) => {
					if ( ! record.hasOwnProperty( field ) ) {
						record[ field ] = undefined;
					}
				} );

				return record;
			} );
		}

		await dispatch.receiveEntityRecords( kind, name, records, query );
		// When requesting all fields, the list of results can be used to
		// resolve the `getEntityRecord` selector in addition to `getEntityRecords`.
		// See https://github.com/WordPress/gutenberg/pull/26575
		if ( ! query?._fields ) {
			const key = entity.key || DEFAULT_ENTITY_KEY;
			for ( const record of records ) {
				if ( record[ key ] ) {
					dispatch( {
						type: 'START_RESOLUTION',
						selectorName: 'getEntityRecord',
						args: [ kind, name, record[ key ] ],
					} );
					dispatch( {
						type: 'FINISH_RESOLUTION',
						selectorName: 'getEntityRecord',
						args: [ kind, name, record[ key ] ],
					} );
				}
			}
		}
	} finally {
		await dispatch( __unstableReleaseStoreLock( lock ) );
	}
};

getEntityRecords.shouldInvalidate = ( action, kind, name ) => {
	return (
		( action.type === 'RECEIVE_ITEMS' || action.type === 'REMOVE_ITEMS' ) &&
		action.invalidateCache &&
		kind === action.kind &&
		name === action.name
	);
};

/**
 * Requests the current theme.
 */
export const getCurrentTheme = () => async ( { dispatch } ) => {
	const activeThemes = await apiFetch( {
		path: '/wp/v2/themes?status=active',
	} );
	return dispatch.receiveCurrentTheme( activeThemes[ 0 ] );
};

/**
 * Requests theme supports data from the index.
 */
export const getThemeSupports = () => async ( { dispatch } ) => {
	const activeThemes = await apiFetch( {
		path: '/wp/v2/themes?status=active',
	} );
	return dispatch.receiveThemeSupports( activeThemes[ 0 ].theme_supports );
};

/**
 * Requests a preview from the from the Embed API.
 *
 * @param {string} url   URL to get the preview for.
 */
export const getEmbedPreview = ( url ) => async ( { dispatch } ) => {
	try {
		const embedProxyResponse = await apiFetch( {
			path: addQueryArgs( '/oembed/1.0/proxy', { url } ),
		} );
		return dispatch.receiveEmbedPreview( url, embedProxyResponse );
	} catch ( error ) {
		// Embed API 404s if the URL cannot be embedded, so we have to catch the error from the apiRequest here.
		return dispatch.receiveEmbedPreview( url, false );
	}
};

/**
 * Requests Upload Permissions from the REST API.
 *
 * @deprecated since 5.0. Callers should use the more generic `canUser()` selector instead of
 *            `hasUploadPermissions()`, e.g. `canUser( 'create', 'media' )`.
 */
export const hasUploadPermissions = () => async ( { dispatch } ) => {
	deprecated( "select( 'core' ).hasUploadPermissions()", {
		alternative: "select( 'core' ).canUser( 'create', 'media' )",
	} );
	return dispatch.canUser( 'create', 'media' );
};

/**
 * Checks whether the current user can perform the given action on the given
 * REST resource.
 *
 * @param {string}  action   Action to check. One of: 'create', 'read', 'update',
 *                           'delete'.
 * @param {string}  resource REST resource to check, e.g. 'media' or 'posts'.
 * @param {?string} id       ID of the rest resource to check.
 */
export const canUser = ( action, resource, id ) => async ( { dispatch } ) => {
	const methods = {
		create: 'POST',
		read: 'GET',
		update: 'PUT',
		delete: 'DELETE',
	};

	const method = methods[ action ];
	if ( ! method ) {
		throw new Error( `'${ action }' is not a valid action.` );
	}

	const path = id ? `/wp/v2/${ resource }/${ id }` : `/wp/v2/${ resource }`;

	let response;
	try {
		response = await apiFetch( {
			path,
			// Ideally this would always be an OPTIONS request, but unfortunately there's
			// a bug in the REST API which causes the Allow header to not be sent on
			// OPTIONS requests to /posts/:id routes.
			// https://core.trac.wordpress.org/ticket/45753
			method: id ? 'GET' : 'OPTIONS',
			parse: false,
		} );
	} catch ( error ) {
		// Do nothing if our OPTIONS request comes back with an API error (4xx or
		// 5xx). The previously determined isAllowed value will remain in the store.
		return;
	}

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

	const key = compact( [ action, resource, id ] ).join( '/' );
	const isAllowed = includes( allowHeader, method );
	dispatch.receiveUserPermission( key, isAllowed );
};

/**
 * Request autosave data from the REST API.
 *
 * @param {string} postType The type of the parent post.
 * @param {number} postId   The id of the parent post.
 */
export const getAutosaves = ( postType, postId ) => async ( {
	dispatch,
	resolveSelect,
} ) => {
	const { rest_base: restBase } = await resolveSelect.getPostType( postType );
	const autosaves = await apiFetch( {
		path: `/wp/v2/${ restBase }/${ postId }/autosaves?context=edit`,
	} );

	if ( autosaves && autosaves.length ) {
		dispatch.receiveAutosaves( postId, autosaves );
	}
};

/**
 * Request autosave data from the REST API.
 *
 * This resolver exists to ensure the underlying autosaves are fetched via
 * `getAutosaves` when a call to the `getAutosave` selector is made.
 *
 * @param {string} postType The type of the parent post.
 * @param {number} postId   The id of the parent post.
 */
export const getAutosave = ( postType, postId ) => async ( {
	resolveSelect,
} ) => {
	await resolveSelect.getAutosaves( postType, postId );
};

/**
 * Retrieve the frontend template used for a given link.
 *
 * @param {string} link  Link.
 */
export const __experimentalGetTemplateForLink = ( link ) => async ( {
	dispatch,
	resolveSelect,
} ) => {
	// Ideally this should be using an apiFetch call
	// We could potentially do so by adding a "filter" to the `wp_template` end point.
	// Also it seems the returned object is not a regular REST API post type.
	const template = await window
		.fetch(
			addQueryArgs( link, {
				'_wp-find-template': true,
			} )
		)
		.then( ( res ) => res.json() )
		.then( ( res ) => res.data );

	if ( template === null ) {
		return;
	}

	const record = await resolveSelect.getEntityRecord(
		'postType',
		'wp_template',
		template.id
	);

	if ( record ) {
		dispatch.receiveEntityRecords( 'postType', 'wp_template', [ record ], {
			'find-template': link,
		} );
	}
};
