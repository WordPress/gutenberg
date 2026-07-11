/**
 * External dependencies
 */
import { capitalCase, pascalCase } from 'change-case';
import fastDeepEqual from 'fast-deep-equal';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __unstableSerializeAndClean, parse } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { PostEditorAwareness } from './awareness/post-editor-awareness';
import { getSyncManager } from './sync';
import {
	applyPostChangesToCRDTDoc,
	defaultCollectionSyncConfig,
	defaultSyncConfig,
	getPostChangesFromCRDTDoc,
	normalizePostCRDTDoc,
	POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE,
} from './utils/crdt';

export const DEFAULT_ENTITY_KEY = 'id';
const POST_RAW_ATTRIBUTES = [ 'title', 'excerpt', 'content' ];
const POST_STALE_SAVE_ATTRIBUTES = [ ...POST_RAW_ATTRIBUTES, 'status' ];
const STALE_SAVE_CONFLICT_CODE = 'core_data_stale_save_conflict';

function getRawPostValue( value ) {
	return value && typeof value === 'object' && 'raw' in value
		? value.raw
		: value;
}

function getComparablePostValue( record, key ) {
	const value = POST_RAW_ATTRIBUTES.includes( key )
		? getRawPostValue( record?.[ key ] )
		: record?.[ key ];

	// Core data normalizes the auto-draft title placeholder to an empty string,
	// while a direct REST freshness check returns the literal "Auto Draft".
	// Treat only that placeholder as equivalent so the first collaborative save
	// is not mistaken for a concurrent title edit.
	if (
		key === 'title' &&
		record?.status === 'auto-draft' &&
		value === 'Auto Draft'
	) {
		return '';
	}

	return value;
}

function getChangedMetaKeys( baseMeta, nextMeta, candidateKeys ) {
	const base = baseMeta && typeof baseMeta === 'object' ? baseMeta : {};
	const next = nextMeta && typeof nextMeta === 'object' ? nextMeta : {};
	const keys = candidateKeys ?? [
		...new Set( [ ...Object.keys( base ), ...Object.keys( next ) ] ),
	];

	return keys.filter(
		( key ) =>
			key !== POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE &&
			! fastDeepEqual( base[ key ], next[ key ] )
	);
}

function getSerializedCRDTBlockContent( crdtRecord ) {
	return Array.isArray( crdtRecord?.blocks )
		? __unstableSerializeAndClean( crdtRecord.blocks ).trim()
		: undefined;
}

function getCRDTRawPostValue( crdtRecord, key ) {
	if ( key === 'content' ) {
		return (
			getSerializedCRDTBlockContent( crdtRecord ) ??
			getRawPostValue( crdtRecord?.content )
		);
	}

	return getRawPostValue( crdtRecord?.[ key ] );
}

function getComparableCRDTPostValue( crdtRecord, key ) {
	return POST_RAW_ATTRIBUTES.includes( key )
		? getCRDTRawPostValue( crdtRecord, key )
		: crdtRecord?.[ key ];
}

function createStaleSaveConflictError( conflictingFields ) {
	const error = new Error(
		__(
			'This post was not saved because it contains changes that conflict with a newer version. Review the latest changes and try again.'
		)
	);
	error.code = STALE_SAVE_CONFLICT_CODE;
	error.data = { conflictingFields };
	return error;
}

function getAutoDraftSaveDefaults(
	persistedRecord,
	latestRecord,
	edits,
	isTemplate
) {
	const defaults = {};
	if (
		isTemplate ||
		persistedRecord?.status !== 'auto-draft' ||
		latestRecord?.status !== 'auto-draft'
	) {
		return defaults;
	}

	// Saving an auto-draft should create a draft by default, but a stale window
	// must not revert a post that another window already published.
	if ( ! edits.status ) {
		defaults.status = 'draft';
	}

	// Fix the auto-draft default title only while the latest record still has
	// that placeholder. Do not blank a title saved by another window.
	if (
		( ! edits.title || edits.title === 'Auto Draft' ) &&
		( ! getRawPostValue( latestRecord?.title ) ||
			getRawPostValue( latestRecord?.title ) === 'Auto Draft' )
	) {
		defaults.title = '';
	}

	return defaults;
}

const blocksTransientEdits = {
	blocks: {
		read: ( record ) => parse( record.content?.raw ?? '' ),
		write: ( record ) => ( {
			content: __unstableSerializeAndClean( record.blocks ),
		} ),
	},
};

export const rootEntitiesConfig = [
	{
		label: __( 'Base' ),
		kind: 'root',
		key: false,
		name: '__unstableBase',
		baseURL: '/',
		baseURLParams: {
			// Please also change the preload path when changing this.
			// @see lib/compat/wordpress-7.1/preload.php
			_fields: [
				'description',
				'gmt_offset',
				'home',
				'image_sizes',
				'image_size_threshold',
				'name',
				'site_icon',
				'site_icon_url',
				'site_logo',
				'timezone_string',
				'url',
				'page_for_posts',
				'page_on_front',
				'show_on_front',
			].join( ',' ),
		},
		// The entity doesn't support selecting multiple records.
		// The property is maintained for backward compatibility.
		plural: '__unstableBases',
		supportsPagination: false,
	},
	{
		label: __( 'Post Type' ),
		name: 'postType',
		kind: 'root',
		key: 'slug',
		baseURL: '/wp/v2/types',
		baseURLParams: { context: 'edit' },
		plural: 'postTypes',
		supportsPagination: false,
	},
	{
		name: 'media',
		kind: 'root',
		baseURL: '/wp/v2/media',
		baseURLParams: { context: 'edit' },
		plural: 'mediaItems',
		label: __( 'Media' ),
		rawAttributes: [ 'caption', 'title', 'description' ],
		supportsPagination: true,
	},
	{
		name: 'taxonomy',
		kind: 'root',
		key: 'slug',
		baseURL: '/wp/v2/taxonomies',
		baseURLParams: { context: 'edit' },
		plural: 'taxonomies',
		label: __( 'Taxonomy' ),
		supportsPagination: false,
	},
	{
		name: 'sidebar',
		kind: 'root',
		baseURL: '/wp/v2/sidebars',
		baseURLParams: { context: 'edit' },
		plural: 'sidebars',
		transientEdits: { blocks: true },
		label: __( 'Widget areas' ),
		supportsPagination: false,
	},
	{
		name: 'widget',
		kind: 'root',
		baseURL: '/wp/v2/widgets',
		baseURLParams: { context: 'edit' },
		plural: 'widgets',
		transientEdits: { blocks: true },
		label: __( 'Widgets' ),
		supportsPagination: false,
	},
	{
		name: 'widgetType',
		kind: 'root',
		baseURL: '/wp/v2/widget-types',
		baseURLParams: { context: 'edit' },
		plural: 'widgetTypes',
		label: __( 'Widget types' ),
		supportsPagination: false,
	},
	{
		label: __( 'User' ),
		name: 'user',
		kind: 'root',
		baseURL: '/wp/v2/users',
		getTitle: ( record ) => record?.name || record?.slug,
		baseURLParams: { context: 'edit' },
		plural: 'users',
		supportsPagination: true,
	},
	{
		name: 'comment',
		kind: 'root',
		baseURL: '/wp/v2/comments',
		baseURLParams: { context: 'edit' },
		plural: 'comments',
		label: __( 'Comment' ),
		supportsPagination: true,
		syncConfig: defaultCollectionSyncConfig,
	},
	{
		name: 'menu',
		kind: 'root',
		baseURL: '/wp/v2/menus',
		baseURLParams: { context: 'edit' },
		plural: 'menus',
		label: __( 'Menu' ),
		supportsPagination: true,
	},
	{
		name: 'menuItem',
		kind: 'root',
		baseURL: '/wp/v2/menu-items',
		baseURLParams: { context: 'edit' },
		plural: 'menuItems',
		label: __( 'Menu Item' ),
		rawAttributes: [ 'title' ],
		supportsPagination: true,
	},
	{
		name: 'menuLocation',
		kind: 'root',
		baseURL: '/wp/v2/menu-locations',
		baseURLParams: { context: 'edit' },
		plural: 'menuLocations',
		label: __( 'Menu Location' ),
		key: 'name',
		supportsPagination: false,
	},
	{
		label: __( 'Global Styles' ),
		name: 'globalStyles',
		kind: 'root',
		baseURL: '/wp/v2/global-styles',
		baseURLParams: { context: 'edit' },
		plural: 'globalStylesVariations', // Should be different from name.
		getTitle: () => __( 'Custom Styles' ),
		getRevisionsUrl: ( parentId, revisionId ) =>
			`/wp/v2/global-styles/${ parentId }/revisions${
				revisionId ? '/' + revisionId : ''
			}`,
		supportsPagination: true,
	},
	{
		label: __( 'Themes' ),
		name: 'theme',
		kind: 'root',
		baseURL: '/wp/v2/themes',
		baseURLParams: { context: 'edit' },
		plural: 'themes',
		key: 'stylesheet',
		supportsPagination: false,
	},
	{
		label: __( 'Plugins' ),
		name: 'plugin',
		kind: 'root',
		baseURL: '/wp/v2/plugins',
		baseURLParams: { context: 'edit' },
		plural: 'plugins',
		key: 'plugin',
		supportsPagination: false,
	},
	{
		label: __( 'Status' ),
		name: 'status',
		kind: 'root',
		baseURL: '/wp/v2/statuses',
		baseURLParams: { context: 'edit' },
		plural: 'statuses',
		key: 'slug',
		supportsPagination: false,
	},
	{
		label: __( 'Registered Templates' ),
		name: 'registeredTemplate',
		kind: 'root',
		baseURL: '/wp/v2/registered-templates',
		key: 'id',
		supportsPagination: false,
	},
	{
		label: __( 'Font Collections' ),
		name: 'fontCollection',
		kind: 'root',
		baseURL: '/wp/v2/font-collections',
		baseURLParams: { context: 'view' },
		plural: 'fontCollections',
		key: 'slug',
		supportsPagination: true,
	},
	{
		label: __( 'Icons' ),
		name: 'icon',
		kind: 'root',
		baseURL: '/wp/v2/icons',
		baseURLParams: { context: 'view' },
		plural: 'icons',
		key: 'name',
		supportsPagination: false,
	},
	{
		label: __( 'Icon Collections' ),
		name: 'iconCollection',
		kind: 'root',
		baseURL: '/wp/v2/icon-collections',
		baseURLParams: { context: 'view' },
		plural: 'iconCollections',
		key: 'slug',
		supportsPagination: false,
	},
];

export const deprecatedEntities = {
	root: {
		media: {
			since: '6.9',
			alternative: {
				kind: 'postType',
				name: 'attachment',
			},
		},
	},
};

export const additionalEntityConfigLoaders = [
	{ kind: 'postType', loadEntities: loadPostTypeEntities },
	{ kind: 'taxonomy', loadEntities: loadTaxonomyEntities },
	{
		kind: 'root',
		name: 'site',
		plural: 'sites',
		loadEntities: loadSiteEntity,
	},
];

/**
 * Apply extra edits before persisting a post type.
 *
 * @param {Object}      persistedRecord  Already persisted Post
 * @param {Object}      edits            Edits.
 * @param {string}      name             Post type name.
 * @param {boolean}     isTemplate       Whether the post type is a template.
 * @param {string}      baseURL          REST base URL for the post type.
 * @param {Set<string>} syncedProperties Properties represented in the CRDT document.
 * @return {Promise< Object >} Updated edits.
 */
export const prePersistPostType = async (
	persistedRecord,
	edits,
	name,
	isTemplate,
	baseURL,
	syncedProperties = new Set( POST_STALE_SAVE_ATTRIBUTES )
) => {
	const newEdits = {};
	const objectType = `postType/${ name }`;
	const objectId = persistedRecord?.id;
	let syncManager;
	let localCRDTSnapshot;
	let serializedDoc;
	let hasSerializedDoc = false;
	let latestRecord;
	let rebasedCRDTRecord;
	let commitRebasedCRDTDoc;
	let autoDraftSaveDefaults;
	let didAttemptProtectedSerialization = false;
	const comparableSavedFields = [
		...new Set( [ ...POST_STALE_SAVE_ATTRIBUTES, ...syncedProperties ] ),
	].filter( ( key ) => ! [ 'blocks', 'meta', 'selection' ].includes( key ) );
	const editedSavedFields = comparableSavedFields.filter(
		( key ) => key in edits
	);
	const locallyChangedSavedFields = editedSavedFields.filter(
		( key ) =>
			! fastDeepEqual(
				getComparablePostValue( edits, key ),
				getComparablePostValue( persistedRecord, key )
			)
	);
	const locallyChangedSavedFieldSet = new Set( locallyChangedSavedFields );
	const freshnessResolvedSavedFieldSet = new Set();
	const locallyChangedMetaKeys =
		edits.meta && typeof edits.meta === 'object'
			? getChangedMetaKeys(
					persistedRecord?.meta,
					edits.meta,
					Object.keys( edits.meta )
			  )
			: [];

	if (
		window._wpCollaborationEnabled &&
		! isTemplate &&
		! (
			Array.isArray( window._wpCollaborationDisabledPostTypes ) &&
			window._wpCollaborationDisabledPostTypes.includes( name )
		) &&
		baseURL &&
		objectId
	) {
		try {
			syncManager = getSyncManager();
			didAttemptProtectedSerialization = true;
			localCRDTSnapshot = await syncManager?.createPersistedCRDTSnapshot(
				objectType,
				objectId
			);
			serializedDoc = localCRDTSnapshot?.serializedDoc;
			hasSerializedDoc = !! serializedDoc;

			// A persisted CRDT document can be stale even when this save only
			// changes status or meta. Check every save that would write a document,
			// as well as saves that directly edit a raw post field.
			if (
				! hasSerializedDoc &&
				! editedSavedFields.length &&
				! locallyChangedMetaKeys.length &&
				persistedRecord?.status !== 'auto-draft'
			) {
				latestRecord = undefined;
			} else {
				latestRecord = await apiFetch( {
					path: addQueryArgs( `${ baseURL }/${ objectId }`, {
						context: 'edit',
					} ),
				} );
			}
			autoDraftSaveDefaults = getAutoDraftSaveDefaults(
				persistedRecord,
				latestRecord ?? persistedRecord,
				edits,
				isTemplate
			);
			Object.assign( newEdits, autoDraftSaveDefaults );
			if ( localCRDTSnapshot && ! localCRDTSnapshot.isCurrent() ) {
				throw new Error(
					'Local record changed while checking the latest record.'
				);
			}

			const serverChangedSavedFields = latestRecord
				? comparableSavedFields.filter(
						( key ) =>
							key in latestRecord &&
							! fastDeepEqual(
								getComparablePostValue( latestRecord, key ),
								getComparablePostValue( persistedRecord, key )
							)
				  )
				: [];
			const serverChangedSavedFieldSet = new Set(
				serverChangedSavedFields
			);
			const serverChangedMetaKeys = latestRecord
				? getChangedMetaKeys( persistedRecord?.meta, latestRecord.meta )
				: [];
			const serverChangedMetaKeySet = new Set( serverChangedMetaKeys );
			const conflictingMetaKeys = locallyChangedMetaKeys.filter(
				( key ) =>
					serverChangedMetaKeySet.has( key ) &&
					! fastDeepEqual(
						edits.meta?.[ key ],
						latestRecord?.meta?.[ key ]
					)
			);
			if ( conflictingMetaKeys.length ) {
				throw createStaleSaveConflictError(
					conflictingMetaKeys.map( ( key ) => `meta.${ key }` )
				);
			}

			for ( const key of serverChangedSavedFields ) {
				if (
					! locallyChangedSavedFieldSet.has( key ) &&
					key in edits &&
					key in ( latestRecord ?? {} )
				) {
					newEdits[ key ] = getComparablePostValue(
						latestRecord,
						key
					);
				}
			}

			const preApplyConflictingSavedFields =
				locallyChangedSavedFields.filter(
					( key ) =>
						! POST_RAW_ATTRIBUTES.includes( key ) &&
						serverChangedSavedFieldSet.has( key ) &&
						! fastDeepEqual(
							getComparablePostValue( edits, key ),
							getComparablePostValue( latestRecord, key )
						)
				);
			if ( preApplyConflictingSavedFields.length ) {
				throw createStaleSaveConflictError(
					preApplyConflictingSavedFields
				);
			}

			const hasLatestPersistedCRDTDoc = Boolean(
				latestRecord?.meta?.[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]
			);
			const requiredCRDTFields = [
				...new Set( [
					...( latestRecord && 'content' in latestRecord
						? [ 'content' ]
						: [] ),
					...locallyChangedSavedFields.filter( ( key ) =>
						POST_RAW_ATTRIBUTES.includes( key )
					),
					...serverChangedSavedFields,
					...serverChangedMetaKeys.map( ( key ) => `meta.${ key }` ),
				] ),
			];
			const sharedCRDTHistoryFields = [
				...new Set( [
					...( latestRecord && 'content' in latestRecord
						? [ 'content' ]
						: [] ),
					...locallyChangedSavedFields.filter( ( key ) =>
						POST_RAW_ATTRIBUTES.includes( key )
					),
					...serverChangedSavedFields.filter( ( key ) =>
						POST_RAW_ATTRIBUTES.includes( key )
					),
					...( locallyChangedMetaKeys.length ||
					serverChangedMetaKeys.length
						? [ 'meta' ]
						: [] ),
				] ),
			];
			const rebasedCRDTDoc = hasLatestPersistedCRDTDoc
				? ( await syncManager?.createRebasedPersistedCRDTDoc?.(
						objectType,
						objectId,
						latestRecord,
						localCRDTSnapshot,
						requiredCRDTFields,
						true,
						sharedCRDTHistoryFields,
						autoDraftSaveDefaults
				  ) ) ?? null
				: null;
			if ( hasLatestPersistedCRDTDoc && ! rebasedCRDTDoc ) {
				throw new Error(
					'Could not create a rebased persisted CRDT document.'
				);
			}

			if ( rebasedCRDTDoc ) {
				if ( typeof rebasedCRDTDoc.commit !== 'function' ) {
					throw new Error(
						'Rebased CRDT document cannot be applied to the editor.'
					);
				}
				commitRebasedCRDTDoc = rebasedCRDTDoc.commit;
				serializedDoc = rebasedCRDTDoc.serializedDoc;
				hasSerializedDoc = !! serializedDoc;
				if ( ! hasSerializedDoc ) {
					throw new Error(
						'Could not serialize the rebased CRDT document.'
					);
				}

				rebasedCRDTRecord = rebasedCRDTDoc.record;
				const unrepresentedSavedFields = [
					...new Set( [
						...locallyChangedSavedFields,
						...serverChangedSavedFields,
						...Object.keys( autoDraftSaveDefaults ),
					] ),
				].filter( ( key ) => {
					const isConcurrentRawMerge =
						POST_RAW_ATTRIBUTES.includes( key ) &&
						locallyChangedSavedFieldSet.has( key ) &&
						serverChangedSavedFieldSet.has( key ) &&
						! fastDeepEqual(
							getComparablePostValue( edits, key ),
							getComparablePostValue( latestRecord, key )
						);
					if ( isConcurrentRawMerge ) {
						return false;
					}

					let expectedValue = getComparablePostValue(
						latestRecord,
						key
					);
					if ( key in autoDraftSaveDefaults ) {
						expectedValue = autoDraftSaveDefaults[ key ];
					} else if ( locallyChangedSavedFieldSet.has( key ) ) {
						expectedValue = getComparablePostValue( edits, key );
					}
					return ! fastDeepEqual(
						getComparableCRDTPostValue( rebasedCRDTRecord, key ),
						expectedValue
					);
				} );
				const unreconciledMetaKeys = serverChangedMetaKeys.filter(
					( key ) =>
						! locallyChangedMetaKeys.includes( key ) &&
						! fastDeepEqual(
							rebasedCRDTRecord?.meta?.[ key ],
							latestRecord?.meta?.[ key ]
						)
				);
				const unrepresentedLocalMetaKeys =
					locallyChangedMetaKeys.filter(
						( key ) =>
							! fastDeepEqual(
								rebasedCRDTRecord?.meta?.[ key ],
								edits.meta?.[ key ]
							)
					);
				if (
					unrepresentedSavedFields.length ||
					unreconciledMetaKeys.length ||
					unrepresentedLocalMetaKeys.length
				) {
					throw new Error(
						'Rebased CRDT document does not represent all saved changes.'
					);
				}

				if ( locallyChangedSavedFields.length ) {
					const crdtRecord = rebasedCRDTRecord;

					for ( const key of locallyChangedSavedFields ) {
						const hasCRDTValue =
							POST_RAW_ATTRIBUTES.includes( key ) &&
							( key === 'content'
								? key in ( crdtRecord ?? {} ) ||
								  Array.isArray( crdtRecord?.blocks )
								: key in ( crdtRecord ?? {} ) );

						if ( hasCRDTValue ) {
							const crdtValue = getCRDTRawPostValue(
								crdtRecord,
								key
							);

							if (
								serverChangedSavedFieldSet.has( key ) &&
								crdtValue !== undefined &&
								crdtValue !==
									getRawPostValue( latestRecord?.[ key ] ) &&
								crdtValue !==
									getComparablePostValue( edits, key )
							) {
								newEdits[ key ] = crdtValue;
								freshnessResolvedSavedFieldSet.add( key );
							}
						}
					}
				}
			}

			if (
				hasSerializedDoc &&
				! hasLatestPersistedCRDTDoc &&
				( serverChangedSavedFields.length ||
					serverChangedMetaKeys.length )
			) {
				// Without a current server CRDT document, any serialized fallback
				// would pair merged HTML with a different CRDT snapshot. Refuse the
				// save instead of persisting inconsistent state.
				throw createStaleSaveConflictError( [
					...serverChangedSavedFields,
					...serverChangedMetaKeys.map( ( key ) => `meta.${ key }` ),
				] );
			}

			const conflictingSavedFields = locallyChangedSavedFields.filter(
				( key ) =>
					serverChangedSavedFieldSet.has( key ) &&
					! fastDeepEqual(
						getComparablePostValue( edits, key ),
						getComparablePostValue( latestRecord, key )
					) &&
					! freshnessResolvedSavedFieldSet.has( key )
			);
			if ( conflictingSavedFields.length ) {
				throw createStaleSaveConflictError( conflictingSavedFields );
			}
		} catch ( error ) {
			if ( error?.code === STALE_SAVE_CONFLICT_CODE ) {
				throw error;
			}

			const freshnessError = new Error(
				__(
					'This post was not saved because its latest version could not be checked. Try again.'
				)
			);
			freshnessError.code = 'core_data_stale_save_check_failed';
			freshnessError.cause = error;
			throw freshnessError;
		}
	}

	if ( ! autoDraftSaveDefaults ) {
		autoDraftSaveDefaults = getAutoDraftSaveDefaults(
			persistedRecord,
			latestRecord ?? persistedRecord,
			edits,
			isTemplate
		);
		Object.assign( newEdits, autoDraftSaveDefaults );
	}

	if ( latestRecord && edits.meta && typeof edits.meta === 'object' ) {
		const reconciledMeta = { ...( latestRecord.meta ?? {} ) };
		const allowedMetaKeys = new Set( [
			...Object.keys( latestRecord.meta ?? {} ),
			...locallyChangedMetaKeys,
		] );
		for ( const key of locallyChangedMetaKeys ) {
			reconciledMeta[ key ] = edits.meta[ key ];
		}
		if (
			rebasedCRDTRecord?.meta &&
			typeof rebasedCRDTRecord.meta === 'object'
		) {
			for ( const [ key, value ] of Object.entries(
				rebasedCRDTRecord.meta
			) ) {
				if ( allowedMetaKeys.has( key ) ) {
					reconciledMeta[ key ] = value;
				}
			}
		}
		delete reconciledMeta[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ];
		newEdits.meta = reconciledMeta;
	}

	// Add meta for the persisted CRDT document during real post saves so the
	// saved post and CRDT snapshot are committed in the same request. We don't
	// want a post save to fail but a CRDT update to succeed or vice versa.
	// CRDT repair uses /wp-sync/v1/save to avoid post-save side effects.
	if ( persistedRecord ) {
		if ( ! hasSerializedDoc && ! didAttemptProtectedSerialization ) {
			serializedDoc = await (
				syncManager ?? getSyncManager()
			)?.createPersistedCRDTDoc( objectType, objectId );
		}

		if ( serializedDoc ) {
			newEdits.meta = {
				...edits.meta,
				...newEdits.meta,
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: serializedDoc,
			};
		}
	}

	if ( commitRebasedCRDTDoc ) {
		try {
			if ( ! ( await commitRebasedCRDTDoc() ) ) {
				throw new Error(
					'Could not apply the rebased CRDT document to the editor.'
				);
			}
		} catch ( error ) {
			const freshnessError = new Error(
				__(
					'This post was not saved because its latest version could not be checked. Try again.'
				)
			);
			freshnessError.code = 'core_data_stale_save_check_failed';
			freshnessError.cause = error;
			throw freshnessError;
		}
	}

	return newEdits;
};

/**
 * Returns the list of post type entities.
 *
 * @return {Promise} Entities promise
 */
async function loadPostTypeEntities() {
	const postTypesPromise = apiFetch( { path: '/wp/v2/types?context=view' } );
	const taxonomiesPromise = window._wpCollaborationEnabled
		? apiFetch( { path: '/wp/v2/taxonomies?context=view' } )
		: Promise.resolve( {} );
	const [ postTypes, taxonomies ] = await Promise.all( [
		postTypesPromise,
		taxonomiesPromise,
	] );

	return Object.entries( postTypes ?? {} ).map( ( [ name, postType ] ) => {
		const isTemplate = [ 'wp_template', 'wp_template_part' ].includes(
			name
		);
		const namespace = postType?.rest_namespace ?? 'wp/v2';

		const syncedProperties = new Set( [
			'author',
			'blocks',
			'content',
			'comment_status',
			'date',
			'excerpt',
			'featured_media',
			'format',
			'meta',
			'ping_status',
			'slug',
			'status',
			'sticky',
			'template',
			'title',
			...( postType.taxonomies
				?.map( ( taxonomy ) => taxonomies?.[ taxonomy ]?.rest_base )
				?.filter( Boolean ) ?? [] ),
		] );

		const entity = {
			kind: 'postType',
			baseURL: `/${ namespace }/${ postType.rest_base }`,
			baseURLParams: { context: 'edit' },
			name,
			label: postType.name,
			transientEdits: {
				...blocksTransientEdits,
				selection: true,
			},
			mergedEdits: { meta: true },
			rawAttributes: POST_RAW_ATTRIBUTES,
			getTitle: ( record ) =>
				record?.title?.rendered ||
				record?.title ||
				( isTemplate
					? capitalCase( record.slug ?? '' )
					: String( record.id ) ),
			__unstablePrePersist: ( persistedRecord, edits ) =>
				prePersistPostType(
					persistedRecord,
					edits,
					name,
					isTemplate,
					`/${ namespace }/${ postType.rest_base }`,
					syncedProperties
				),
			__unstable_rest_base: postType.rest_base,
			supportsPagination: true,
			getRevisionsUrl: ( parentId, revisionId ) =>
				`/${ namespace }/${
					postType.rest_base
				}/${ parentId }/revisions${
					revisionId ? '/' + revisionId : ''
				}`,
			revisionKey:
				isTemplate && ! window?.__experimentalTemplateActivate
					? 'wp_id'
					: DEFAULT_ENTITY_KEY,
		};

		/**
		 * @type {import('@wordpress/sync').SyncConfig}
		 */
		entity.syncConfig = {
			// Save a CRDT document with this entity
			supportsPersistence: true,

			/**
			 * Apply changes from the local editor to the local CRDT document so
			 * that those changes can be synced to other peers (via the provider).
			 *
			 * @param {import('@wordpress/sync').CRDTDoc}               crdtDoc
			 * @param {Partial< import('@wordpress/sync').ObjectData >} changes
			 * @return {void}
			 */
			applyChangesToCRDTDoc: ( crdtDoc, changes ) =>
				applyPostChangesToCRDTDoc( crdtDoc, changes, syncedProperties ),

			/**
			 * Create the awareness instance for the entity's CRDT document.
			 *
			 * @param {import('@wordpress/sync').CRDTDoc}  ydoc
			 * @param {import('@wordpress/sync').ObjectID} objectId
			 * @return {import('@wordpress/sync').Awareness} Awareness instance
			 */
			createAwareness: ( ydoc, objectId ) => {
				const kind = 'postType';
				const id = parseInt( objectId, 10 );
				return new PostEditorAwareness( ydoc, kind, name, id );
			},

			/**
			 * Extract changes from a CRDT document that can be used to update the
			 * local editor state.
			 *
			 * @param {import('@wordpress/sync').CRDTDoc}    crdtDoc
			 * @param {import('@wordpress/sync').ObjectData} editedRecord
			 * @return {Partial< import('@wordpress/sync').ObjectData >} Changes to record
			 */
			getChangesFromCRDTDoc: ( crdtDoc, editedRecord ) =>
				getPostChangesFromCRDTDoc(
					crdtDoc,
					editedRecord,
					syncedProperties
				),

			/**
			 * Extract changes from a CRDT document that can be used to update the
			 * local editor state.
			 *
			 * @param {import('@wordpress/sync').ObjectData} record
			 * @return {Partial< import('@wordpress/sync').ObjectData >} Changes to record
			 */
			getPersistedCRDTDoc: ( record ) => {
				return (
					record?.meta?.[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ] ||
					null
				);
			},
			normalizeCRDTDoc: normalizePostCRDTDoc,
			shouldInvalidateSnapshot: ( changes ) =>
				Object.keys( changes ).some( ( key ) => key !== 'selection' ),
			shouldSync: () =>
				! (
					Array.isArray( window._wpCollaborationDisabledPostTypes ) &&
					window._wpCollaborationDisabledPostTypes.includes( name )
				),
		};

		return entity;
	} );
}

/**
 * Returns the list of the taxonomies entities.
 *
 * @return {Promise} Entities promise
 */
async function loadTaxonomyEntities() {
	const taxonomies = await apiFetch( {
		path: '/wp/v2/taxonomies?context=view',
	} );
	return Object.entries( taxonomies ?? {} ).map( ( [ name, taxonomy ] ) => {
		const namespace = taxonomy?.rest_namespace ?? 'wp/v2';
		const entity = {
			kind: 'taxonomy',
			baseURL: `/${ namespace }/${ taxonomy.rest_base }`,
			baseURLParams: { context: 'edit' },
			name,
			label: taxonomy.name,
			getTitle: ( record ) => record?.name,
			supportsPagination: true,
		};

		entity.syncConfig = defaultSyncConfig;

		return entity;
	} );
}

/**
 * Returns the Site entity.
 *
 * @return {Promise} Entity promise
 */
async function loadSiteEntity() {
	const entity = {
		label: __( 'Site' ),
		name: 'site',
		kind: 'root',
		key: false,
		baseURL: '/wp/v2/settings',
		supportsPagination: false,
		meta: {},
	};

	const site = await apiFetch( {
		path: entity.baseURL,
		method: 'OPTIONS',
	} );

	const labels = {};
	Object.entries( site?.schema?.properties ?? {} ).forEach(
		( [ key, value ] ) => {
			// Ignore properties `title` and `type` keys.
			if ( typeof value === 'object' && value.title ) {
				labels[ key ] = value.title;
			}
		}
	);

	return [ { ...entity, meta: { labels } } ];
}

/**
 * Returns the entity's getter method name given its kind and name or plural name.
 *
 * @example
 * ```js
 * const nameSingular = getMethodName( 'root', 'theme', 'get' );
 * // nameSingular is getRootTheme
 *
 * const namePlural = getMethodName( 'root', 'themes', 'set' );
 * // namePlural is setRootThemes
 * ```
 *
 * @param {string} kind   Entity kind.
 * @param {string} name   Entity name or plural name.
 * @param {string} prefix Function prefix.
 *
 * @return {string} Method name
 */
export const getMethodName = ( kind, name, prefix = 'get' ) => {
	const kindPrefix = kind === 'root' ? '' : pascalCase( kind );
	const suffix = pascalCase( name );
	return `${ prefix }${ kindPrefix }${ suffix }`;
};
