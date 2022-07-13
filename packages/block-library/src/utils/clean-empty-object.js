/**
 * External dependencies
 */
import { isEmpty, mapValues, pickBy } from 'lodash';

const identity = ( x ) => x;

/**
 * Removed empty nodes from nested objects.
 *
 * @param {Object} object
 * @return {Object} Object cleaned from empty nodes.
 */
const cleanEmptyObject = ( object ) => {
	if (
		object === null ||
		typeof object !== 'object' ||
		Array.isArray( object )
	) {
		return object;
	}
	const cleanedNestedObjects = pickBy(
		mapValues( object, cleanEmptyObject ),
		identity
	);
	return isEmpty( cleanedNestedObjects ) ? undefined : cleanedNestedObjects;
};

export default cleanEmptyObject;
