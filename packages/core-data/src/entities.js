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

/**
 * Internal dependencies
 */
import {
	applyPostChangesToCRDTDoc,
	defaultApplyChangesToCRDTDoc,
	defaultGetChangesFromCRDTDoc,
	getPostChangesFromCRDTDoc,
} from './utils/crdt';

export const DEFAULT_ENTITY_KEY = 'id';
const POST_RAW_ATTRIBUTES = [ 'title', 'excerpt', 'content' ];

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
		name: '__unstableBase',
		baseURL: '/',
		baseURLParams: {
			// Please also change the preload path when changing this.
			// @see lib/compat/wordpress-6.8/preload.php
			_fields: [
				'description',
				'gmt_offset',
				'home',
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
	},
	{
		label: __( 'Post Type' ),
		name: 'postType',
		kind: 'root',
		key: 'slug',
		baseURL: '/wp/v2/types',
		baseURLParams: { context: 'edit' },
		plural: 'postTypes',
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
	},
	{
		name: 'sidebar',
		kind: 'root',
		baseURL: '/wp/v2/sidebars',
		baseURLParams: { context: 'edit' },
		plural: 'sidebars',
		transientEdits: { blocks: true },
		label: __( 'Widget areas' ),
	},
	{
		name: 'widget',
		kind: 'root',
		baseURL: '/wp/v2/widgets',
		baseURLParams: { context: 'edit' },
		plural: 'widgets',
		transientEdits: { blocks: true },
		label: __( 'Widgets' ),
	},
	{
		name: 'widgetType',
		kind: 'root',
		baseURL: '/wp/v2/widget-types',
		baseURLParams: { context: 'edit' },
		plural: 'widgetTypes',
		label: __( 'Widget types' ),
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
	},
	{
		label: __( 'Plugins' ),
		name: 'plugin',
		kind: 'root',
		baseURL: '/wp/v2/plugins',
		baseURLParams: { context: 'edit' },
		plural: 'plugins',
		key: 'plugin',
	},
	{
		label: __( 'Status' ),
		name: 'status',
		kind: 'root',
		baseURL: '/wp/v2/statuses',
		baseURLParams: { context: 'edit' },
		plural: 'statuses',
		key: 'slug',
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
 * Returns a function to be used to retrieve extra edits to apply before persisting a post type.
 *
 * @param {Object} persistedRecord Already persisted Post
 * @param {Object} edits           Edits.
 * @return {Object} Updated edits.
 */
export const prePersistPostType = ( persistedRecord, edits ) => {
	const newEdits = {};

	if ( persistedRecord?.status === 'auto-draft' ) {
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
 * @return {Promise} Entities promise
 */
async function loadPostTypeEntities() {
	const postTypes = await apiFetch( {
		path: '/wp/v2/types?context=view',
	} );
	return Object.entries( postTypes ?? {} ).map( ( [ name, postType ] ) => {
		const isTemplate = [ 'wp_template', 'wp_template_part' ].includes(
			name
		);
		const namespace = postType?.rest_namespace ?? 'wp/v2';

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
			__unstablePrePersist: isTemplate ? undefined : prePersistPostType,
			__unstable_rest_base: postType.rest_base,
			supportsPagination: true,
			getRevisionsUrl: ( parentId, revisionId ) =>
				`/${ namespace }/${
					postType.rest_base
				}/${ parentId }/revisions${
					revisionId ? '/' + revisionId : ''
				}`,
			revisionKey: DEFAULT_ENTITY_KEY,
		};

		if ( window.__experimentalEnableSync ) {
			if ( globalThis.IS_GUTENBERG_PLUGIN ) {
				/**
				 * @type {import('@wordpress/sync').SyncConfig}
				 */
				entity.syncConfig = {
					/**
					 * Apply changes from the local editor to the local CRDT document so
					 * that those changes can be synced to other peers (via the provider).
					 *
					 * @param {import('@wordpress/sync').CRDTDoc}               crdtDoc
					 * @param {Partial< import('@wordpress/sync').ObjectData >} changes
					 * @return {void}
					 */
					applyChangesToCRDTDoc: ( crdtDoc, changes ) =>
						applyPostChangesToCRDTDoc( crdtDoc, changes, postType ),

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
							postType
						),

					/**
					 * Sync features supported by the entity.
					 *
					 * @type {Record< string, boolean >}
					 */
					supports: {},
				};
			}
		}

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
		return {
			kind: 'taxonomy',
			baseURL: `/${ namespace }/${ taxonomy.rest_base }`,
			baseURLParams: { context: 'edit' },
			name,
			label: taxonomy.name,
			getTitle: ( record ) => record?.name,
			supportsPagination: true,
		};
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
		baseURL: '/wp/v2/settings',
		meta: {},
	};

	if ( window.__experimentalEnableSync ) {
		if ( globalThis.IS_GUTENBERG_PLUGIN ) {
			/**
			 * @type {import('@wordpress/sync').SyncConfig}
			 */
			entity.syncConfig = {
				applyChangesToCRDTDoc: defaultApplyChangesToCRDTDoc,
				getChangesFromCRDTDoc: defaultGetChangesFromCRDTDoc,
			};
		}
	}

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
