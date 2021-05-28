/**
 * External dependencies
 */
import { upperFirst, camelCase, map, find, get, startCase } from 'lodash';

/**
 * WordPress dependencies
 */
import { controls } from '@wordpress/data';
import { apiFetch } from '@wordpress/data-controls';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { addEntities } from './actions';
import { CORE_STORE_NAME as coreStoreName } from './utils/constants';

export const DEFAULT_ENTITY_KEY = 'id';

export const defaultEntities = [
	{
		label: __( 'Base' ),
		name: '__unstableBase',
		kind: 'root',
		baseURL: '',
	},
	{
		label: __( 'Site' ),
		name: 'site',
		kind: 'root',
		baseURL: '/wp/v2/settings',
		getTitle: ( record ) => {
			return get( record, [ 'title' ], __( 'Site Title' ) );
		},
	},
	{
		label: __( 'Post Type' ),
		name: 'postType',
		kind: 'root',
		key: 'slug',
		baseURL: '/wp/v2/types',
		baseURLParams: { context: 'edit' },
	},
	{
		name: 'media',
		kind: 'root',
		baseURL: '/wp/v2/media',
		baseURLParams: { context: 'edit' },
		plural: 'mediaItems',
		label: __( 'Media' ),
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
		baseURL: '/__experimental/menus',
		baseURLParams: { context: 'edit' },
		plural: 'menus',
		label: __( 'Menu' ),
	},
	{
		name: 'menuItem',
		kind: 'root',
		baseURL: '/__experimental/menu-items',
		baseURLParams: { context: 'edit' },
		plural: 'menuItems',
		label: __( 'Menu Item' ),
	},
	{
		name: 'menuLocation',
		kind: 'root',
		baseURL: '/__experimental/menu-locations',
		baseURLParams: { context: 'edit' },
		plural: 'menuLocations',
		label: __( 'Menu Location' ),
		key: 'name',
	},
];

export const kinds = [
	{ name: 'postType', loadEntities: loadPostTypeEntities },
	{ name: 'taxonomy', loadEntities: loadTaxonomyEntities },
];

/**
 * Returns a function to be used to retrieve extra edits to apply before persisting a post type.
 *
 * @param {Object} persistedRecord Already persisted Post
 * @param {Object} edits Edits.
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
function* loadPostTypeEntities() {
	const postTypes = yield apiFetch( { path: '/wp/v2/types?context=edit' } );
	return map( postTypes, ( postType, name ) => {
		const isTemplate = [ 'wp_template', 'wp_template_part' ].includes(
			name
		);
		return {
			kind: 'postType',
			baseURL: '/wp/v2/' + postType.rest_base,
			baseURLParams: { context: 'edit' },
			name,
			label: postType.labels.singular_name,
			transientEdits: {
				blocks: true,
				selection: true,
			},
			mergedEdits: { meta: true },
			getTitle: ( record ) =>
				record?.title?.rendered ||
				record?.title ||
				( isTemplate ? startCase( record.slug ) : String( record.id ) ),
			__unstablePrePersist: isTemplate ? undefined : prePersistPostType,
		};
	} );
}

/**
 * Returns the list of the taxonomies entities.
 *
 * @return {Promise} Entities promise
 */
function* loadTaxonomyEntities() {
	const taxonomies = yield apiFetch( {
		path: '/wp/v2/taxonomies?context=edit',
	} );
	return map( taxonomies, ( taxonomy, name ) => {
		return {
			kind: 'taxonomy',
			baseURL: '/wp/v2/' + taxonomy.rest_base,
			baseURLParams: { context: 'edit' },
			name,
			label: taxonomy.labels.singular_name,
		};
	} );
}

/**
 * Returns the entity's getter method name given its kind and name.
 *
 * @param {string}  kind      Entity kind.
 * @param {string}  name      Entity name.
 * @param {string}  prefix    Function prefix.
 * @param {boolean} usePlural Whether to use the plural form or not.
 *
 * @return {string} Method name
 */
export const getMethodName = (
	kind,
	name,
	prefix = 'get',
	usePlural = false
) => {
	const entity = find( defaultEntities, { kind, name } );
	const kindPrefix = kind === 'root' ? '' : upperFirst( camelCase( kind ) );
	const nameSuffix =
		upperFirst( camelCase( name ) ) + ( usePlural ? 's' : '' );
	const suffix =
		usePlural && entity.plural
			? upperFirst( camelCase( entity.plural ) )
			: nameSuffix;
	return `${ prefix }${ kindPrefix }${ suffix }`;
};

/**
 * Loads the kind entities into the store.
 *
 * @param {string} kind  Kind
 *
 * @return {Array} Entities
 */
export function* getKindEntities( kind ) {
	let entities = yield controls.select(
		coreStoreName,
		'getEntitiesByKind',
		kind
	);
	if ( entities && entities.length !== 0 ) {
		return entities;
	}

	const kindConfig = find( kinds, { name: kind } );
	if ( ! kindConfig ) {
		return [];
	}

	entities = yield kindConfig.loadEntities();
	yield addEntities( entities );

	return entities;
}
