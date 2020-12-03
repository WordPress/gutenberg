/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';

/**
 * Provides a unique instance ID.
 *
 * @param {unknown} object Object reference to create an id for.
 * @param {string} prefix Prefix for the unique id.
 * @param {string} preferredId Default ID to use.
 *
 * @return {string | number} The unique id.
 */
export function useUniqueId( object, prefix, preferredId = '' ) {
	const instanceId = useInstanceId( object, prefix );

	return preferredId || instanceId;
}
