/**
 * External dependencies
 */
import { paramCase } from 'change-case';

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
 * Immutably sets a value inside an object. Like `lodash#set`, but returning a
 * new object. Treats nullish initial values as empty objects. Clones any
 * nested objects.
 *
 * @param {Object}              object Object to set a value in.
 * @param {number|string|Array} path   Path in the object to modify.
 * @param {*}                   value  New value to set.
 * @return {Object} Cloned object with the new value set.
 */
export function setImmutably( object, path, value ) {
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
