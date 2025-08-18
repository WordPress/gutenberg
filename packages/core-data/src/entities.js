/**
 * External dependencies
 */
import { capitalCase, pascalCase } from 'change-case';
import { v4 as uuidv4 } from 'uuid';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { RichTextData } from '@wordpress/rich-text';
import { parse } from '@wordpress/blocks';
import { Y } from '@wordpress/sync';
import * as math from 'lib0/math';
import * as fun from 'lib0/function';

/**
 * Internal dependencies
 */

export const DEFAULT_ENTITY_KEY = 'id';
const POST_RAW_ATTRIBUTES = [ 'title', 'excerpt', 'content' ];

/**
 * @param {Y.Doc} ydoc
 * @return {import('@wordpress/sync').ObjectData} The JSON representation of the document.
 */
const defaultFromCRDTDoc = ( ydoc ) => {
	const json = ydoc.getMap( 'document' ).toJSON();
	if ( json.title?.raw ) {
		json.title = json.title.raw;
	}
	return json;
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
		delete rest.validationIssues;
		delete rest.originalContent;
		// delete rest.isValid
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
	const syncedProperties = new Set( [
		'blocks',
		'featured_media',
		'format',
		'generated_slug',
		'password',
		'slug',
		'sticky',
		'tags',
		'template',
	] );

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
				/**
				 * @param {Y.Doc} ydoc
				 * @param {any}   allChanges
				 */
				applyChangesToCRDTDoc: ( ydoc, allChanges ) => {
					// local changes happened. Apply the differences to the ydoc
					const ycontent = ydoc.getMap( 'document' );
					const changes = Object.fromEntries(
						Object.entries( allChanges ).filter( ( [ key ] ) =>
							syncedProperties.has( key )
						)
					);

					Object.entries( changes ).forEach( ( [ key, value ] ) => {
						if ( typeof value !== 'function' ) {
							if ( key === 'blocks' ) {
								if ( ! serialisableBlocksCache.has( value ) ) {
									serialisableBlocksCache.set(
										value,
										makeBlocksSerializable( value )
									);
								}
								const blocks =
									serialisableBlocksCache.get( value );
								// This is a rudimentary diff implementation similar to the y-prosemirror diffing
								// approach.
								// A better implementation would also diff the textual content and represent it
								// using a Y.Text type.
								// However, at this time it makes more sense to keep this algorithm generic to
								// support all kinds of block types.
								// Ideally, we ensure that block data structure have a consistent data format.
								// E.g.:
								//   - textual content (using rich-text formatting?) may always be stored under `block.text`
								//   - local information that shouldn't be shared (e.g. clientId or isDragging) is stored under `block.private`
								if (
									! ycontent.has( key ) ||
									ycontent.get( key ) instanceof Array
								) {
									// @todo remove the array check
									ycontent.set( key, new Y.Array() );
								}
								/**
								 * @type {Y.Array<Y.Map<any>>}
								 */
								const yblocks = ycontent.get( key );
								const numOfCommonEntries = math.min(
									blocks.length,
									yblocks.length
								);
								let left = 0;
								let right = 0;
								/**
								 * @param {any}   gblock
								 * @param {Y.Map} yblock
								 */
								const blocksEqual = ( gblock, yblock ) => {
									if ( yblock.toJSON ) {
										yblock = yblock.toJSON();
									}
									// we must not sync clientId, as this can't be generated consistenctly and
									// hence will lead to merge conflicts.
									const overwrites = {
										innerBlocks: null,
										clientId: null,
									};
									const res = fun.equalityDeep(
										Object.assign( {}, gblock, overwrites ),
										Object.assign( {}, yblock, overwrites )
									);
									const inners = gblock.innerBlocks || [];
									const yinners = yblock.innerBlocks || [];
									return (
										res &&
										inners.length === yinners.length &&
										inners.every( ( block, i ) =>
											blocksEqual( block, yinners[ i ] )
										)
									);
								};
								// skip equal blocks from left
								for (
									;
									left < numOfCommonEntries &&
									blocksEqual(
										blocks[ left ],
										yblocks.get( left )
									);
									left++
								) {
									/* nop */
								}
								// skip equal blocks from right
								for (
									;
									right < numOfCommonEntries - left &&
									blocksEqual(
										blocks[ blocks.length - right - 1 ],
										yblocks.get(
											yblocks.length - right - 1
										)
									);
									right++
								) {
									/* nop */
								}
								const numOfUpdatesNeeded =
									numOfCommonEntries - left - right;
								const numOfInsertionsNeeded = math.max(
									0,
									blocks.length - yblocks.length
								);
								const numOfDeletionsNeeded = math.max(
									0,
									yblocks.length - blocks.length
								);
								// updates
								for (
									let i = 0;
									i < numOfUpdatesNeeded;
									i++, left++
								) {
									const block = blocks[ left ];
									const yblock = yblocks.get( left );
									Object.entries( block ).forEach(
										( [ k, v ] ) => {
											if (
												! fun.equalityDeep(
													block[ k ],
													yblock.get( k )
												)
											) {
												yblock.set( k, v );
											}
										}
									);
									yblock.forEach( ( _v, k ) => {
										if ( ! block.hasOwnProperty( k ) ) {
											yblock.delete( k );
										}
									} );
								}
								// deletes
								yblocks.delete( left, numOfDeletionsNeeded );
								// inserts
								for (
									let i = 0;
									i < numOfInsertionsNeeded;
									i++, left++
								) {
									yblocks.insert( left, [
										new Y.Map(
											Object.entries( blocks[ left ] )
										),
									] );
								}
								const knownClientIds = new Set();
								// remove duplicate clientids
								for ( let j = 0; j < yblocks.length; j++ ) {
									const yblock = yblocks.get( j );
									if (
										knownClientIds.has(
											yblock.get( 'clientId' )
										)
									) {
										yblock.set( 'clientId', uuidv4() );
									}
									knownClientIds.add(
										yblock.get( 'clientId' )
									);
								}
							} else if (
								! fun.equalityDeep( ycontent.get( key ), value )
							) {
								ycontent.set( key, value );
							}
						}
					} );
				},
				fromCRDTDoc: defaultFromCRDTDoc,
				/**
				 * This initial object data represents the data that will be synced via
				 * the CRDT document, which may differ from the entity record. There may
				 * be properties that should not be synced, or properties that are
				 * derived from the record.
				 *
				 * @param {import('@wordpress/sync').ObjectData} record
				 * @return {import('@wordpress/sync').ObjectData} The initial data
				 */
				getInitialObjectData: ( record ) => {
					// Mix in the parsed blocks into the record. Only allow properties in
					// the synced properties set.
					const content = record.content?.raw ?? record.content ?? '';
					const blocks = parse( content );

					return Object.fromEntries(
						Object.entries( { ...record, blocks } ).filter(
							( [ key ] ) => syncedProperties.has( key )
						)
					);
				},
				getObjectId: ( { id } ) => id,
				objectType: 'postType/' + postType.name,
				supportsAwareness: true,
				supportsUndo: true,
			},
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
