/**
 * Sets the value at path of object.
 * If a portion of path doesn’t exist, it’s created.
 * Arrays are created for missing index properties while objects are created
 * for all other missing properties.
 *
 * Path is specified as either:
 * - a string of properties, separated by dots, for example: "x.y".
 * - an array of properties, for example `[ 'x', 'y' ]`.
 *
 * This function intentionally mutates the input object.
 *
 * Inspired by _.set().
 *
 * @see https://lodash.com/docs/4.17.15#set
 *
 * @todo Needs to be deduplicated with its copy in `@wordpress/edit-site`.
 *
 * @param {Object}       object Object to modify
 * @param {Array|string} path   Path of the property to set.
 * @param {*}            value  Value to set.
 */
export default function setNestedValue< T >(
	object: T,
	path: ( string | number )[] | string,
	value: unknown
): T {
	if ( ! object || typeof object !== 'object' ) {
		return object;
	}

	const normalizedPath = Array.isArray( path ) ? path : path.split( '.' );

	normalizedPath.reduce< Record< string | number, unknown > >(
		( acc, key, idx ) => {
			if ( acc[ key ] === undefined ) {
				if ( Number.isInteger( normalizedPath[ idx + 1 ] ) ) {
					acc[ key ] = [];
				} else {
					acc[ key ] = {};
				}
			}
			if ( idx === normalizedPath.length - 1 ) {
				acc[ key ] = value;
			}
			// The path runs through objects and arrays, as the caller describes it.
			return acc[ key ] as Record< string | number, unknown >;
		},
		// Checked above to be an object.
		object as Record< string | number, unknown >
	);

	return object;
}
