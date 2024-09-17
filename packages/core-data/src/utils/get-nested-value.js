/**
 * Helper util to return a value from a certain path of the object.
 * Path is specified as either:
 * - a string of properties, separated by dots, for example: "x.y".
 * - an array of properties, for example `[ 'x', 'y' ]`.
 * You can also specify a default value in case the result is nullish.
 *
 * @param {Object}       object       Input object.
 * @param {string|Array} path         Path to the object property.
 * @param {*}            defaultValue Default value if the value at the specified path is undefined.
 * @return {*} Value of the object property at the specified path.
 */
export default function getNestedValue( object, path, defaultValue ) {
	if (
		! object ||
		typeof object !== 'object' ||
		( typeof path !== 'string' && ! Array.isArray( path ) )
	) {
		return object;
	}
	const normalizedPath = Array.isArray( path ) ? path : path.split( '.' );
	let value = object;
	normalizedPath.forEach( ( fieldName ) => {
		value = value?.[ fieldName ];
	} );
	return value !== undefined ? value : defaultValue;
}
