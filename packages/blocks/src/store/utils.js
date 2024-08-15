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
export const getValueFromObjectPath = ( object, path, defaultValue ) => {
	const normalizedPath = Array.isArray( path ) ? path : path.split( '.' );
	let value = object;
	normalizedPath.forEach( ( fieldName ) => {
		value = value?.[ fieldName ];
	} );
	return value ?? defaultValue;
};

function isObject( candidate ) {
	return (
		typeof candidate === 'object' &&
		candidate.constructor === Object &&
		candidate !== null
	);
}

/**
 * Determine whether a set of object properties matches a given object.
 *
 * Given an object of block attributes and an object of variation attributes,
 * this function checks recursively whether all the variation attributes are
 * present in the block attributes object.
 *
 * @param {Object} blockAttributes     The object to inspect.
 * @param {Object} variationAttributes The object of property values to match.
 * @return {boolean} Whether the block attributes match the variation attributes.
 */
export function matchesAttributes( blockAttributes, variationAttributes ) {
	if ( isObject( blockAttributes ) && isObject( variationAttributes ) ) {
		return Object.entries( variationAttributes ).every(
			( [ key, value ] ) =>
				matchesAttributes( blockAttributes?.[ key ], value )
		);
	}

	return blockAttributes === variationAttributes;
}
