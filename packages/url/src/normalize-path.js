/**
 * Given a path, returns a normalized path where equal query parameter values
 * will be treated as identical, regardless of order they appear in the original
 * text.
 *
 * @param {string} path Original path.
 *
 * @return {string} Normalized path.
 */
export function normalizePath( path ) {
	const splitted = path.split( '?' );
	const query = splitted[ 1 ];
	const base = splitted[ 0 ];
	if ( ! query ) {
		return base;
	}

	// 'b=1%2C2&c=2&a=5'
	return (
		base +
		'?' +
		query
			// [ 'b=1%2C2', 'c=2', 'a=5' ]
			.split( '&' )
			// [ [ 'b, '1%2C2' ], [ 'c', '2' ], [ 'a', '5' ] ]
			.map( ( entry ) => entry.split( '=' ) )
			// [ [ 'b', '1,2' ], [ 'c', '2' ], [ 'a', '5' ] ]
			.map( ( pair ) => pair.map( decodeURIComponent ) )
			// [ [ 'a', '5' ], [ 'b, '1,2' ], [ 'c', '2' ] ]
			.sort( ( a, b ) => a[ 0 ].localeCompare( b[ 0 ] ) )
			// [ [ 'a', '5' ], [ 'b, '1%2C2' ], [ 'c', '2' ] ]
			.map( ( pair ) => pair.map( encodeURIComponent ) )
			// [ 'a=5', 'b=1%2C2', 'c=2' ]
			.map( ( pair ) => pair.join( '=' ) )
			// 'a=5&b=1%2C2&c=2'
			.join( '&' )
	);
}
