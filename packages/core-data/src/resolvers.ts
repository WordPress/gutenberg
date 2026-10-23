import { camelCase } from 'change-case';
import { addQueryArgs } from '@wordpress/url';
import { decodeEntities } from '@wordpress/html-entities';
import apiFetch from '@wordpress/api-fetch';
import type { Block } from '@wordpress/blocks';
import { STORE_NAME } from './name';
import { additionalEntityConfigLoaders, DEFAULT_ENTITY_KEY } from './entities';
import { getEntitySyncManager } from './entity-sync';
import type { EntitySyncRecord } from './entity-sync';
import {
	forwardResolver,
	getNormalizedCommaSeparable,
	getUserPermissionCacheKey,
	getUserPermissionsFromAllowHeader,
	ALLOWED_RESOURCE_ACTIONS,
	RECEIVE_INTERMEDIATE_RESULTS,
	isNumericID,
	normalizeQueryForResolution,
	getPaginationMeta,
} from './utils';
import { fetchBlockPatterns } from './fetch';
import { setCachedBlocks } from './parsed-blocks-cache';
import type * as ET from './entity-types';
import type { QueriedMeta, Query } from './queried-data/types';
import type { PermissionResource } from './utils/types';
import type { EntityActionsConfig, FieldsConfig } from './private-selectors';
import type { Action, CoreDataThunkArgs } from './private-types';
import type { EntityConfig, RestRecord, TransientEditConfig } from './types';

/**
 * Requests authors from the REST API.
 *
 * @param query Optional object of query parameters to
 *              include with request.
 */
export const getAuthors =
	( query?: Query ) =>
	async ( { dispatch }: CoreDataThunkArgs ) => {
		const path = addQueryArgs(
			'/wp/v2/users/?who=authors&per_page=100',
			query
		);
		const users = await apiFetch< Array< ET.User< 'view' > > >( { path } );
		dispatch.receiveUserQuery( path, users );
	};

/**
 * Requests the current user from the REST API.
 */
export const getCurrentUser =
	() =>
	async ( { dispatch }: CoreDataThunkArgs ) => {
		const currentUser = await apiFetch< ET.User< 'view' > >( {
			path: '/wp/v2/users/me',
		} );
		dispatch.receiveCurrentUser( currentUser );
	};

/**
 * Requests an entity's record from the REST API.
 *
 * @param kind  Entity kind.
 * @param name  Entity name.
 * @param key   Record's key
 * @param query Optional object of query parameters to
 *              include with request. If requesting specific
 *              fields, fields must always include the ID.
 */
export const getEntityRecord =
	( kind: string, name: string, key: string | number = '', query?: Query ) =>
	async ( {
		select,
		dispatch,
		registry,
		resolveSelect,
	}: CoreDataThunkArgs ) => {
		const configs: Array< EntityConfig > =
			await resolveSelect.getEntitiesConfig( kind );
		const entityConfig = configs.find(
			( config ) => config.name === name && config.kind === kind
		);
		if ( ! entityConfig ) {
			return;
		}

		const lock = await dispatch.__unstableAcquireStoreLock(
			STORE_NAME,
			[ 'entities', 'records', kind, name, key ],
			{ exclusive: false }
		);

		try {
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
							entityConfig.key || DEFAULT_ENTITY_KEY,
						] ),
					].join(),
				};
			}

			if ( query !== undefined && query._fields ) {
				// The resolution cache won't consider query as reusable based on the
				// fields, so it's tested here, prior to initiating the REST request,
				// and without causing `getEntityRecord` resolution to occur.
				const hasRecord = select.hasEntityRecord(
					kind,
					name,
					key,
					query
				);
				if ( hasRecord ) {
					return;
				}
			}

			const { baseURL } = entityConfig;

			const path = addQueryArgs( baseURL + ( key ? '/' + key : '' ), {
				...entityConfig.baseURLParams,
				...query,
			} );
			const response = await apiFetch( { path, parse: false } );
			const record: RestRecord = await response.json();
			const permissions = getUserPermissionsFromAllowHeader(
				response.headers?.get( 'allow' )
			);

			const receiveUserPermissionArgs: Record< string, boolean > = {};
			for ( const action of ALLOWED_RESOURCE_ACTIONS ) {
				receiveUserPermissionArgs[
					getUserPermissionCacheKey( action, {
						kind,
						name,
						id: key,
					} )
				] = permissions[ action ];
			}

			// `canUser` is keyed by the resource, so one entry covers all
			// four actions.
			const canUserResolutionsArgs = [ [ { kind, name, id: key } ] ];

			// A registered entity sync manager is notified about records
			// fetched without a query and decides whether to sync them. The
			// no-query fetch is the one the editor uses for the main record
			// it edits, and it is guaranteed to carry the full editable
			// record. A fetch with a query may ask for specific fields or a
			// different context, so it is not a safe base for syncing.
			const syncManager =
				select?.isCollaborationSupported?.() === false
					? undefined
					: getEntitySyncManager();

			if (
				syncManager &&
				isNumericID( key ) &&
				! query &&
				false !== syncManager.shouldSync?.( kind, name, key )
			) {
				// Use the new transient "read/write" config to compute transients for
				// the sync manager. Otherwise these transients are not available
				// if / until the record is edited. Use a copy of the record so that
				// it does not change the behavior outside this experimental flag.
				const recordWithTransients = { ...record };
				Object.entries( entityConfig.transientEdits ?? {} )
					.filter(
						( [ propName, transientConfig ] ) =>
							undefined === recordWithTransients[ propName ] &&
							transientConfig &&
							'object' === typeof transientConfig &&
							'read' in transientConfig &&
							'function' === typeof transientConfig.read
					)
					.forEach( ( [ propName, transientConfig ] ) => {
						recordWithTransients[ propName ] =
							// The filter above keeps the configs that read the record.
							( transientConfig as TransientEditConfig ).read(
								recordWithTransients
							);
					} );

				// Share the parsed blocks with `useEntityBlockEditor` so the
				// editor doesn't re-parse the same `content` string. The cache
				// remembers which block types the parse ran against, so an
				// entry computed before they register is discarded, not served.
				if (
					recordWithTransients.blocks &&
					// Post content is fetched in the edit context, with its `raw` value.
					typeof ( recordWithTransients.content as { raw?: unknown } )
						?.raw === 'string'
				) {
					setCachedBlocks(
						kind,
						name,
						key,
						// Checked above to be a string.
						( recordWithTransients.content as { raw: string } ).raw,
						// The blocks transient edit parses the content into blocks.
						recordWithTransients.blocks as Array< Block >
					);
				}

				// Load the entity record for syncing. Do not await promise.
				// NOTE: when this resolver runs before block types register,
				// `recordWithTransients.blocks` was parsed as empty. The cache
				// above discards such an entry; the sync manager receives it
				// as-is, and seeding a collaborative document from it is an
				// open problem of the collaboration path.
				void syncManager.load( kind, name, key, recordWithTransients, {
					// Handle edits sourced from the sync manager.
					editRecord: ( edits, options = {} ) => {
						if ( ! Object.keys( edits ).length ) {
							return;
						}

						dispatch( {
							type: 'EDIT_ENTITY_RECORD',
							kind,
							name,
							recordId: key,
							edits,
							meta: {
								undo: undefined,
							},
							options,
						} );
					},
					// Get the current entity record (with edits)
					getEditedRecord: async () =>
						// The synced record is received below, so it has an edited record.
						( await resolveSelect.getEditedEntityRecord(
							kind,
							name,
							key
						) ) as EntitySyncRecord,
					// Refetch the current entity record from the database.
					refetchRecord: async () => {
						dispatch.receiveEntityRecords(
							kind,
							name,
							await apiFetch( { path, parse: true } ),
							query
						);
					},
					onUndoLevelOpened: () => {
						dispatch.recordSyncUndoLevel( kind, name, key );
					},
				} );
			}

			registry.batch( () => {
				dispatch.receiveEntityRecords( kind, name, record, query );
				dispatch.receiveUserPermissions( receiveUserPermissionArgs );
				dispatch.finishResolutions( 'canUser', canUserResolutionsArgs );
			} );
		} finally {
			dispatch.__unstableReleaseStoreLock( lock );
		}
	};

// Whenever a template is saved, the active templates might be updated, so
// invalidate the site settings when a template is updated or deleted.
getEntityRecord.shouldInvalidate = (
	action: Action,
	kind: string,
	name: string
) => {
	return (
		kind === 'root' &&
		name === 'site' &&
		( ( action.type === 'RECEIVE_ITEMS' &&
			// Making sure persistedEdits is set seems to be the only way of
			// knowing whether it's an update or fetch. Only an update would
			// have persistedEdits.
			action.persistedEdits &&
			action.persistedEdits.status !== 'auto-draft' ) ||
			action.type === 'REMOVE_ITEMS' ) &&
		action.kind === 'postType' &&
		action.name === 'wp_template'
	);
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
 * @param kind  Entity kind.
 * @param name  Entity name.
 * @param query Query Object. If requesting specific fields, fields
 *              must always include the ID.
 */
export const getEntityRecords =
	( kind: string, name: string, query: Query = {} ) =>
	async ( { dispatch, registry, resolveSelect }: CoreDataThunkArgs ) => {
		const configs: Array< EntityConfig > =
			await resolveSelect.getEntitiesConfig( kind );
		const entityConfig = configs.find(
			( config ) => config.name === name && config.kind === kind
		);
		if ( ! entityConfig ) {
			return;
		}

		const lock = await dispatch.__unstableAcquireStoreLock(
			STORE_NAME,
			[ 'entities', 'records', kind, name ],
			{ exclusive: false }
		);

		// Keep a copy of the original query for later use in getResolutionsArgs.
		// The query object may be modified below (for example, when _fields is
		// specified), but we want to use the original query when marking
		// resolutions as finished.
		const rawQuery = { ...query };
		const key = entityConfig.key || DEFAULT_ENTITY_KEY;

		function getResolutionsArgs(
			records: Array< RestRecord >,
			recordsQuery: Query
		) {
			const normalizedQuery = normalizeQueryForResolution( recordsQuery );
			return records
				.filter( ( record ) => record?.[ key ] )
				.map( ( record ) => [
					kind,
					name,
					record[ key ],
					normalizedQuery,
				] );
		}

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
							key,
						] ),
					].join(),
				};
			}

			const { baseURL } = entityConfig;

			const path = addQueryArgs( baseURL, {
				...entityConfig.baseURLParams,
				...query,
			} );

			let records: Array< RestRecord > = [],
				meta: QueriedMeta | undefined;
			if ( entityConfig.supportsPagination && query.per_page !== -1 ) {
				const response = await apiFetch( { path, parse: false } );
				records = Object.values( await response.json() );
				meta = getPaginationMeta( response.headers );
			} else if (
				query.per_page === -1 &&
				// The private option is a symbol key of the query.
				( query as Record< symbol, unknown > )[
					RECEIVE_INTERMEDIATE_RESULTS
				] === true
			) {
				let page = 1;
				let totalPages: number;

				do {
					const response = await apiFetch< unknown, false >( {
						path: addQueryArgs( path, { page, per_page: 100 } ),
						parse: false,
					} );
					const pageRecords: Array< RestRecord > = Object.values(
						await response.json()
					);

					const pageMeta = getPaginationMeta( response.headers );
					// An endpoint that doesn't paginate answers the first
					// request with the whole collection.
					totalPages = pageMeta.totalPages ?? 1;

					if ( ! meta ) {
						meta = {
							totalItems: pageMeta.totalItems,
							totalPages: 1,
						};
					}

					records.push( ...pageRecords );
					registry.batch( () => {
						dispatch.receiveEntityRecords(
							kind,
							name,
							records,
							query,
							false,
							undefined,
							meta
						);
						dispatch.finishResolutions(
							'getEntityRecord',
							getResolutionsArgs( pageRecords, rawQuery )
						);
					} );
					page++;
				} while ( page <= totalPages );
			} else {
				records = Object.values(
					await apiFetch<
						Array< RestRecord > | Record< string, RestRecord >
					>( { path } )
				);
				meta = {
					totalItems: records.length,
					totalPages: 1,
				};
			}

			// A registered entity sync manager hears about whole collections,
			// meaning fetches that ask for every record of a type at once.
			// Paginated lists are not covered. The manager gets one handler,
			// `refetchRecords`, which reloads the same list from the REST
			// API. For example, the real-time collaboration manager watches
			// a shared document for the collection and calls the handler
			// when another user saves a record of that type, so lists such
			// as templates, navigation menus, or a post's notes pick up the
			// change.
			if ( -1 === query.per_page ) {
				void getEntitySyncManager()?.loadCollection?.( kind, name, {
					refetchRecords: async () => {
						dispatch.receiveEntityRecords(
							kind,
							name,
							await apiFetch( { path, parse: true } ),
							query
						);
					},
				} );
			}

			// If we request fields but the result doesn't contain the fields,
			// explicitly set these fields as "undefined"
			// that way we consider the query "fulfilled".
			if ( query._fields ) {
				records = records.map( ( record ) => {
					// Normalized to a string above.
					( query._fields as string )
						.split( ',' )
						.forEach( ( field ) => {
							if ( ! record.hasOwnProperty( field ) ) {
								record[ field ] = undefined;
							}
						} );

					return record;
				} );
			}

			registry.batch( () => {
				dispatch.receiveEntityRecords(
					kind,
					name,
					records,
					query,
					false,
					undefined,
					meta
				);

				const targetHints = records
					.filter(
						( record ) =>
							!! record?.[ key ] &&
							!! record?._links?.self?.[ 0 ]?.targetHints?.allow
					)
					.map( ( record ) => ( {
						// Records are keyed by their ID.
						id: record[ key ] as string | number,
						permissions: getUserPermissionsFromAllowHeader(
							// Filtered above to records with an allow hint.
							record._links!.self![ 0 ].targetHints!.allow
						),
					} ) );

				const canUserResolutionsArgs: Array<
					[ { kind: string; name: string; id: string | number } ]
				> = [];
				const receiveUserPermissionArgs: Record< string, boolean > = {};
				for ( const targetHint of targetHints ) {
					// `canUser` is keyed by the resource, so one entry covers
					// all four actions.
					canUserResolutionsArgs.push( [
						{ kind, name, id: targetHint.id },
					] );

					for ( const action of ALLOWED_RESOURCE_ACTIONS ) {
						receiveUserPermissionArgs[
							getUserPermissionCacheKey( action, {
								kind,
								name,
								id: targetHint.id,
							} )
						] = targetHint.permissions[ action ];
					}
				}

				if ( targetHints.length > 0 ) {
					dispatch.receiveUserPermissions(
						receiveUserPermissionArgs
					);
					dispatch.finishResolutions(
						'canUser',
						canUserResolutionsArgs
					);
				}

				dispatch.finishResolutions(
					'getEntityRecord',
					getResolutionsArgs( records, rawQuery )
				);

				dispatch.__unstableReleaseStoreLock( lock );
			} );
		} catch {
			dispatch.__unstableReleaseStoreLock( lock );
		}
	};

getEntityRecords.shouldInvalidate = (
	action: Action,
	kind: string,
	name: string
) => {
	return (
		( action.type === 'RECEIVE_ITEMS' || action.type === 'REMOVE_ITEMS' ) &&
		action.invalidateCache &&
		kind === action.kind &&
		name === action.name
	);
};

/**
 * Requests the total number of entity records.
 */
export const getEntityRecordsTotalItems = forwardResolver( 'getEntityRecords' );

/**
 * Requests the number of available pages for the given query.
 */
export const getEntityRecordsTotalPages = forwardResolver( 'getEntityRecords' );

/**
 * Requests the current theme.
 */
export const getCurrentTheme =
	() =>
	async ( { dispatch, resolveSelect }: CoreDataThunkArgs ) => {
		const activeThemes = await resolveSelect.getEntityRecords(
			'root',
			'theme',
			{ status: 'active' }
		);

		// Resolved, so the records are set.
		// Theme records are themes.
		dispatch.receiveCurrentTheme( activeThemes![ 0 ] as ET.Theme );
	};

/**
 * Requests theme supports data from the index.
 */
export const getThemeSupports = forwardResolver( 'getCurrentTheme' );

/**
 * Requests a preview from the Embed API.
 *
 * @param url URL to get the preview for.
 */
export const getEmbedPreview =
	( url: string ) =>
	async ( { dispatch }: CoreDataThunkArgs ) => {
		try {
			const embedProxyResponse = await apiFetch( {
				path: addQueryArgs( '/oembed/1.0/proxy', { url } ),
			} );
			dispatch.receiveEmbedPreview( url, embedProxyResponse );
		} catch {
			// Embed API 404s if the URL cannot be embedded, so we have to catch the error from the apiRequest here.
			dispatch.receiveEmbedPreview( url, false );
		}
	};

/**
 * Checks whether the current user can perform the given action on the given
 * REST resource.
 *
 * @param resource Entity resource to check. Accepts entity object `{ kind: 'postType', name: 'attachment', id: 1 }`
 *                 or REST base as a string - `media`.
 * @param id       ID of the rest resource to check.
 */
export const canUser =
	( resource: string | PermissionResource, id?: string | number | null ) =>
	async ( { dispatch, resolveSelect }: CoreDataThunkArgs ) => {
		let resourcePath: string | null = null;
		if ( typeof resource === 'object' ) {
			if ( ! resource.kind || ! resource.name ) {
				throw new Error( 'The entity resource object is not valid.' );
			}

			const configs = await resolveSelect.getEntitiesConfig(
				resource.kind
			);
			const entityConfig = configs.find(
				( config ) =>
					config.name === resource.name &&
					config.kind === resource.kind
			);
			if ( ! entityConfig ) {
				return;
			}

			resourcePath =
				entityConfig.baseURL + ( resource.id ? '/' + resource.id : '' );
		} else {
			resourcePath = `/wp/v2/${ resource }` + ( id ? '/' + id : '' );
		}

		let response;
		try {
			response = await apiFetch( {
				path: resourcePath,
				method: 'OPTIONS',
				parse: false,
			} );
		} catch {
			// Do nothing if our OPTIONS request comes back with an API error (4xx or
			// 5xx). The previously determined isAllowed value will remain in the store.
			return;
		}

		// Optional chaining operator is used here because the API requests don't
		// return the expected result in the React native version. Instead, API requests
		// only return the result, without including response properties like the headers.
		const permissions = getUserPermissionsFromAllowHeader(
			response.headers?.get( 'allow' )
		);
		const receiveUserPermissionArgs: Record< string, boolean > = {};
		for ( const action of ALLOWED_RESOURCE_ACTIONS ) {
			receiveUserPermissionArgs[
				getUserPermissionCacheKey( action, resource, id )
			] = permissions[ action ];
		}
		dispatch.receiveUserPermissions( receiveUserPermissionArgs );
	};

/**
 * One OPTIONS request returns the permissions for every action, so the action
 * is left out of the key and all four `canUser` calls for a resource share a
 * single resolver run.
 *
 * @param action   Action the selector was called with.
 * @param resource Entity resource to check.
 * @param id       ID of the rest resource to check.
 *
 * @return The cache key arguments.
 */
canUser.getResolutionArgs = (
	action: string,
	resource: string | PermissionResource,
	id?: string | number | null
): [ string | PermissionResource, string | number | null | undefined ] => [
	resource,
	id,
];

/**
 * Checks whether the current user can perform the given action on the given
 * REST resource.
 *
 * @param kind     Entity kind.
 * @param name     Entity name.
 * @param recordId Record's id.
 */
export const canUserEditEntityRecord =
	( kind: string, name: string, recordId: number | string ) =>
	async ( { resolveSelect }: CoreDataThunkArgs ) => {
		await resolveSelect.canUser( 'update', { kind, name, id: recordId } );
	};

/**
 * Request autosave data from the REST API.
 *
 * @param postType The type of the parent post.
 * @param postId   The id of the parent post.
 */
export const getAutosaves =
	( postType: string, postId: number ) =>
	async ( { dispatch, resolveSelect }: CoreDataThunkArgs ) => {
		const {
			rest_base: restBase,
			rest_namespace: restNamespace = 'wp/v2',
			supports,
			// Autosaves are requested for posts of an existing post type.
		} = ( await resolveSelect.getPostType( postType ) )!;
		if ( ! supports?.autosave ) {
			return;
		}

		const autosaves = await apiFetch< Array< unknown > >( {
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
 * @param postType The type of the parent post.
 * @param postId   The id of the parent post.
 */
export const getAutosave =
	( postType: string, postId: number ) =>
	async ( { resolveSelect }: CoreDataThunkArgs ) => {
		await resolveSelect.getAutosaves( postType, postId );
	};

export const __experimentalGetCurrentGlobalStylesId =
	() =>
	async ( { dispatch, resolveSelect }: CoreDataThunkArgs ) => {
		const activeThemes = await resolveSelect.getEntityRecords(
			'root',
			'theme',
			{ status: 'active' }
		);
		const globalStylesURL = // Themes are fetched with their links.
			( activeThemes?.[ 0 ] as RestRecord | undefined )?._links?.[
				'wp:user-global-styles'
			]?.[ 0 ]?.href;
		if ( ! globalStylesURL ) {
			return;
		}

		// Regex matches the ID at the end of a URL or immediately before
		// the query string.
		const matches = globalStylesURL.match( /\/(\d+)(?:\?|$)/ );
		const id = matches ? Number( matches[ 1 ] ) : null;

		if ( id ) {
			dispatch.__experimentalReceiveCurrentGlobalStylesId( id );
		}
	};

export const __experimentalGetCurrentThemeBaseGlobalStyles =
	() =>
	async ( { resolveSelect, dispatch }: CoreDataThunkArgs ) => {
		const currentTheme = await resolveSelect.getCurrentTheme();
		// Please adjust the preloaded requests if this changes!
		const themeGlobalStyles = await apiFetch< object >( {
			path: `/wp/v2/global-styles/themes/${ currentTheme.stylesheet }?context=view`,
		} );
		dispatch.__experimentalReceiveThemeBaseGlobalStyles(
			currentTheme.stylesheet,
			themeGlobalStyles
		);
	};

export const __experimentalGetCurrentThemeGlobalStylesVariations =
	() =>
	async ( { resolveSelect, dispatch }: CoreDataThunkArgs ) => {
		const currentTheme = await resolveSelect.getCurrentTheme();
		// Please adjust the preloaded requests if this changes!
		const variations = await apiFetch< Array< unknown > >( {
			path: `/wp/v2/global-styles/themes/${ currentTheme.stylesheet }/variations?context=view`,
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
	async ( { resolveSelect, dispatch }: CoreDataThunkArgs ) => {
		const globalStylesId =
			await resolveSelect.__experimentalGetCurrentGlobalStylesId();
		const record = globalStylesId
			? await resolveSelect.getEntityRecord(
					'root',
					'globalStyles',
					globalStylesId
				)
			: undefined;
		const revisionsURL = // Global styles are fetched with their links.
			( record as RestRecord | undefined )?._links?.[
				'version-history'
			]?.[ 0 ]?.href;

		if ( revisionsURL ) {
			const resetRevisions = await apiFetch<
				Array< Record< string, unknown > >
			>( {
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
				// Set, as the record it names has revisions.
				globalStylesId!,
				revisions
			);
		}
	};

getCurrentThemeGlobalStylesRevisions.shouldInvalidate = ( action: Action ) => {
	return (
		action.type === 'SAVE_ENTITY_RECORD_FINISH' &&
		action.kind === 'root' &&
		! action.error &&
		action.name === 'globalStyles'
	);
};

export const getBlockPatterns =
	() =>
	async ( { dispatch }: CoreDataThunkArgs ) => {
		const patterns = await fetchBlockPatterns();
		dispatch( { type: 'RECEIVE_BLOCK_PATTERNS', patterns } );
	};

export const getBlockPatternCategories =
	() =>
	async ( { dispatch }: CoreDataThunkArgs ) => {
		const categories = await apiFetch( {
			path: '/wp/v2/block-patterns/categories',
		} );
		dispatch( { type: 'RECEIVE_BLOCK_PATTERN_CATEGORIES', categories } );
	};

export const getUserPatternCategories =
	() =>
	async ( { dispatch, resolveSelect }: CoreDataThunkArgs ) => {
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
			// Requested with these fields.
			(
				patternCategories as Array< {
					name: string;
					slug: string;
				} > | null
			 )?.map( ( userCategory ) => ( {
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
	async ( { dispatch, select, registry }: CoreDataThunkArgs ) => {
		const fallback = await apiFetch< {
			id?: number;
			_embedded?: { self?: RestRecord };
		} >( {
			path: addQueryArgs( '/wp-block-editor/v1/navigation-fallback', {
				_embed: true,
			} ),
		} );

		const record = fallback?._embedded?.self;

		registry.batch( () => {
			dispatch.receiveNavigationFallbackId( fallback?.id );

			if ( ! record ) {
				return;
			}

			// If the fallback is already in the store, don't invalidate navigation queries.
			// Otherwise, invalidate the cache for the scenario where there were no Navigation
			// posts in the state and the fallback created one.
			const existingFallbackEntityRecord = select.getEntityRecord(
				'postType',
				'wp_navigation',
				fallback.id
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
				fallback.id,
			] );
		} );
	};

export const getDefaultTemplateId =
	( query: Query ) =>
	async ( { dispatch, registry, resolveSelect }: CoreDataThunkArgs ) => {
		const template = await apiFetch<
			RestRecord & { id?: string; type: string }
		>( {
			path: addQueryArgs( '/wp/v2/templates/lookup', query ),
		} );
		// Wait for the entities config to be loaded, otherwise receiving
		// the template as an entity will not work.
		await resolveSelect.getEntitiesConfig( 'postType' );
		const id = template?.id;

		registry.batch( () => {
			dispatch.receiveDefaultTemplateId( query, id || '' );
			// Endpoint may return an empty object if no template is found.
			if ( id ) {
				template.id = id;
				dispatch.receiveEntityRecords(
					'postType',
					template.type,
					template
				);
				// Avoid further network requests.
				dispatch.finishResolution( 'getEntityRecord', [
					'postType',
					template.type,
					id,
				] );
			}
		} );
	};

/**
 * Requests an entity's revisions from the REST API.
 *
 * @param kind      Entity kind.
 * @param name      Entity name.
 * @param recordKey The key of the entity record whose revisions you want to fetch.
 * @param query     Optional object of query parameters to
 *                  include with request. If requesting specific
 *                  fields, fields must always include the ID.
 */
export const getRevisions =
	(
		kind: string,
		name: string,
		recordKey: number | string,
		query: Query = {}
	) =>
	async ( { dispatch, resolveSelect }: CoreDataThunkArgs ) => {
		const configs: Array< EntityConfig > =
			await resolveSelect.getEntitiesConfig( kind );
		const entityConfig = configs.find(
			( config ) => config.name === name && config.kind === kind
		);

		if ( ! entityConfig ) {
			return;
		}

		const rawQuery = { ...query };
		const lock = await dispatch.__unstableAcquireStoreLock(
			STORE_NAME,
			[ 'entities', 'records', kind, name, recordKey, 'revisions' ],
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
							entityConfig.revisionKey || DEFAULT_ENTITY_KEY,
						] ),
					].join(),
				};
			}

			const path = addQueryArgs(
				// Entities with revisions have a revisions URL.
				entityConfig.getRevisionsUrl!( recordKey ),
				query
			);

			let records: Array< RestRecord >, response;
			const meta: QueriedMeta = {};
			const isPaginated =
				entityConfig.supportsPagination && query.per_page !== -1;
			try {
				response = await apiFetch( { path, parse: ! isPaginated } );
			} catch {
				// Do nothing if our request comes back with an API error.
				return;
			}

			if ( response ) {
				if ( isPaginated ) {
					// Fetched unparsed when paginated.
					records = Object.values(
						await ( response as Response ).json()
					);
					meta.totalItems = getPaginationMeta(
						// Fetched unparsed when paginated.
						( response as Response ).headers
					).totalItems;
				} else {
					// Fetched parsed, as the revisions themselves.
					records = Object.values( response as Array< RestRecord > );
				}

				// If we request fields but the result doesn't contain the fields,
				// explicitly set these fields as "undefined"
				// that way we consider the query "fulfilled".
				if ( query._fields ) {
					records = records.map( ( record ) => {
						// Normalized to a string above.
						( query._fields as string )
							.split( ',' )
							.forEach( ( field ) => {
								if ( ! record.hasOwnProperty( field ) ) {
									record[ field ] = undefined;
								}
							} );

						return record;
					} );
				}

				await dispatch.receiveRevisions(
					kind,
					name,
					recordKey,
					records,
					query,
					false,
					meta
				);

				// Mark individual getRevision resolutions as done so that
				// subsequent getRevision calls skip redundant API fetches.
				const key = entityConfig.revisionKey || DEFAULT_ENTITY_KEY;
				const normalizedQuery = normalizeQueryForResolution( rawQuery );
				const resolutionsArgs = records
					.filter( ( record ) => record[ key ] )
					.map( ( record ) => [
						kind,
						name,
						recordKey,
						record[ key ],
						normalizedQuery,
					] );

				dispatch.finishResolutions( 'getRevision', resolutionsArgs );
			}
		} finally {
			dispatch.__unstableReleaseStoreLock( lock );
		}
	};

// Invalidate cache when a new revision is created.
getRevisions.shouldInvalidate = (
	action: Action,
	kind: string,
	name: string,
	recordKey: number | string
) =>
	action.type === 'SAVE_ENTITY_RECORD_FINISH' &&
	name === action.name &&
	kind === action.kind &&
	! action.error &&
	recordKey === action.recordId;

/**
 * Requests a specific Entity revision from the REST API.
 *
 * @param kind        Entity kind.
 * @param name        Entity name.
 * @param recordKey   The key of the entity record whose revisions you want to fetch.
 * @param revisionKey The revision's key.
 * @param query       Optional object of query parameters to
 *                    include with request. If requesting specific
 *                    fields, fields must always include the ID.
 */
export const getRevision =
	(
		kind: string,
		name: string,
		recordKey: number | string,
		revisionKey: number | string,
		query?: Query
	) =>
	async ( { select, dispatch, resolveSelect }: CoreDataThunkArgs ) => {
		const configs: Array< EntityConfig > =
			await resolveSelect.getEntitiesConfig( kind );
		const entityConfig = configs.find(
			( config ) => config.name === name && config.kind === kind
		);

		if ( ! entityConfig ) {
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

		const lock = await dispatch.__unstableAcquireStoreLock(
			STORE_NAME,
			[
				'entities',
				'records',
				kind,
				name,
				recordKey,
				'revisions',
				revisionKey,
			],
			{ exclusive: false }
		);

		try {
			if (
				select.hasRevision( kind, name, recordKey, revisionKey, query )
			) {
				return;
			}

			const path = addQueryArgs(
				// Entities with revisions have a revisions URL.
				entityConfig.getRevisionsUrl!( recordKey, revisionKey ),
				query
			);

			let record;
			try {
				record = await apiFetch< RestRecord >( { path } );
			} catch {
				// Do nothing if our request comes back with an API error.
				return;
			}

			if ( record ) {
				await dispatch.receiveRevisions(
					kind,
					name,
					recordKey,
					record,
					query
				);
			}
		} finally {
			dispatch.__unstableReleaseStoreLock( lock );
		}
	};

/**
 * Requests a specific post type options from the REST API.
 *
 * @param postType Post type slug.
 */
export const getRegisteredPostMeta =
	( postType: string ) =>
	async ( { dispatch, resolveSelect }: CoreDataThunkArgs ) => {
		let options;
		try {
			const {
				rest_namespace: restNamespace = 'wp/v2',
				rest_base: restBase,
			} = ( await resolveSelect.getPostType( postType ) ) || {};
			options = await apiFetch< {
				schema?: {
					properties?: {
						meta?: { properties?: Record< string, unknown > };
					};
				};
			} >( {
				path: `${ restNamespace }/${ restBase }/?context=edit`,
				method: 'OPTIONS',
			} );
		} catch {
			// Do nothing if the request comes back with an API error.
			return;
		}

		if ( options ) {
			dispatch.receiveRegisteredPostMeta(
				postType,
				options?.schema?.properties?.meta?.properties
			);
		}
	};

/**
 * Requests entity configs for the given kind from the REST API.
 *
 * @param kind Entity kind.
 */
export const getEntitiesConfig =
	( kind: string ) =>
	async ( { dispatch }: CoreDataThunkArgs ) => {
		const loader = additionalEntityConfigLoaders.find(
			( l ) => l.kind === kind
		);

		if ( ! loader ) {
			return;
		}

		try {
			const configs = await loader.loadEntities();
			if ( ! configs.length ) {
				return;
			}

			dispatch.addEntities( configs );
		} catch {
			// Do nothing if the request comes back with an API error.
		}
	};

/**
 * Requests editor settings from the REST API.
 */
export const getEditorSettings =
	() =>
	async ( { dispatch }: CoreDataThunkArgs ) => {
		const settings = await apiFetch< Record< string, unknown > >( {
			path: '/wp-block-editor/v1/settings',
		} );
		dispatch.receiveEditorSettings( settings );
	};

/**
 * Requests editor assets from the REST API.
 */
export const getEditorAssets =
	() =>
	async ( { dispatch }: CoreDataThunkArgs ) => {
		const assets = await apiFetch< Record< string, unknown > >( {
			path: '/wp-block-editor/v1/assets',
		} );
		dispatch.receiveEditorAssets( assets );
	};

/**
 * Requests view config for a given entity type from the REST API.
 *
 * @param kind           Entity kind.
 * @param name           Entity name.
 * @param options        Optional options.
 * @param options.fields Optional subset of top-level config
 *                       properties to request, mapped to the REST
 *                       API `_fields` parameter. When omitted, the
 *                       full config is requested.
 */
export const getViewConfig =
	(
		kind: string,
		name: string,
		options: { fields?: Array< string > | null } = {}
	) =>
	async ( { dispatch }: CoreDataThunkArgs ) => {
		const query: Query = { kind, name };
		const fields = getNormalizedCommaSeparable( options.fields );
		if ( fields?.length ) {
			query._fields = fields.join( ',' );
		}
		const config = await apiFetch< Record< string, unknown > >( {
			path: addQueryArgs( '/wp/v2/view-config', query ),
		} );
		dispatch.receiveViewConfig( kind, name, config );
	};

/**
 * Requests the fields registered on the server for a given entity from the
 * REST API.
 *
 * @param kind Entity kind.
 * @param name Entity name.
 */
export const getFieldsConfig =
	( kind: string, name: string ) =>
	async ( { dispatch }: CoreDataThunkArgs ) => {
		const config = await apiFetch< FieldsConfig >( {
			path: addQueryArgs( '/wp/v2/entity-fields', { kind, name } ),
		} );
		dispatch.receiveFieldsConfig( kind, name, config );
	};

/**
 * Requests the actions registered on the server for a given entity from the
 * REST API.
 *
 * @param kind Entity kind.
 * @param name Entity name.
 */
export const getEntityActionsConfig =
	( kind: string, name: string ) =>
	async ( { dispatch }: CoreDataThunkArgs ) => {
		const config = await apiFetch< EntityActionsConfig >( {
			path: addQueryArgs( '/wp/v2/entity-actions', { kind, name } ),
		} );
		dispatch.receiveEntityActionsConfig( kind, name, config );
	};
