/**
 * External dependencies
 */
import { camelCase } from 'change-case';

/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';
import { decodeEntities } from '@wordpress/html-entities';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { STORE_NAME } from './name';
import { getOrLoadEntitiesConfig, DEFAULT_ENTITY_KEY } from './entities';
import { forwardResolver, getNormalizedCommaSeparable } from './utils';
import { getSyncProvider } from './sync';
import { fetchBlockPatterns } from './fetch';

/**
 * Requests authors from the REST API.
 *
 * @param {Object|undefined} query Optional object of query parameters to
 *                                 include with request.
 */
export const getAuthors =
	( query ) =>
	async ( { dispatch } ) => {
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
export const getCurrentUser =
	() =>
	async ( { dispatch } ) => {
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
 *                                 include with request. If requesting specific
 *                                 fields, fields must always include the ID.
 */
export const getEntityRecord =
	( kind, name, key = '', query ) =>
	async ( { select, dispatch } ) => {
		const configs = await dispatch( getOrLoadEntitiesConfig( kind ) );
		const entityConfig = configs.find(
			( config ) => config.name === name && config.kind === kind
		);
		if ( ! entityConfig || entityConfig?.__experimentalNoFetch ) {
			return;
		}

		const lock = await dispatch.__unstableAcquireStoreLock(
			STORE_NAME,
			[ 'entities', 'records', kind, name, key ],
			{ exclusive: false }
		);

		try {
			// Entity supports configs,
			// use the sync algorithm instead of the old fetch behavior.
			if (
				window.__experimentalEnableSync &&
				entityConfig.syncConfig &&
				! query
			) {
				if ( process.env.IS_GUTENBERG_PLUGIN ) {
					const objectId = entityConfig.getSyncObjectId( key );

					// Loads the persisted document.
					await getSyncProvider().bootstrap(
						entityConfig.syncObjectType,
						objectId,
						( record ) => {
							dispatch.receiveEntityRecords(
								kind,
								name,
								record,
								query
							);
						}
					);

					// Boostraps the edited document as well (and load from peers).
					await getSyncProvider().bootstrap(
						entityConfig.syncObjectType + '--edit',
						objectId,
						( record ) => {
							dispatch( {
								type: 'EDIT_ENTITY_RECORD',
								kind,
								name,
								recordId: key,
								edits: record,
								meta: {
									undo: undefined,
								},
							} );
						}
					);
				}
			} else {
				if ( query !== undefined && query._fields ) {
					// If requesting specific fields, items and query association to said
					// records are stored by ID reference. Thus, fields must always include
					// the ID.
					query = {
						...query,
						_fields: [
							...new Set( [
								...( getNormalizedCommaSeparable(
									query._fields
								) || [] ),
								entityConfig.key || DEFAULT_ENTITY_KEY,
							] ),
						].join(),
					};
				}

				// Disable reason: While true that an early return could leave `path`
				// unused, it's important that path is derived using the query prior to
				// additional query modifications in the condition below, since those
				// modifications are relevant to how the data is tracked in state, and not
				// for how the request is made to the REST API.

				// eslint-disable-next-line @wordpress/no-unused-vars-before-return
				const path = addQueryArgs(
					entityConfig.baseURL + ( key ? '/' + key : '' ),
					{
						...entityConfig.baseURLParams,
						...query,
					}
				);

				if ( query !== undefined ) {
					query = { ...query, include: [ key ] };

					// The resolution cache won't consider query as reusable based on the
					// fields, so it's tested here, prior to initiating the REST request,
					// and without causing `getEntityRecords` resolution to occur.
					const hasRecords = select.hasEntityRecords(
						kind,
						name,
						query
					);
					if ( hasRecords ) {
						return;
					}
				}

				const record = await apiFetch( { path } );
				dispatch.receiveEntityRecords( kind, name, record, query );
			}
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
 * @param {Object?} query Query Object. If requesting specific fields, fields
 *                        must always include the ID.
 */
export const getEntityRecords =
	( kind, name, query = {} ) =>
	async ( { dispatch } ) => {
		const configs = await dispatch( getOrLoadEntitiesConfig( kind ) );
		const entityConfig = configs.find(
			( config ) => config.name === name && config.kind === kind
		);
		if ( ! entityConfig || entityConfig?.__experimentalNoFetch ) {
			return;
		}

		const lock = await dispatch.__unstableAcquireStoreLock(
			STORE_NAME,
			[ 'entities', 'records', kind, name ],
			{ exclusive: false }
		);

		try {
			if ( query._fields ) {
				// If requesting specific fields, items and query association to said
				// records are stored by ID reference. Thus, fields must always include
				// the ID.
				query = {
					...query,
					_fields: [
						...new Set( [
							...( getNormalizedCommaSeparable( query._fields ) ||
								[] ),
							entityConfig.key || DEFAULT_ENTITY_KEY,
						] ),
					].join(),
				};
			}

			const path = addQueryArgs( entityConfig.baseURL, {
				...entityConfig.baseURLParams,
				...query,
			} );

			let records, meta;
			if ( entityConfig.supportsPagination && query.per_page !== -1 ) {
				const response = await apiFetch( { path, parse: false } );
				records = Object.values( await response.json() );
				meta = {
					totalItems: parseInt(
						response.headers.get( 'X-WP-Total' )
					),
				};
			} else {
				records = Object.values( await apiFetch( { path } ) );
			}

			// If we request fields but the result doesn't contain the fields,
			// explicitly set these fields as "undefined"
			// that way we consider the query "fulfilled".
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

			dispatch.receiveEntityRecords(
				kind,
				name,
				records,
				query,
				false,
				undefined,
				meta
			);

			// When requesting all fields, the list of results can be used to
			// resolve the `getEntityRecord` selector in addition to `getEntityRecords`.
			// See https://github.com/WordPress/gutenberg/pull/26575
			if ( ! query?._fields && ! query.context ) {
				const key = entityConfig.key || DEFAULT_ENTITY_KEY;
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
export const getCurrentTheme =
	() =>
	async ( { dispatch, resolveSelect } ) => {
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
 * Requests a preview from the Embed API.
 *
 * @param {string} url URL to get the preview for.
 */
export const getEmbedPreview =
	( url ) =>
	async ( { dispatch } ) => {
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
 * @param {string}  requestedAction Action to check. One of: 'create', 'read', 'update',
 *                                  'delete'.
 * @param {string}  resource        REST resource to check, e.g. 'media' or 'posts'.
 * @param {?string} id              ID of the rest resource to check.
 */
export const canUser =
	( requestedAction, resource, id ) =>
	async ( { dispatch, registry } ) => {
		const { hasStartedResolution } = registry.select( STORE_NAME );

		const resourcePath = id ? `${ resource }/${ id }` : resource;
		const retrievedActions = [ 'create', 'read', 'update', 'delete' ];

		if ( ! retrievedActions.includes( requestedAction ) ) {
			throw new Error( `'${ requestedAction }' is not a valid action.` );
		}

		// Prevent resolving the same resource twice.
		for ( const relatedAction of retrievedActions ) {
			if ( relatedAction === requestedAction ) {
				continue;
			}
			const isAlreadyResolving = hasStartedResolution( 'canUser', [
				relatedAction,
				resource,
				id,
			] );
			if ( isAlreadyResolving ) {
				return;
			}
		}

		let response;
		try {
			response = await apiFetch( {
				path: `/wp/v2/${ resourcePath }`,
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
		const allowedMethods = allowHeader?.allow || allowHeader || '';

		const permissions = {};
		const methods = {
			create: 'POST',
			read: 'GET',
			update: 'PUT',
			delete: 'DELETE',
		};
		for ( const [ actionName, methodName ] of Object.entries( methods ) ) {
			permissions[ actionName ] = allowedMethods.includes( methodName );
		}

		for ( const action of retrievedActions ) {
			dispatch.receiveUserPermission(
				`${ action }/${ resourcePath }`,
				permissions[ action ]
			);
		}
	};

/**
 * Checks whether the current user can perform the given action on the given
 * REST resource.
 *
 * @param {string} kind     Entity kind.
 * @param {string} name     Entity name.
 * @param {string} recordId Record's id.
 */
export const canUserEditEntityRecord =
	( kind, name, recordId ) =>
	async ( { dispatch } ) => {
		const configs = await dispatch( getOrLoadEntitiesConfig( kind ) );
		const entityConfig = configs.find(
			( config ) => config.name === name && config.kind === kind
		);
		if ( ! entityConfig ) {
			return;
		}

		const resource = entityConfig.__unstable_rest_base;
		await dispatch( canUser( 'update', resource, recordId ) );
	};

/**
 * Request autosave data from the REST API.
 *
 * @param {string} postType The type of the parent post.
 * @param {number} postId   The id of the parent post.
 */
export const getAutosaves =
	( postType, postId ) =>
	async ( { dispatch, resolveSelect } ) => {
		const { rest_base: restBase, rest_namespace: restNamespace = 'wp/v2' } =
			await resolveSelect.getPostType( postType );
		const autosaves = await apiFetch( {
			path: `/${ restNamespace }/${ restBase }/${ postId }/autosaves?context=edit`,
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
export const getAutosave =
	( postType, postId ) =>
	async ( { resolveSelect } ) => {
		await resolveSelect.getAutosaves( postType, postId );
	};

/**
 * Retrieve the frontend template used for a given link.
 *
 * @param {string} link Link.
 */
export const __experimentalGetTemplateForLink =
	( link ) =>
	async ( { dispatch, resolveSelect } ) => {
		let template;
		try {
			// This is NOT calling a REST endpoint but rather ends up with a response from
			// an Ajax function which has a different shape from a WP_REST_Response.
			template = await apiFetch( {
				url: addQueryArgs( link, {
					'_wp-find-template': true,
				} ),
			} ).then( ( { data } ) => data );
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
			dispatch.receiveEntityRecords(
				'postType',
				'wp_template',
				[ record ],
				{
					'find-template': link,
				}
			);
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

export const __experimentalGetCurrentGlobalStylesId =
	() =>
	async ( { dispatch, resolveSelect } ) => {
		const activeThemes = await resolveSelect.getEntityRecords(
			'root',
			'theme',
			{ status: 'active' }
		);
		const globalStylesURL =
			activeThemes?.[ 0 ]?._links?.[ 'wp:user-global-styles' ]?.[ 0 ]
				?.href;
		if ( globalStylesURL ) {
			const globalStylesObject = await apiFetch( {
				url: globalStylesURL,
			} );
			dispatch.__experimentalReceiveCurrentGlobalStylesId(
				globalStylesObject.id
			);
		}
	};

export const __experimentalGetCurrentThemeBaseGlobalStyles =
	() =>
	async ( { resolveSelect, dispatch } ) => {
		const currentTheme = await resolveSelect.getCurrentTheme();
		const themeGlobalStyles = await apiFetch( {
			path: `/wp/v2/global-styles/themes/${ currentTheme.stylesheet }`,
		} );
		dispatch.__experimentalReceiveThemeBaseGlobalStyles(
			currentTheme.stylesheet,
			themeGlobalStyles
		);
	};

export const __experimentalGetCurrentThemeGlobalStylesVariations =
	() =>
	async ( { resolveSelect, dispatch } ) => {
		const currentTheme = await resolveSelect.getCurrentTheme();
		const variations = await apiFetch( {
			path: `/wp/v2/global-styles/themes/${ currentTheme.stylesheet }/variations`,
		} );
		dispatch.__experimentalReceiveThemeGlobalStyleVariations(
			currentTheme.stylesheet,
			variations
		);
	};

/**
 * Fetches and returns the revisions of the current global styles theme.
 */
export const getCurrentThemeGlobalStylesRevisions =
	() =>
	async ( { resolveSelect, dispatch } ) => {
		const globalStylesId =
			await resolveSelect.__experimentalGetCurrentGlobalStylesId();
		const record = globalStylesId
			? await resolveSelect.getEntityRecord(
					'root',
					'globalStyles',
					globalStylesId
			  )
			: undefined;
		const revisionsURL = record?._links?.[ 'version-history' ]?.[ 0 ]?.href;

		if ( revisionsURL ) {
			const resetRevisions = await apiFetch( {
				url: revisionsURL,
			} );
			const revisions = resetRevisions?.map( ( revision ) =>
				Object.fromEntries(
					Object.entries( revision ).map( ( [ key, value ] ) => [
						camelCase( key ),
						value,
					] )
				)
			);
			dispatch.receiveThemeGlobalStyleRevisions(
				globalStylesId,
				revisions
			);
		}
	};

getCurrentThemeGlobalStylesRevisions.shouldInvalidate = ( action ) => {
	return (
		action.type === 'SAVE_ENTITY_RECORD_FINISH' &&
		action.kind === 'root' &&
		! action.error &&
		action.name === 'globalStyles'
	);
};

export const getBlockPatterns =
	() =>
	async ( { dispatch } ) => {
		const patterns = await fetchBlockPatterns();
		dispatch( { type: 'RECEIVE_BLOCK_PATTERNS', patterns } );
	};

export const getBlockPatternCategories =
	() =>
	async ( { dispatch } ) => {
		const categories = await apiFetch( {
			path: '/wp/v2/block-patterns/categories',
		} );
		dispatch( { type: 'RECEIVE_BLOCK_PATTERN_CATEGORIES', categories } );
	};

export const getUserPatternCategories =
	() =>
	async ( { dispatch, resolveSelect } ) => {
		const patternCategories = await resolveSelect.getEntityRecords(
			'taxonomy',
			'wp_pattern_category',
			{
				per_page: -1,
				_fields: 'id,name,description,slug',
				context: 'view',
			}
		);

		const mappedPatternCategories =
			patternCategories?.map( ( userCategory ) => ( {
				...userCategory,
				label: decodeEntities( userCategory.name ),
				name: userCategory.slug,
			} ) ) || [];

		dispatch( {
			type: 'RECEIVE_USER_PATTERN_CATEGORIES',
			patternCategories: mappedPatternCategories,
		} );
	};

export const getNavigationFallbackId =
	() =>
	async ( { dispatch, select } ) => {
		const fallback = await apiFetch( {
			path: addQueryArgs( '/wp-block-editor/v1/navigation-fallback', {
				_embed: true,
			} ),
		} );

		const record = fallback?._embedded?.self;

		dispatch.receiveNavigationFallbackId( fallback?.id );

		if ( record ) {
			// If the fallback is already in the store, don't invalidate navigation queries.
			// Otherwise, invalidate the cache for the scenario where there were no Navigation
			// posts in the state and the fallback created one.
			const existingFallbackEntityRecord = select.getEntityRecord(
				'postType',
				'wp_navigation',
				fallback?.id
			);
			const invalidateNavigationQueries = ! existingFallbackEntityRecord;
			dispatch.receiveEntityRecords(
				'postType',
				'wp_navigation',
				record,
				undefined,
				invalidateNavigationQueries
			);

			// Resolve to avoid further network requests.
			dispatch.finishResolution( 'getEntityRecord', [
				'postType',
				'wp_navigation',
				fallback?.id,
			] );
		}
	};

export const getDefaultTemplateId =
	( query ) =>
	async ( { dispatch } ) => {
		const template = await apiFetch( {
			path: addQueryArgs( '/wp/v2/templates/lookup', query ),
		} );
		if ( template ) {
			dispatch.receiveDefaultTemplateId( query, template.id );
		}
	};

/**
 * Requests an entity's revisions from the REST API.
 *
 * @param {string}           kind      Entity kind.
 * @param {string}           name      Entity name.
 * @param {number|string}    recordKey The key of the entity record whose revisions you want to fetch.
 * @param {Object|undefined} query     Optional object of query parameters to
 *                                     include with request. If requesting specific
 *                                     fields, fields must always include the ID.
 */
export const getRevisions =
	( kind, name, recordKey, query = {} ) =>
	async ( { dispatch } ) => {
		const configs = await dispatch( getOrLoadEntitiesConfig( kind ) );
		const entityConfig = configs.find(
			( config ) => config.name === name && config.kind === kind
		);

		if ( ! entityConfig || entityConfig?.__experimentalNoFetch ) {
			return;
		}

		if ( query._fields ) {
			// If requesting specific fields, items and query association to said
			// records are stored by ID reference. Thus, fields must always include
			// the ID.
			query = {
				...query,
				_fields: [
					...new Set( [
						...( getNormalizedCommaSeparable( query._fields ) ||
							[] ),
						entityConfig.revisionKey || DEFAULT_ENTITY_KEY,
					] ),
				].join(),
			};
		}

		const path = addQueryArgs(
			entityConfig.getRevisionsUrl( recordKey ),
			query
		);

		let records, response;
		const meta = {};
		const isPaginated =
			entityConfig.supportsPagination && query.per_page !== -1;
		try {
			response = await apiFetch( { path, parse: ! isPaginated } );
		} catch ( error ) {
			// Do nothing if our request comes back with an API error.
			return;
		}

		if ( response ) {
			if ( isPaginated ) {
				records = Object.values( await response.json() );
				meta.totalItems = parseInt(
					response.headers.get( 'X-WP-Total' )
				);
			} else {
				records = Object.values( response );
			}

			// If we request fields but the result doesn't contain the fields,
			// explicitly set these fields as "undefined"
			// that way we consider the query "fulfilled".
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

			dispatch.receiveRevisions(
				kind,
				name,
				recordKey,
				records,
				query,
				false,
				meta
			);

			// When requesting all fields, the list of results can be used to
			// resolve the `getRevision` selector in addition to `getRevisions`.
			if ( ! query?._fields && ! query.context ) {
				const key = entityConfig.key || DEFAULT_ENTITY_KEY;
				const resolutionsArgs = records
					.filter( ( record ) => record[ key ] )
					.map( ( record ) => [
						kind,
						name,
						recordKey,
						record[ key ],
					] );

				dispatch( {
					type: 'START_RESOLUTIONS',
					selectorName: 'getRevision',
					args: resolutionsArgs,
				} );
				dispatch( {
					type: 'FINISH_RESOLUTIONS',
					selectorName: 'getRevision',
					args: resolutionsArgs,
				} );
			}
		}
	};

// Invalidate cache when a new revision is created.
getRevisions.shouldInvalidate = ( action, kind, name, recordKey ) =>
	action.type === 'SAVE_ENTITY_RECORD_FINISH' &&
	name === action.name &&
	kind === action.kind &&
	! action.error &&
	recordKey === action.recordId;

/**
 * Requests a specific Entity revision from the REST API.
 *
 * @param {string}           kind        Entity kind.
 * @param {string}           name        Entity name.
 * @param {number|string}    recordKey   The key of the entity record whose revisions you want to fetch.
 * @param {number|string}    revisionKey The revision's key.
 * @param {Object|undefined} query       Optional object of query parameters to
 *                                       include with request. If requesting specific
 *                                       fields, fields must always include the ID.
 */
export const getRevision =
	( kind, name, recordKey, revisionKey, query ) =>
	async ( { dispatch } ) => {
		const configs = await dispatch( getOrLoadEntitiesConfig( kind ) );
		const entityConfig = configs.find(
			( config ) => config.name === name && config.kind === kind
		);

		if ( ! entityConfig || entityConfig?.__experimentalNoFetch ) {
			return;
		}

		if ( query !== undefined && query._fields ) {
			// If requesting specific fields, items and query association to said
			// records are stored by ID reference. Thus, fields must always include
			// the ID.
			query = {
				...query,
				_fields: [
					...new Set( [
						...( getNormalizedCommaSeparable( query._fields ) ||
							[] ),
						entityConfig.revisionKey || DEFAULT_ENTITY_KEY,
					] ),
				].join(),
			};
		}
		const path = addQueryArgs(
			entityConfig.getRevisionsUrl( recordKey, revisionKey ),
			query
		);

		let record;
		try {
			record = await apiFetch( { path } );
		} catch ( error ) {
			// Do nothing if our request comes back with an API error.
			return;
		}

		if ( record ) {
			dispatch.receiveRevisions( kind, name, recordKey, record, query );
		}
	};
