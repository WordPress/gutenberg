/**
 * Converts a path to an array of its fragments.
 * Supports strings, numbers and arrays:
 *
 * 'foo' => [ 'foo' ]
 * 2 => [ '2' ]
 * [ 'foo', 'bar' ] => [ 'foo', 'bar' ]
 *
 * @param {string|number|Array} path Path
 * @return {Array} Normalized path.
 */
function normalizePath( path ) {
	if ( Array.isArray( path ) ) {
		return path;
	} else if ( typeof path === 'number' ) {
		return [ path.toString() ];
	}

	return [ path ];
}

/**
 * Clones an object.
 * Non-object values are returned unchanged.
 *
 * @param {*} object Object to clone.
 * @return {*} Cloned object, or original literal non-object value.
 */
function cloneObject( object ) {
	if ( object && typeof object === 'object' ) {
		return {
			...Object.fromEntries(
				Object.entries( object ).map( ( [ key, value ] ) => [
					key,
					cloneObject( value ),
				] )
			),
		};
	}

	return object;
}

/**
 * Perform an immutable set.
 * Handles nullish initial values.
 * Clones all nested objects in the specified object.
 *
 * @param {Object}              object Object to set a value in.
 * @param {number|string|Array} path   Path in the object to modify.
 * @param {*}                   value  New value to set.
 * @return {Object} Cloned object with the new value set.
 */
export function immutableSet( object, path, value ) {
	const normalizedPath = normalizePath( path );
	const newObject = object ? cloneObject( object ) : {};

	normalizedPath.reduce( ( acc, key, i ) => {
		if ( acc[ key ] === undefined ) {
			acc[ key ] = {};
		}
		if ( i === normalizedPath.length - 1 ) {
			acc[ key ] = value;
		}
		return acc[ key ];
	}, newObject );

	return newObject;
}
