/**
 * External dependencies
 */
import { find, includes, get, compact, uniq } from 'lodash';

/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { STORE_NAME } from './name';
import { getKindEntities, DEFAULT_ENTITY_KEY } from './entities';
import { forwardResolver, getNormalizedCommaSeparable } from './utils';

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
	if ( ! entity || entity?.__experimentalNoFetch ) {
		return;
	}

	const lock = await dispatch.__unstableAcquireStoreLock(
		STORE_NAME,
		[ 'entities', 'data', kind, name, key ],
		{ exclusive: false }
	);

	try {
		if ( query !== undefined && query._fields ) {
			// If requesting specific fields, items and query association to said
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
		const path = addQueryArgs( entity.baseURL + ( key ? '/' + key : '' ), {
			...entity.baseURLParams,
			...query,
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
		dispatch.receiveEntityRecords( kind, name, record, query );
	} finally {
		dispatch.__unstableReleaseStoreLock( lock );
	}
};

/**
 * Requests an entity's record from the REST API.
 */
export const getRawEntityRecord = forwardResolver( 'getEntityRecord' );

/**
 * Requests an entity's record from the REST API.
 */
export const getEditedEntityRecord = forwardResolver( 'getEntityRecord' );

/**
 * Requests the entity's records from the REST API.
 *
 * @param {string}  kind  Entity kind.
 * @param {string}  name  Entity name.
 * @param {Object?} query Query Object.
 */
export const getEntityRecords = ( kind, name, query = {} ) => async ( {
	dispatch,
} ) => {
	const entities = await dispatch( getKindEntities( kind ) );
	const entity = find( entities, { kind, name } );
	if ( ! entity || entity?.__experimentalNoFetch ) {
		return;
	}

	const lock = await dispatch.__unstableAcquireStoreLock(
		STORE_NAME,
		[ 'entities', 'data', kind, name ],
		{ exclusive: false }
	);

	try {
		if ( query._fields ) {
			// If requesting specific fields, items and query association to said
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
			...entity.baseURLParams,
			...query,
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

		dispatch.receiveEntityRecords( kind, name, records, query );

		// When requesting all fields, the list of results can be used to
		// resolve the `getEntityRecord` selector in addition to `getEntityRecords`.
		// See https://github.com/WordPress/gutenberg/pull/26575
		if ( ! query?._fields && ! query.context ) {
			const key = entity.key || DEFAULT_ENTITY_KEY;
			const resolutionsArgs = records
				.filter( ( record ) => record[ key ] )
				.map( ( record ) => [ kind, name, record[ key ] ] );

			dispatch( {
				type: 'START_RESOLUTIONS',
				selectorName: 'getEntityRecord',
				args: resolutionsArgs,
			} );
			dispatch( {
				type: 'FINISH_RESOLUTIONS',
				selectorName: 'getEntityRecord',
				args: resolutionsArgs,
			} );
		}
	} finally {
		dispatch.__unstableReleaseStoreLock( lock );
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
export const getCurrentTheme = () => async ( { dispatch, resolveSelect } ) => {
	const activeThemes = await resolveSelect.getEntityRecords(
		'root',
		'theme',
		{ status: 'active' }
	);

	dispatch.receiveCurrentTheme( activeThemes[ 0 ] );
};

/**
 * Requests theme supports data from the index.
 */
export const getThemeSupports = forwardResolver( 'getCurrentTheme' );

/**
 * Requests a preview from the from the Embed API.
 *
 * @param {string} url URL to get the preview for.
 */
export const getEmbedPreview = ( url ) => async ( { dispatch } ) => {
	try {
		const embedProxyResponse = await apiFetch( {
			path: addQueryArgs( '/oembed/1.0/proxy', { url } ),
		} );
		dispatch.receiveEmbedPreview( url, embedProxyResponse );
	} catch ( error ) {
		// Embed API 404s if the URL cannot be embedded, so we have to catch the error from the apiRequest here.
		dispatch.receiveEmbedPreview( url, false );
	}
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
			method: 'OPTIONS',
			parse: false,
		} );
	} catch ( error ) {
		// Do nothing if our OPTIONS request comes back with an API error (4xx or
		// 5xx). The previously determined isAllowed value will remain in the store.
		return;
	}

	// Optional chaining operator is used here because the API requests don't
	// return the expected result in the native version. Instead, API requests
	// only return the result, without including response properties like the headers.
	const allowHeader = response.headers?.get( 'allow' );
	const key = compact( [ action, resource, id ] ).join( '/' );
	const isAllowed = includes( allowHeader, method );
	dispatch.receiveUserPermission( key, isAllowed );
};

/**
 * Checks whether the current user can perform the given action on the given
 * REST resource.
 *
 * @param {string} kind     Entity kind.
 * @param {string} name     Entity name.
 * @param {string} recordId Record's id.
 */
export const canUserEditEntityRecord = ( kind, name, recordId ) => async ( {
	dispatch,
} ) => {
	const entities = await dispatch( getKindEntities( kind ) );
	const entity = find( entities, { kind, name } );
	if ( ! entity ) {
		return;
	}

	const resource = entity.__unstable_rest_base;
	await dispatch( canUser( 'update', resource, recordId ) );
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
 * @param {string} link Link.
 */
export const __experimentalGetTemplateForLink = ( link ) => async ( {
	dispatch,
	resolveSelect,
} ) => {
	// Ideally this should be using an apiFetch call
	// We could potentially do so by adding a "filter" to the `wp_template` end point.
	// Also it seems the returned object is not a regular REST API post type.
	let template;
	try {
		template = await window
			.fetch( addQueryArgs( link, { '_wp-find-template': true } ) )
			.then( ( res ) => res.json() )
			.then( ( { data } ) => data );
	} catch ( e ) {
		// For non-FSE themes, it is possible that this request returns an error.
	}

	if ( ! template ) {
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

__experimentalGetTemplateForLink.shouldInvalidate = ( action ) => {
	return (
		( action.type === 'RECEIVE_ITEMS' || action.type === 'REMOVE_ITEMS' ) &&
		action.invalidateCache &&
		action.kind === 'postType' &&
		action.name === 'wp_template'
	);
};

export const __experimentalGetCurrentGlobalStylesId = () => async ( {
	dispatch,
	resolveSelect,
} ) => {
	const activeThemes = await resolveSelect.getEntityRecords(
		'root',
		'theme',
		{ status: 'active' }
	);
	const globalStylesURL = get( activeThemes, [
		0,
		'_links',
		'wp:user-global-styles',
		0,
		'href',
	] );
	if ( globalStylesURL ) {
		const globalStylesObject = await apiFetch( {
			url: globalStylesURL,
		} );
		dispatch.__experimentalReceiveCurrentGlobalStylesId(
			globalStylesObject.id
		);
	}
};

export const __experimentalGetCurrentThemeBaseGlobalStyles = () => async ( {
	resolveSelect,
	dispatch,
} ) => {
	const currentTheme = await resolveSelect.getCurrentTheme();
	const themeGlobalStyles = await apiFetch( {
		path: `/wp/v2/global-styles/themes/${ currentTheme.stylesheet }`,
	} );
	dispatch.__experimentalReceiveThemeBaseGlobalStyles(
		currentTheme.stylesheet,
		themeGlobalStyles
	);
};

export const __experimentalGetCurrentThemeGlobalStylesVariations = () => async ( {
	resolveSelect,
	dispatch,
} ) => {
	const currentTheme = await resolveSelect.getCurrentTheme();
	const variations = await apiFetch( {
		path: `/wp/v2/global-styles/themes/${ currentTheme.stylesheet }/variations`,
	} );
	dispatch.__experimentalReceiveThemeGlobalStyleVariations(
		currentTheme.stylesheet,
		variations
	);
};
