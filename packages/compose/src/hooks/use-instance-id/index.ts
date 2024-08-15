/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

const instanceMap = new WeakMap< object, number >();

/**
 * Creates a new id for a given object.
 *
 * @param object Object reference to create an id for.
 * @return The instance id (index).
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
 *
 * @param object Object reference to create an id for.
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
 * @param object        Object reference to create an id for.
 * @param [prefix]      Prefix for the unique id.
 * @param [preferredId] Default ID to use.
 * @return The unique instance id.
 */
function useInstanceId(
	object: object,
	prefix?: string,
	preferredId?: string | number
): string | number {
	return useMemo( () => {
		if ( preferredId ) {
			return preferredId;
		}
		const id = createId( object );

		return prefix ? `${ prefix }-${ id }` : id;
	}, [ object, preferredId, prefix ] );
}

export default useInstanceId;
