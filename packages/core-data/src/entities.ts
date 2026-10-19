import { capitalCase, pascalCase } from 'change-case';
import apiFetch from '@wordpress/api-fetch';
import { __unstableSerializeAndClean, parse } from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { PostEditorAwareness } from './awareness/post-editor-awareness';
import {
	applyPostChangesToCRDTDoc,
	defaultCollectionSyncConfig,
	getPostChangesFromCRDTDoc,
	POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE,
	taxonomySyncConfig,
} from './utils/crdt';
import type { Post } from './entity-types/post';
import type {
	EntityConfig,
	EntityConfigLoader,
	RestTypeDescription,
	TransientEditConfig,
} from './types';

export const DEFAULT_ENTITY_KEY = 'id';
const POST_RAW_ATTRIBUTES = [ 'title', 'excerpt', 'content' ];

const blocksTransientEdits: Record< string, TransientEditConfig > = {
	blocks: {
		read: ( record ) =>
			// Post content is fetched in the edit context, with its `raw` value.
			parse(
				( record.content as { raw?: string } | undefined )?.raw ?? ''
			),
		write: ( record ) => ( {
			// The blocks are the record's parsed content.
			content: __unstableSerializeAndClean(
				record.blocks as Array< Block >
			),
		} ),
	},
};

export const rootEntitiesConfig: Array< EntityConfig > = [
	{
		label: __( 'Base' ),
		kind: 'root',
		key: false,
		name: '__unstableBase',
		baseURL: '/',
		baseURLParams: {
			// Please also change the preload path when changing this.
			// @see lib/compat/wordpress-7.2/preload.php
			_fields: [
				'description',
				'generate_animated_image_subsizes',
				'gmt_offset',
				'home',
				'image_max_bit_depth',
				'image_sizes',
				'image_size_threshold',
				'image_strip_meta',
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
		...( globalThis.window?.__experimentalEnableRealTimeCollaboration
			? { syncConfig: defaultCollectionSyncConfig }
			: {} ),
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

export const additionalEntityConfigLoaders: Array< EntityConfigLoader > = [
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
 * @param persistedRecord Already persisted Post
 * @param edits           Edits.
 * @param name            Post type name.
 * @param isTemplate      Whether the post type is a template.
 * @return Updated edits.
 */
export const prePersistPostType = async (
	persistedRecord: Record< string, unknown > | undefined,
	edits: Record< string, unknown >,
	name: string,
	isTemplate: boolean
): Promise< Record< string, unknown > > => {
	const newEdits: Record< string, unknown > = {};

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

	return newEdits;
};

/**
 * Returns the list of post type entities.
 *
 * @return Entities promise
 */
async function loadPostTypeEntities(): Promise< Array< EntityConfig > > {
	const postTypesPromise = apiFetch< Record< string, RestTypeDescription > >(
		{
			path: '/wp/v2/types?context=view',
		}
	);
	const taxonomiesPromise = window.__experimentalEnableRealTimeCollaboration
		? apiFetch< Record< string, RestTypeDescription > >( {
				path: '/wp/v2/taxonomies?context=view',
			} )
		: Promise.resolve< Record< string, RestTypeDescription > >( {} );
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

		const entity: EntityConfig = {
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
				// A fetched title is an object, an edited one a string.
				( record?.title as { rendered?: string } | undefined )
					?.rendered ||
				( record?.title as string | undefined ) ||
				( isTemplate
					? capitalCase( record.slug ?? '' )
					: String( record.id ) ),
			__unstablePrePersist: ( persistedRecord, edits ) =>
				prePersistPostType( persistedRecord, edits, name, isTemplate ),
			__unstable_rest_base: postType.rest_base,
			// The templates controller returns the whole collection and never
			// paginates.
			supportsPagination: ! isTemplate,
			getRevisionsUrl: ( parentId, revisionId ) =>
				`/${ namespace }/${
					postType.rest_base
				}/${ parentId }/revisions${
					revisionId ? '/' + revisionId : ''
				}`,
			revisionKey: isTemplate ? 'wp_id' : DEFAULT_ENTITY_KEY,
		};

		if ( ! window.__experimentalEnableRealTimeCollaboration ) {
			return entity;
		}

		entity.syncConfig = {
			// Save a CRDT document with this entity
			supportsPersistence: true,

			/**
			 * Apply changes from the local editor to the local CRDT document so
			 * that those changes can be synced to other peers (via the provider).
			 *
			 * @param crdtDoc
			 * @param changes
			 */
			applyChangesToCRDTDoc: ( crdtDoc, changes ) =>
				applyPostChangesToCRDTDoc( crdtDoc, changes, syncedProperties ),

			/**
			 * Create the awareness instance for the entity's CRDT document.
			 *
			 * @param ydoc
			 * @param objectId
			 * @return Awareness instance
			 */
			createAwareness: ( ydoc, objectId ) => {
				const kind = 'postType';
				// Awareness is created for a saved post, which has an ID.
				const id = parseInt( objectId as string, 10 );
				return new PostEditorAwareness( ydoc, kind, name, id );
			},

			/**
			 * Extract changes from a CRDT document that can be used to update the
			 * local editor state.
			 *
			 * @param crdtDoc
			 * @param editedRecord
			 * @return Changes to record
			 */
			getChangesFromCRDTDoc: ( crdtDoc, editedRecord ) =>
				getPostChangesFromCRDTDoc(
					crdtDoc,
					// The records of post type entities are posts.
					editedRecord as Post,
					syncedProperties
				),

			/**
			 * Extract changes from a CRDT document that can be used to update the
			 * local editor state.
			 *
			 * @param record
			 * @return Changes to record
			 */
			getPersistedCRDTDoc: ( record ) => {
				return (
					// Post meta holds the persisted document as a string.
					( record?.meta as Record< string, string > | undefined )?.[
						POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE
					] || null
				);
			},
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
 * @return Entities promise
 */
async function loadTaxonomyEntities(): Promise< Array< EntityConfig > > {
	const taxonomies = await apiFetch< Record< string, RestTypeDescription > >(
		{
			path: '/wp/v2/taxonomies?context=view',
		}
	);
	return Object.entries( taxonomies ?? {} ).map( ( [ name, taxonomy ] ) => {
		const namespace = taxonomy?.rest_namespace ?? 'wp/v2';
		const entity: EntityConfig = {
			kind: 'taxonomy',
			baseURL: `/${ namespace }/${ taxonomy.rest_base }`,
			baseURLParams: { context: 'edit' },
			name,
			label: taxonomy.name,
			getTitle: ( record ) => record?.name,
			supportsPagination: true,
		};

		if ( window.__experimentalEnableRealTimeCollaboration ) {
			entity.syncConfig = taxonomySyncConfig;
		}

		return entity;
	} );
}

/**
 * Returns the Site entity.
 *
 * @return Entity promise
 */
async function loadSiteEntity(): Promise< Array< EntityConfig > > {
	const entity: EntityConfig = {
		label: __( 'Site' ),
		name: 'site',
		kind: 'root',
		key: false,
		baseURL: '/wp/v2/settings',
		supportsPagination: false,
		meta: {},
	};

	const site = await apiFetch< {
		schema?: { properties?: Record< string, { title?: string } > };
	} >( {
		path: entity.baseURL,
		method: 'OPTIONS',
	} );

	const labels: Record< string, string > = {};
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
 * @param kind   Entity kind.
 * @param name   Entity name or plural name.
 * @param prefix Function prefix.
 *
 * @return Method name
 */
export const getMethodName = (
	kind: string,
	name: string,
	prefix = 'get'
): string => {
	const kindPrefix = kind === 'root' ? '' : pascalCase( kind );
	const suffix = pascalCase( name );
	return `${ prefix }${ kindPrefix }${ suffix }`;
};
