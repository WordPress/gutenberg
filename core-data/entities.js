/**
 * External dependencies
 */
import { find, upperFirst, camelCase } from 'lodash';

const entities = [
	{ name: 'postType', kind: 'root', key: 'slug', baseUrl: '/wp/v2/types' },
	{ name: 'media', kind: 'root', baseUrl: '/wp/v2/media' },
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
	return find( entities, ( entity ) => entity.kind === kind && entity.name === name );
}

/**
 * Returns the entity's getter method name given its kind and name.
 *
 * @param {string} kind  Entity kind.
 * @param {string} name  Entity name.
 *
 * @return {string} Method name
 */
export const getMethodName = ( kind, name ) => {
	const kindPrefix = kind === 'root' ? '' : upperFirst( camelCase( kind ) );
	const nameSuffix = upperFirst( camelCase( name ) );
	return `get${ kindPrefix }${ nameSuffix }`;
};

export default entities;
