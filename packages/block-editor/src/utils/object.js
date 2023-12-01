/**
 * External dependencies
 */
import { paramCase } from 'change-case';

/**
 * Converts any string to kebab case.
 * Backwards compatible with Lodash's `_.kebabCase()`.
 * Backwards compatible with `_wp_to_kebab_case()`.
 *
 * @see https://lodash.com/docs/4.17.15#kebabCase
 * @see https://developer.wordpress.org/reference/functions/_wp_to_kebab_case/
 *
 * @param {string} str String to convert.
 * @return {string} Kebab-cased string
 */
export function kebabCase( str ) {
	let input = str;
	if ( typeof str !== 'string' ) {
		input = str?.toString?.() ?? '';
	}

	// See https://github.com/lodash/lodash/blob/b185fcee26b2133bd071f4aaca14b455c2ed1008/lodash.js#L4970
	input = input.replace( /['\u2019]/, '' );

	return paramCase( input, {
		splitRegexp: [
			/(?!(?:1ST|2ND|3RD|[4-9]TH)(?![a-z]))([a-z0-9])([A-Z])/g, // fooBar => foo-bar, 3Bar => 3-bar
			/(?!(?:1st|2nd|3rd|[4-9]th)(?![a-z]))([0-9])([a-z])/g, // 3bar => 3-bar
			/([A-Za-z])([0-9])/g, // Foo3 => foo-3, foo3 => foo-3
			/([A-Z])([A-Z][a-z])/g, // FOOBar => foo-bar
		],
	} );
}

/**
 * Immutably sets a value inside an object. Like `lodash#set`, but returning a
 * new object. Treats nullish initial values as empty objects. Clones any
 * nested objects. Supports arrays, too.
 *
 * @param {Object}              object Object to set a value in.
 * @param {number|string|Array} path   Path in the object to modify.
 * @param {*}                   value  New value to set.
 * @return {Object} Cloned object with the new value set.
 */
export function setImmutably( object, path, value ) {
	// Normalize path
	path = Array.isArray( path ) ? [ ...path ] : [ path ];

	// Shallowly clone the base of the object
	object = Array.isArray( object ) ? [ ...object ] : { ...object };

	const leaf = path.pop();

	// Traverse object from root to leaf, shallowly cloning at each level
	let prev = object;
	for ( const key of path ) {
		const lvl = prev[ key ];
		prev = prev[ key ] = Array.isArray( lvl ) ? [ ...lvl ] : { ...lvl };
	}

	prev[ leaf ] = value;

	return object;
}

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
	const arrayPath = Array.isArray( path ) ? path : path.split( '.' );
	let value = object;
	arrayPath.forEach( ( fieldName ) => {
		value = value?.[ fieldName ];
	} );
	return value ?? defaultValue;
};
