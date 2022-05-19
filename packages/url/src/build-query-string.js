/**
 * Generates URL-encoded query string using input query data.
 *
 * It is intended to behave equivalent as PHP's `http_build_query`, configured
 * with encoding type PHP_QUERY_RFC3986 (spaces as `%20`).
 *
 * @example
 * ```js
 * const queryString = buildQueryString( {
 *    simple: 'is ok',
 *    arrays: [ 'are', 'fine', 'too' ],
 *    objects: {
 *       evenNested: {
 *          ok: 'yes',
 *       },
 *    },
 * } );
 * // "simple=is%20ok&arrays%5B0%5D=are&arrays%5B1%5D=fine&arrays%5B2%5D=too&objects%5BevenNested%5D%5Bok%5D=yes"
 * ```
 *
 * @param {Record<string,*>} data Data to encode.
 *
 * @return {string} Query string.
 */
export function buildQueryString( data ) {
	let string = '';

	const stack = Object.entries( data );

	let pair;
	while ( ( pair = stack.shift() ) ) {
		let [ key, value ] = pair;

		// Support building deeply nested data, from array or object values.
		const hasNestedData =
			Array.isArray( value ) || ( value && value.constructor === Object );

		if ( hasNestedData ) {
			// Push array or object values onto the stack as composed of their
			// original key and nested index or key, retaining order by a
			// combination of Array#reverse and Array#unshift onto the stack.
			const valuePairs = Object.entries( value ).reverse();
			for ( const [ member, memberValue ] of valuePairs ) {
				stack.unshift( [ `${ key }[${ member }]`, memberValue ] );
			}
		} else if ( value !== undefined ) {
			// Null is treated as special case, equivalent to empty string.
			if ( value === null ) {
				value = '';
			}

			string +=
				'&' + [ key, value ].map( encodeURIComponent ).join( '=' );
		}
	}

	// Loop will concatenate with leading `&`, but it's only expected for all
	// but the first query parameter. This strips the leading `&`, while still
	// accounting for the case that the string may in-fact be empty.
	return string.substr( 1 );
}
