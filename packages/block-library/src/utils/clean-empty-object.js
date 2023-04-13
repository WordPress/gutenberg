/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

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
		Object.entries( object )
			.map( ( [ key, value ] ) => [ key, cleanEmptyObject( value ) ] )
			.filter( ( [ , value ] ) => Boolean( value ) )
	);
	return isEmpty( cleanedNestedObjects ) ? undefined : cleanedNestedObjects;
};

export default cleanEmptyObject;
