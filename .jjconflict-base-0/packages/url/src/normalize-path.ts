import { safeDecodeURIComponent } from './safe-decode-uri-component';

/**
 * Given a path, returns a normalized path where equal query parameter values
 * will be treated as identical, regardless of order they appear in the original
 * text.
 *
 * @param path Original path.
 *
 * @return Normalized path.
 */
export function normalizePath( path: string ): string {
	const separatorIndex = path.indexOf( '?' );

	if ( separatorIndex === -1 ) {
		return path;
	}

	const base = path.slice( 0, separatorIndex );
	const query = path.slice( separatorIndex + 1 );

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
			.map( ( pair ) => pair.map( safeDecodeURIComponent ) )
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
