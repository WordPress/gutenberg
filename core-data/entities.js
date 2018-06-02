/**
 * External dependencies
 */
import { find, upperFirst, camelCase } from 'lodash';

const entities = [
	{ name: 'postType', kind: 'root', key: 'slug', baseUrl: '/wp/v2/types' },
	{ name: 'media', kind: 'root', baseUrl: '/wp/v2/media', plural: 'mediaItems' },
	{ name: 'taxonomy', kind: 'root', key: 'slug', baseUrl: '/wp/v2/taxonomies', plural: 'taxonomies' },
];

/**
 * Returns the entity object given its kind and name.
 *
 * @param {string} kind  Entity kind.
 * @param {string} name  Entity name.
 *
 * @return {Object} Entity
 */
export function getEntity( kind, name ) {
	return find( entities, { kind, name } );
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
	const entity = getEntity( kind, name );
	const kindPrefix = kind === 'root' ? '' : upperFirst( camelCase( kind ) );
	const nameSuffix = upperFirst( camelCase( name ) ) + ( usePlural ? 's' : '' );
	const suffix = usePlural && entity.plural ? upperFirst( camelCase( entity.plural ) ) : nameSuffix;
	return `${ prefix }${ kindPrefix }${ suffix }`;
};

export default entities;
