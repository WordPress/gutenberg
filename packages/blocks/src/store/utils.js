/**
 * Helper util to return a value from a certain path of the object.
 * Path is specified as either:
 * - a string of properties, separated by dots, for example: "x.y".
 * - an array of properties, for example `[ 'x', 'y' ]`.
 * You can also specify a default value in case the result is nullish.
 *
 * @param {Object}       object       Input object.
 * @param {string|Array} path         Path to the object property.
 * @param {*}            defaultValue Default value if the value at the specified path is nullish.
 * @return {*} Value of the object property at the specified path.
 */
export function getValueFromObjectPath( object, path, defaultValue ) {
	if ( ! Array.isArray( path ) ) {
		if ( path.indexOf( '.' ) === -1 ) {
			return object[ path ] ?? defaultValue;
		}

		path = path.split( '.' );
	}

	let value = object;

	for ( const key of path ) {
		value = value?.[ key ];
	}

	return value ?? defaultValue;
}
