/**
 * External dependencies
 */
import { capitalCase, pascalCase } from 'change-case';

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
import { getSyncManager, LOCAL_UNDO_IGNORED_ORIGIN } from './sync';
import {
	applyPostChangesToCRDTDoc,
	defaultCollectionSyncConfig,
	defaultSyncConfig,
	getPostChangesFromCRDTDoc,
	POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE,
} from './utils/crdt';

export const DEFAULT_ENTITY_KEY = 'id';
const POST_RAW_ATTRIBUTES = [ 'title', 'excerpt', 'content' ];
const POST_SNAPSHOT_RAW_ATTRIBUTES = [ 'title', 'excerpt', 'content' ];
const POST_TYPES_WITH_STALE_SAVE_PROTECTION = new Set( [ 'post', 'page' ] );

function getRawPostValue( value ) {
	return value && typeof value === 'object' && 'raw' in value
		? value.raw
		: value;
}

function getRawPostSnapshot( record ) {
	if ( ! record ) {
		return {};
	}

	return Object.fromEntries(
		POST_SNAPSHOT_RAW_ATTRIBUTES.filter( ( key ) => key in record ).map(
			( key ) => [ key, getRawPostValue( record[ key ] ) ]
		)
	);
}

function getRawPostSnapshotForPersistence( baseRecord, ...records ) {
	const recordSnapshot = Object.assign(
		{},
		...records.map( getRawPostSnapshot )
	);

	if ( ! ( 'content' in recordSnapshot ) ) {
		return recordSnapshot;
	}

	return {
		...getRawPostSnapshot( baseRecord ),
		...recordSnapshot,
	};
}

function getSerializedBlockValue( block ) {
	return __unstableSerializeAndClean( [ block ] ).trim();
}

function getSerializedBlockShellValue( block ) {
	return getSerializedBlockValue( {
		...block,
		innerBlocks: [],
	} );
}

function areCRDTSnapshotBlocksCompatible( snapshotBlock, crdtBlock ) {
	if (
		! snapshotBlock ||
		! crdtBlock ||
		snapshotBlock.name !== crdtBlock.name
	) {
		return false;
	}

	try {
		if (
			getSerializedBlockShellValue( snapshotBlock ) ===
			getSerializedBlockShellValue( crdtBlock )
		) {
			return true;
		}
	} catch {}

	return true;
}

function reuseCRDTBlockClientIds( snapshotBlocks, crdtBlocks = [] ) {
	let searchStart = 0;

	return snapshotBlocks.map( ( snapshotBlock ) => {
		let crdtBlock;
		for ( let i = searchStart; i < crdtBlocks.length; i++ ) {
			if (
				areCRDTSnapshotBlocksCompatible(
					snapshotBlock,
					crdtBlocks[ i ]
				)
			) {
				crdtBlock = crdtBlocks[ i ];
				searchStart = i + 1;
				break;
			}
		}

		return {
			...snapshotBlock,
			...( crdtBlock?.clientId ? { clientId: crdtBlock.clientId } : {} ),
			innerBlocks: reuseCRDTBlockClientIds(
				snapshotBlock.innerBlocks ?? [],
				crdtBlock?.innerBlocks ?? []
			),
		};
	} );
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

function getCRDTSnapshotChangesFromPostEdits( edits, crdtRecord ) {
	const changes = {};

	for ( const key of POST_RAW_ATTRIBUTES ) {
		if ( ! ( key in edits ) ) {
			continue;
		}

		const rawValue = getRawPostValue( edits[ key ] );
		if ( rawValue === undefined ) {
			continue;
		}

		changes[ key ] = rawValue;

		if ( key === 'content' ) {
			const blocks = parse( rawValue );
			changes.blocks = Array.isArray( crdtRecord?.blocks )
				? reuseCRDTBlockClientIds( blocks, crdtRecord.blocks )
				: blocks;
		}
	}

	return changes;
}

function getCRDTSnapshotBaseRecord( record ) {
	const content = getRawPostValue( record?.content );

	if ( typeof content !== 'string' ) {
		return record;
	}

	return {
		...record,
		blocks: parse( content ),
	};
}

function areSerializedBlocksEqualAt( blocksA, blocksB, index ) {
	return (
		blocksA[ index ]?.name === blocksB[ index ]?.name &&
		getSerializedBlockValue( blocksA[ index ] ) ===
			getSerializedBlockValue( blocksB[ index ] )
	);
}

function mergeStaleSerializedBlockContent(
	baseContent,
	latestContent,
	localContent
) {
	if (
		typeof baseContent !== 'string' ||
		typeof latestContent !== 'string' ||
		typeof localContent !== 'string'
	) {
		return;
	}

	const baseBlocks = parse( baseContent );
	const latestBlocks = parse( latestContent );
	const localBlocks = parse( localContent );

	if (
		! baseBlocks.length ||
		! latestBlocks.length ||
		! localBlocks.length
	) {
		return;
	}

	if (
		latestBlocks.length > localBlocks.length &&
		baseBlocks.length === latestBlocks.length
	) {
		for ( let index = 0; index < localBlocks.length; index++ ) {
			if ( localBlocks[ index ].name !== latestBlocks[ index ].name ) {
				return;
			}
		}

		return __unstableSerializeAndClean( [
			...localBlocks,
			...latestBlocks.slice( localBlocks.length ),
		] );
	}

	if (
		baseBlocks.length < latestBlocks.length &&
		baseBlocks.length < localBlocks.length
	) {
		for ( let index = 0; index < baseBlocks.length; index++ ) {
			if (
				! areSerializedBlocksEqualAt(
					baseBlocks,
					latestBlocks,
					index
				) ||
				! areSerializedBlocksEqualAt( baseBlocks, localBlocks, index )
			) {
				return;
			}
		}

		return __unstableSerializeAndClean( [
			...localBlocks,
			...latestBlocks.slice( baseBlocks.length ),
		] );
	}

	if (
		baseBlocks.length !== latestBlocks.length ||
		baseBlocks.length !== localBlocks.length
	) {
		return;
	}

	const mergedBlocks = [];

	for ( let index = 0; index < baseBlocks.length; index++ ) {
		const baseBlock = baseBlocks[ index ];
		const latestBlock = latestBlocks[ index ];
		const localBlock = localBlocks[ index ];

		if (
			baseBlock.name !== latestBlock.name ||
			baseBlock.name !== localBlock.name
		) {
			return;
		}

		const baseValue = getSerializedBlockValue( baseBlock );
		const latestValue = getSerializedBlockValue( latestBlock );
		const localValue = getSerializedBlockValue( localBlock );

		if ( localValue === latestValue ) {
			mergedBlocks.push( localBlock );
		} else if ( localValue === baseValue ) {
			mergedBlocks.push( latestBlock );
		} else if ( latestValue === baseValue ) {
			mergedBlocks.push( localBlock );
		} else {
			return;
		}
	}

	return __unstableSerializeAndClean( mergedBlocks );
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
			// @see lib/compat/wordpress-7.0/preload.php
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
 * @param {Object}  persistedRecord                     Already persisted Post
 * @param {Object}  edits                               Edits.
 * @param {string}  name                                Post type name.
 * @param {boolean} isTemplate                          Whether the post type is a template.
 * @param {string}  baseURL                             REST base URL for the post type.
 * @param {Object}  options                             Pre-persist options.
 * @param {Object}  options.recordSnapshot              Current record snapshot to store
 *                                                      with the CRDT document.
 * @param {boolean} options.__unstableIsRevisionRestore Revision restore save.
 * @return {Promise< Object >} Updated edits.
 */
export const prePersistPostType = async (
	persistedRecord,
	edits,
	name,
	isTemplate,
	baseURL,
	options = {}
) => {
	const newEdits = {};
	const objectType = `postType/${ name }`;
	const objectId = persistedRecord?.id;
	let syncManager;
	let serializedDoc;
	let hasSerializedDoc = false;
	let latestRecordForCRDTSnapshot;
	let latestPersistedCRDTDoc;
	const createPersistedCRDTDocOptions = (
		basePersistedCRDTDoc,
		baseRecordSnapshot = persistedRecord
	) => {
		const baseRawRecordSnapshot = getRawPostSnapshot( baseRecordSnapshot );
		const recordSnapshot = getRawPostSnapshotForPersistence(
			baseRecordSnapshot,
			options.recordSnapshot,
			edits,
			newEdits
		);

		return {
			basePersistedCRDTDoc,
			...( Object.keys( recordSnapshot ).length
				? {
						baseRecordSnapshot: baseRawRecordSnapshot,
						recordSnapshot,
				  }
				: {} ),
		};
	};
	const editedSavedFields = POST_RAW_ATTRIBUTES.filter(
		( key ) => key in edits
	);
	const locallyChangedSavedFields = editedSavedFields.filter(
		( key ) =>
			getRawPostValue( edits[ key ] ) !==
			getRawPostValue( persistedRecord?.[ key ] )
	);
	const locallyChangedSavedFieldSet = new Set( locallyChangedSavedFields );
	const shouldPreserveRevisionRestoreSavedField = ( key ) =>
		options.__unstableIsRevisionRestore &&
		locallyChangedSavedFieldSet.has( key );
	const shouldPreserveRevisionRestoreContent =
		shouldPreserveRevisionRestoreSavedField( 'content' );

	if ( ! isTemplate && persistedRecord?.status === 'auto-draft' ) {
		// Saving an auto-draft should create a draft by default.
		if ( ! edits.status && ! newEdits.status ) {
			newEdits.status = 'draft';
		}

		// Fix the auto-draft default title.
		if (
			( ! edits.title || edits.title === 'Auto Draft' ) &&
			! newEdits.title &&
			( ! persistedRecord?.title ||
				persistedRecord?.title === 'Auto Draft' )
		) {
			newEdits.title = '';
		}
	}

	if (
		window._wpCollaborationEnabled &&
		POST_TYPES_WITH_STALE_SAVE_PROTECTION.has( name ) &&
		baseURL &&
		objectId &&
		editedSavedFields.length
	) {
		try {
			syncManager = getSyncManager();
			serializedDoc = await syncManager?.createPersistedCRDTDoc(
				objectType,
				objectId,
				createPersistedCRDTDocOptions(
					persistedRecord?.meta?.[
						POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE
					] || null
				)
			);
			hasSerializedDoc = !! serializedDoc;
			const latestRecord = await apiFetch( {
				path: addQueryArgs( `${ baseURL }/${ objectId }`, {
					context: 'edit',
				} ),
			} );
			latestRecordForCRDTSnapshot = latestRecord;
			const serverChangedSavedFields = editedSavedFields.filter(
				( key ) =>
					getRawPostValue( latestRecord?.[ key ] ) !==
					getRawPostValue( persistedRecord?.[ key ] )
			);
			const serverChangedSavedFieldSet = new Set(
				serverChangedSavedFields
			);
			for ( const key of serverChangedSavedFields ) {
				if (
					! locallyChangedSavedFieldSet.has( key ) &&
					key in ( latestRecord ?? {} )
				) {
					newEdits[ key ] = getRawPostValue( latestRecord[ key ] );
				}
			}

			const hasLatestPersistedCRDTDoc = Boolean(
				latestRecord?.meta?.[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]
			);
			latestPersistedCRDTDoc =
				latestRecord?.meta?.[
					POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE
				] || null;
			const shouldApplyLatestCRDTDoc =
				hasLatestPersistedCRDTDoc || locallyChangedSavedFields.length;
			const didApplyLatestCRDTDoc = shouldApplyLatestCRDTDoc
				? ( await syncManager?.applyPersistedCRDTDoc?.(
						objectType,
						objectId,
						latestRecord
				  ) ) ?? false
				: false;

			if (
				didApplyLatestCRDTDoc ||
				( hasLatestPersistedCRDTDoc && serverChangedSavedFields.length )
			) {
				serializedDoc = await syncManager?.createPersistedCRDTDoc(
					objectType,
					objectId,
					createPersistedCRDTDocOptions(
						latestRecord?.meta?.[
							POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE
						] || null,
						latestRecord
					)
				);
				hasSerializedDoc = !! serializedDoc;

				if (
					hasLatestPersistedCRDTDoc &&
					locallyChangedSavedFields.length
				) {
					const crdtRecord = syncManager?.getCRDTRecordData?.(
						objectType,
						objectId
					);

					for ( const key of locallyChangedSavedFields ) {
						if ( shouldPreserveRevisionRestoreSavedField( key ) ) {
							continue;
						}

						const hasCRDTValue =
							key === 'content'
								? key in ( crdtRecord ?? {} ) ||
								  Array.isArray( crdtRecord?.blocks )
								: key in ( crdtRecord ?? {} );

						if ( hasCRDTValue ) {
							const crdtValue = getCRDTRawPostValue(
								crdtRecord,
								key
							);

							const editValue = getRawPostValue( edits[ key ] );

							if (
								key !== 'content' &&
								crdtValue !== editValue
							) {
								continue;
							}

							if (
								crdtValue !==
								getRawPostValue( latestRecord?.[ key ] )
							) {
								newEdits[ key ] = crdtValue;
							}
						}
					}
				}
			}

			if (
				locallyChangedSavedFieldSet.has( 'content' ) &&
				! shouldPreserveRevisionRestoreContent &&
				! ( 'content' in newEdits )
			) {
				const mergedContent = mergeStaleSerializedBlockContent(
					getRawPostValue( persistedRecord?.content ),
					getRawPostValue( latestRecord?.content ),
					getRawPostValue( edits.content )
				);

				if (
					mergedContent !== undefined &&
					mergedContent !== getRawPostValue( edits.content )
				) {
					newEdits.content = mergedContent;
				}
			}

			const repairableSavedFields = editedSavedFields.filter( ( key ) => {
				const shouldRepairSavedFieldFromCRDT =
					didApplyLatestCRDTDoc ||
					serverChangedSavedFieldSet.has( key );

				return (
					! ( key in newEdits ) &&
					shouldRepairSavedFieldFromCRDT &&
					( key !== 'content' ||
						! serverChangedSavedFieldSet.has( key ) )
				);
			} );

			if ( hasLatestPersistedCRDTDoc && repairableSavedFields.length ) {
				const crdtRecord = syncManager?.getCRDTRecordData?.(
					objectType,
					objectId
				);

				for ( const key of repairableSavedFields ) {
					if ( shouldPreserveRevisionRestoreSavedField( key ) ) {
						continue;
					}

					const hasCRDTValue =
						key === 'content'
							? key in ( crdtRecord ?? {} ) ||
							  Array.isArray( crdtRecord?.blocks )
							: key in ( crdtRecord ?? {} );

					if ( ! hasCRDTValue ) {
						continue;
					}

					const crdtValue = getCRDTRawPostValue( crdtRecord, key );
					const editValue = getRawPostValue( edits[ key ] );
					const latestValue = getRawPostValue(
						latestRecord?.[ key ]
					);

					if (
						key === 'content' &&
						crdtValue === '' &&
						editValue !== ''
					) {
						continue;
					}

					if ( key !== 'content' && crdtValue !== editValue ) {
						continue;
					}

					if (
						serverChangedSavedFieldSet.has( key ) &&
						crdtValue !== latestValue
					) {
						continue;
					}

					if ( crdtValue !== editValue ) {
						newEdits[ key ] = crdtValue;
					}
				}
			}
		} catch {
			// A failed freshness check should not block saving. The request itself
			// will still surface any real save errors to the editor.
		}
	}

	if (
		window._wpCollaborationEnabled &&
		POST_TYPES_WITH_STALE_SAVE_PROTECTION.has( name ) &&
		objectId &&
		locallyChangedSavedFieldSet.has( 'content' ) &&
		! shouldPreserveRevisionRestoreContent &&
		getRawPostValue( edits.content ) === '' &&
		! ( 'content' in newEdits )
	) {
		const crdtRecord = (
			syncManager ?? getSyncManager()
		)?.getCRDTRecordData?.( objectType, objectId );
		const crdtContent = getSerializedCRDTBlockContent( crdtRecord );

		if ( crdtContent ) {
			newEdits.content = crdtContent;
		}
	}

	// Add meta for persisted CRDT document.
	if ( persistedRecord ) {
		const snapshotEdits = getRawPostSnapshotForPersistence(
			latestRecordForCRDTSnapshot ?? persistedRecord,
			options.recordSnapshot,
			edits,
			newEdits
		);
		const snapshotSyncManager = syncManager ?? getSyncManager();
		const hasBasePersistedCRDTDoc = Boolean(
			latestPersistedCRDTDoc ||
				persistedRecord?.meta?.[
					POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE
				]
		);
		const shouldReuseCRDTBlockClientIds =
			snapshotSyncManager?.update &&
			hasBasePersistedCRDTDoc &&
			'content' in snapshotEdits &&
			getRawPostValue( snapshotEdits.content ) !== undefined;
		const currentCRDTRecord = shouldReuseCRDTBlockClientIds
			? snapshotSyncManager?.getCRDTRecordData?.( objectType, objectId )
			: undefined;
		const crdtSnapshotChanges = getCRDTSnapshotChangesFromPostEdits(
			snapshotEdits,
			currentCRDTRecord
		);
		if ( Object.keys( crdtSnapshotChanges ).length ) {
			const snapshotBaseRecord = Array.isArray(
				currentCRDTRecord?.blocks
			)
				? currentCRDTRecord
				: getCRDTSnapshotBaseRecord(
						latestRecordForCRDTSnapshot ?? persistedRecord
				  );
			const snapshotUpdateOptions = {
				baseRecord: snapshotBaseRecord,
			};
			snapshotSyncManager?.update?.(
				objectType,
				objectId,
				crdtSnapshotChanges,
				LOCAL_UNDO_IGNORED_ORIGIN,
				crdtSnapshotChanges.blocks
					? snapshotUpdateOptions
					: {
							...snapshotUpdateOptions,
							isSave: true,
					  }
			);
			if ( crdtSnapshotChanges.blocks ) {
				snapshotSyncManager?.update?.(
					objectType,
					objectId,
					{},
					LOCAL_UNDO_IGNORED_ORIGIN,
					{ isSave: true }
				);
			}
			hasSerializedDoc = false;
		}

		if ( ! hasSerializedDoc ) {
			serializedDoc = await (
				syncManager ?? getSyncManager()
			)?.createPersistedCRDTDoc(
				objectType,
				objectId,
				createPersistedCRDTDocOptions(
					latestPersistedCRDTDoc ||
						persistedRecord?.meta?.[
							POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE
						] ||
						null,
					latestRecordForCRDTSnapshot ?? persistedRecord
				)
			);
		}

		if ( serializedDoc ) {
			newEdits.meta = {
				...edits.meta,
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: serializedDoc,
			};
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
			__unstablePrePersist: ( persistedRecord, edits, options ) =>
				prePersistPostType(
					persistedRecord,
					edits,
					name,
					isTemplate,
					`/${ namespace }/${ postType.rest_base }`,
					options
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
				// Save a CRDT document with this entity.
				supportsPersistence: true,

				shouldSync: () =>
					! window._wpCollaborationDisabledPostTypes?.includes( name ),

			/**
			 * Apply changes from the local editor to the local CRDT document so
			 * that those changes can be synced to other peers (via the provider).
			 *
			 * @param {import('@wordpress/sync').CRDTDoc}               crdtDoc
			 * @param {Partial< import('@wordpress/sync').ObjectData >} changes
			 * @param {Object}                                          options
			 * @return {void}
			 */
			applyChangesToCRDTDoc: ( crdtDoc, changes, options ) => {
				if ( options ) {
					return applyPostChangesToCRDTDoc(
						crdtDoc,
						changes,
						syncedProperties,
						options
					);
				}
				return applyPostChangesToCRDTDoc(
					crdtDoc,
					changes,
					syncedProperties
				);
			},

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
