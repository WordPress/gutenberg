// Disable reason: Object and object are distinctly different types in TypeScript and we mean the lowercase object in thise case
// but eslint wants to force us to use `Object`. See https://stackoverflow.com/questions/49464634/difference-between-object-and-object-in-typescript
/* eslint-disable jsdoc/check-types */
/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

const instanceMap = new WeakMap< object, number >();

/**
 * Creates a new id for a given object.
 *
 * @param {object} object Object reference to create an id for.
 * @return {number} The instance id (index).
 */
function createId( object: object ): number {
	const instances = instanceMap.get( object ) || 0;
	instanceMap.set( object, instances + 1 );
	return instances;
}

/**
 * Specify the useInstanceId *function* signatures.
 *
 * More accurately, useInstanceId distinguishes between three different
 * signatures:
 *
 * 1. When only object is given, the returned value is a number
 * 2. When object and prefix is given, the returned value is a string
 * 3. When preferredId is given, the returned value is the type of preferredId
 */
function useInstanceId( object: object ): number;
function useInstanceId( object: object, prefix: string ): string;
function useInstanceId< T extends string | number >(
	object: object,
	prefix: string,
	preferredId?: T
): T;

/**
 * Provides a unique instance ID.
 *
 * @param {object}          object        Object reference to create an id for.
 * @param {string}          [prefix]      Prefix for the unique id.
 * @param {string | number} [preferredId] Default ID to use.
 * @return {string | number} The unique instance id.
 */
function useInstanceId(
	object: object,
	prefix?: string,
	preferredId?: string | number
): string | number {
	return useMemo( () => {
		if ( preferredId ) return preferredId;
		const id = createId( object );

		return prefix ? `${ prefix }-${ id }` : id;
	}, [ object ] );
}

export default useInstanceId;
/* eslint-enable jsdoc/check-types */
