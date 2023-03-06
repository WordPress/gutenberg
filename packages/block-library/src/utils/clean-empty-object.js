/**
 * External dependencies
 */
import { isEmpty, mapValues } from 'lodash';

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
	const cleanedNestedObjects = Object.fromEntries(
		Object.entries( mapValues( object, cleanEmptyObject ) ).filter(
			( [ , value ] ) => Boolean( value )
		)
	);
	return isEmpty( cleanedNestedObjects ) ? undefined : cleanedNestedObjects;
};

export default cleanEmptyObject;
