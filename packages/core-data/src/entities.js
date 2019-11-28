/**
 * External dependencies
 */
import { upperFirst, camelCase, map, find } from 'lodash';

/**
 * Internal dependencies
 */
import { addEntities } from './actions';
import { apiFetch, select } from './controls';

export const DEFAULT_ENTITY_KEY = 'id';

export const defaultEntities = [
	{ name: 'site', kind: 'root', baseURL: '/wp/v2/settings' },
	{ name: 'postType', kind: 'root', key: 'slug', baseURL: '/wp/v2/types' },
	{ name: 'media', kind: 'root', baseURL: '/wp/v2/media', plural: 'mediaItems' },
	{ name: 'taxonomy', kind: 'root', key: 'slug', baseURL: '/wp/v2/taxonomies', plural: 'taxonomies' },
	{ name: 'widgetArea', kind: 'root', baseURL: '/__experimental/widget-areas', plural: 'widgetAreas', transientEdits: { blocks: true } },
];

export const kinds = [
	{ name: 'postType', loadEntities: loadPostTypeEntities },
	{ name: 'taxonomy', loadEntities: loadTaxonomyEntities },
];

/**
 * Returns the list of post type entities.
 *
 * @return {Promise} Entities promise
 */
function* loadPostTypeEntities() {
	const postTypes = yield apiFetch( { path: '/wp/v2/types?context=edit' } );
	return map( postTypes, ( postType, name ) => {
		return {
			kind: 'postType',
			baseURL: '/wp/v2/' + postType.rest_base,
			name,
			transientEdits: {
				blocks: true,
				selectionStart: true,
				selectionEnd: true,
			},
			mergedEdits: { meta: true },
		};
	} );
}

/**
 * Returns the list of the taxonomies entities.
 *
 * @return {Promise} Entities promise
 */
function* loadTaxonomyEntities() {
	const taxonomies = yield apiFetch( { path: '/wp/v2/taxonomies?context=edit' } );
	return map( taxonomies, ( taxonomy, name ) => {
		return {
			kind: 'taxonomy',
			baseURL: '/wp/v2/' + taxonomy.rest_base,
			name,
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
export const getMethodName = ( kind, name, prefix = 'get', usePlural = false ) => {
	const entity = find( defaultEntities, { kind, name } );
	const kindPrefix = kind === 'root' ? '' : upperFirst( camelCase( kind ) );
	const nameSuffix = upperFirst( camelCase( name ) ) + ( usePlural ? 's' : '' );
	const suffix = usePlural && entity.plural ? upperFirst( camelCase( entity.plural ) ) : nameSuffix;
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
	let entities = yield select( 'getEntitiesByKind', kind );
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
