/**
 * Internal dependencies
 */
import { safeDecodeURIComponent } from './safe-decode-uri-component';
import { getQueryString } from './get-query-string';

/** @typedef {import('./get-query-arg').QueryArgParsed} QueryArgParsed */

/**
 * @typedef {Record<string,QueryArgParsed>} QueryArgs
 */

/**
 * Sets a value in object deeply by a given array of path segments. Mutates the
 * object reference.
 *
 * @param {Record<string,*>} object Object in which to assign.
 * @param {string[]}         path   Path segment at which to set value.
 * @param {*}                value  Value to set.
 */
function setPath( object, path, value ) {
	const length = path.length;
	const lastIndex = length - 1;
	for ( let i = 0; i < length; i++ ) {
		let key = path[ i ];

		if ( ! key && Array.isArray( object ) ) {
			// If key is empty string and next value is array, derive key from
			// the current length of the array.
			key = object.length.toString();
		}

		key = [ '__proto__', 'constructor', 'prototype' ].includes( key )
			? key.toUpperCase()
			: key;

		// If the next key in the path is numeric (or empty string), it will be
		// created as an array. Otherwise, it will be created as an object.
		const isNextKeyArrayIndex = ! isNaN( Number( path[ i + 1 ] ) );

		object[ key ] =
			i === lastIndex
				? // If at end of path, assign the intended value.
				  value
				: // Otherwise, advance to the next object in the path, creating
				  // it if it does not yet exist.
				  object[ key ] || ( isNextKeyArrayIndex ? [] : {} );

		if ( Array.isArray( object[ key ] ) && ! isNextKeyArrayIndex ) {
			// If we current key is non-numeric, but the next value is an
			// array, coerce the value to an object.
			object[ key ] = { ...object[ key ] };
		}

		// Update working reference object to the next in the path.
		object = object[ key ];
	}
}

/**
 * Returns an object of query arguments of the given URL. If the given URL is
 * invalid or has no querystring, an empty object is returned.
 *
 * @param {string} url URL.
 *
 * @example
 * ```js
 * const foo = getQueryArgs( 'https://wordpress.org?foo=bar&bar=baz' );
 * // { "foo": "bar", "bar": "baz" }
 * ```
 *
 * @return {QueryArgs} Query args object.
 */
export function getQueryArgs( url ) {
	return (
		( getQueryString( url ) || '' )
			// Normalize space encoding, accounting for PHP URL encoding
			// corresponding to `application/x-www-form-urlencoded`.
			//
			// See: https://tools.ietf.org/html/rfc1866#section-8.2.1
			.replace( /\+/g, '%20' )
			.split( '&' )
			.reduce( ( accumulator, keyValue ) => {
				const [ key, value = '' ] = keyValue
					.split( '=' )
					// Filtering avoids decoding as `undefined` for value, where
					// default is restored in destructuring assignment.
					.filter( Boolean )
					.map( safeDecodeURIComponent );

				if ( key ) {
					const segments = key.replace( /\]/g, '' ).split( '[' );
					setPath( accumulator, segments, value );
				}

				return accumulator;
			}, Object.create( null ) )
	);
}
