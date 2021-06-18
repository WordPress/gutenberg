// Disable reason: Object and object are distinctly different types in TypeScript and we mean the lowercase object in thise case
// but eslint wants to force us to use `Object`. See https://stackoverflow.com/questions/49464634/difference-between-object-and-object-in-typescript
/* eslint-disable jsdoc/check-types */
/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * @type {WeakMap<object, number>}
 */
const instanceMap = new WeakMap();

/**
 * Creates a new id for a given object.
 *
 * @param {object} object Object reference to create an id for.
 * @return {number} The instance id (index).
 */
function createId( object ) {
	const instances = instanceMap.get( object ) || 0;
	instanceMap.set( object, instances + 1 );
	return instances;
}

/**
 * Provides a unique instance ID.
 *
 * @param {object}          object           Object reference to create an id for.
 * @param {string}          [prefix]         Prefix for the unique id.
 * @param {string | number} [preferredId=''] Default ID to use.
 * @return {string | number} The unique instance id.
 */
export default function useInstanceId( object, prefix, preferredId = '' ) {
	return useMemo( () => {
		if ( preferredId ) return preferredId;
		const id = createId( object );

		return prefix ? `${ prefix }-${ id }` : id;
	}, [ object ] );
}
/* eslint-enable jsdoc/check-types */
