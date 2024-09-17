/**
 * External dependencies
 */
import { capitalCase, pascalCase } from 'change-case';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { RichTextData } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { addEntities } from './actions';
import { getSyncProvider } from './sync';

export const DEFAULT_ENTITY_KEY = 'id';

const POST_RAW_ATTRIBUTES = [ 'title', 'excerpt', 'content' ];

export const rootEntitiesConfig = [
	{
		label: __( 'Base' ),
		kind: 'root',
		name: '__unstableBase',
		baseURL: '/',
		baseURLParams: {
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
			].join( ',' ),
		},
		// The entity doesn't support selecting multiple records.
		// The property is maintained for backward compatibility.
		plural: '__unstableBases',
		syncConfig: {
			fetch: async () => {
				return apiFetch( { path: '/' } );
			},
			applyChangesToDoc: ( doc, changes ) => {
				const document = doc.getMap( 'document' );
				Object.entries( changes ).forEach( ( [ key, value ] ) => {
					if ( document.get( key ) !== value ) {
						document.set( key, value );
					}
				} );
			},
			fromCRDTDoc: ( doc ) => {
				return doc.getMap( 'document' ).toJSON();
			},
		},
		syncObjectType: 'root/base',
		getSyncObjectId: () => 'index',
	},
	{
		label: __( 'Post Type' ),
		name: 'postType',
		kind: 'root',
		key: 'slug',
		baseURL: '/wp/v2/types',
		baseURLParams: { context: 'edit' },
		plural: 'postTypes',
		syncConfig: {
			fetch: async ( id ) => {
				return apiFetch( {
					path: `/wp/v2/types/${ id }?context=edit`,
				} );
			},
			applyChangesToDoc: ( doc, changes ) => {
				const document = doc.getMap( 'document' );
				Object.entries( changes ).forEach( ( [ key, value ] ) => {
					if ( document.get( key ) !== value ) {
						document.set( key, value );
					}
				} );
			},
			fromCRDTDoc: ( doc ) => {
				return doc.getMap( 'document' ).toJSON();
			},
		},
		syncObjectType: 'root/postType',
		getSyncObjectId: ( id ) => id,
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
		baseURLParams: { context: 'edit' },
		plural: 'users',
	},
	{
		name: 'comment',
		kind: 'root',
		baseURL: '/wp/v2/comments',
		baseURLParams: { context: 'edit' },
		plural: 'comments',
		label: __( 'Comment' ),
	},
	{
		name: 'menu',
		kind: 'root',
		baseURL: '/wp/v2/menus',
		baseURLParams: { context: 'edit' },
		plural: 'menus',
		label: __( 'Menu' ),
	},
	{
		name: 'menuItem',
		kind: 'root',
		baseURL: '/wp/v2/menu-items',
		baseURLParams: { context: 'edit' },
		plural: 'menuItems',
		label: __( 'Menu Item' ),
		rawAttributes: [ 'title' ],
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
		getTitle: ( record ) => record?.title?.rendered || record?.title,
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

const serialisableBlocksCache = new WeakMap();

function makeBlockAttributesSerializable( attributes ) {
	const newAttributes = { ...attributes };
	for ( const [ key, value ] of Object.entries( attributes ) ) {
		if ( value instanceof RichTextData ) {
			newAttributes[ key ] = value.valueOf();
		}
	}
	return newAttributes;
}

function makeBlocksSerializable( blocks ) {
	return blocks.map( ( block ) => {
		const { innerBlocks, attributes, ...rest } = block;
		return {
			...rest,
			attributes: makeBlockAttributesSerializable( attributes ),
			innerBlocks: makeBlocksSerializable( innerBlocks ),
		};
	} );
}

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
		return {
			kind: 'postType',
			baseURL: `/${ namespace }/${ postType.rest_base }`,
			baseURLParams: { context: 'edit' },
			name,
			label: postType.name,
			meta: postType.meta,
			transientEdits: {
				blocks: true,
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
			syncConfig: {
				fetch: async ( id ) => {
					return apiFetch( {
						path: `/${ namespace }/${ postType.rest_base }/${ id }?context=edit`,
					} );
				},
				applyChangesToDoc: ( doc, changes ) => {
					const document = doc.getMap( 'document' );

					Object.entries( changes ).forEach( ( [ key, value ] ) => {
						if ( typeof value !== 'function' ) {
							if ( key === 'blocks' ) {
								if ( ! serialisableBlocksCache.has( value ) ) {
									serialisableBlocksCache.set(
										value,
										makeBlocksSerializable( value )
									);
								}

								value = serialisableBlocksCache.get( value );
							}

							if ( document.get( key ) !== value ) {
								document.set( key, value );
							}
						}
					} );
				},
				fromCRDTDoc: ( doc ) => {
					return doc.getMap( 'document' ).toJSON();
				},
			},
			syncObjectType: 'postType/' + postType.name,
			getSyncObjectId: ( id ) => id,
			supportsPagination: true,
			getRevisionsUrl: ( parentId, revisionId ) =>
				`/${ namespace }/${
					postType.rest_base
				}/${ parentId }/revisions${
					revisionId ? '/' + revisionId : ''
				}`,
			revisionKey: isTemplate ? 'wp_id' : DEFAULT_ENTITY_KEY,
		};
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
		syncConfig: {
			fetch: async () => {
				return apiFetch( { path: '/wp/v2/settings' } );
			},
			applyChangesToDoc: ( doc, changes ) => {
				const document = doc.getMap( 'document' );
				Object.entries( changes ).forEach( ( [ key, value ] ) => {
					if ( document.get( key ) !== value ) {
						document.set( key, value );
					}
				} );
			},
			fromCRDTDoc: ( doc ) => {
				return doc.getMap( 'document' ).toJSON();
			},
		},
		syncObjectType: 'root/site',
		getSyncObjectId: () => 'index',
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

function registerSyncConfigs( configs ) {
	configs.forEach( ( { syncObjectType, syncConfig } ) => {
		getSyncProvider().register( syncObjectType, syncConfig );
		const editSyncConfig = { ...syncConfig };
		delete editSyncConfig.fetch;
		getSyncProvider().register( syncObjectType + '--edit', editSyncConfig );
	} );
}

/**
 * Loads the entities into the store.
 *
 * Note: The `name` argument is used for `root` entities requiring additional server data.
 *
 * @param {string} kind Kind
 * @param {string} name Name
 * @return {(thunkArgs: object) => Promise<Array>} Entities
 */
export const getOrLoadEntitiesConfig =
	( kind, name ) =>
	async ( { select, dispatch } ) => {
		let configs = select.getEntitiesConfig( kind );
		const hasConfig = !! select.getEntityConfig( kind, name );

		if ( configs?.length > 0 && hasConfig ) {
			if ( window.__experimentalEnableSync ) {
				if ( globalThis.IS_GUTENBERG_PLUGIN ) {
					registerSyncConfigs( configs );
				}
			}

			return configs;
		}

		const loader = additionalEntityConfigLoaders.find( ( l ) => {
			if ( ! name || ! l.name ) {
				return l.kind === kind;
			}

			return l.kind === kind && l.name === name;
		} );
		if ( ! loader ) {
			return [];
		}

		configs = await loader.loadEntities();
		if ( window.__experimentalEnableSync ) {
			if ( globalThis.IS_GUTENBERG_PLUGIN ) {
				registerSyncConfigs( configs );
			}
		}

		dispatch( addEntities( configs ) );

		return configs;
	};
