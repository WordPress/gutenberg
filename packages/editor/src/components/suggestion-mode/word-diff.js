/**
 * Word-level text diff used by the suggestion sidebar summary.
 *
 * Extracted from the overlay-era `suggestion-diff.js` (an overlay render
 * component removed in the overlay-retirement work, #73411) so `wordDiff` could
 * survive that file's deletion. `wordDiff` is consumed by `suggestion-summary.js`.
 */

/**
 * Compute a word-level diff between two strings, returning an array of
 * segments tagged as `equal`, `insert`, or `delete`.
 *
 * @param {string} before Original text.
 * @param {string} after  Proposed text.
 * @return {Array<{type: string, value: string}>} Diff segments.
 */
export function wordDiff( before, after ) {
	const a = tokenize( before );
	const b = tokenize( after );
	const lcs = longestCommonSubsequence( a, b );

	const result = [];
	let ai = 0;
	let bi = 0;

	for ( const token of lcs ) {
		while ( ai < a.length && a[ ai ] !== token ) {
			result.push( { type: 'delete', value: a[ ai ] } );
			ai++;
		}
		while ( bi < b.length && b[ bi ] !== token ) {
			result.push( { type: 'insert', value: b[ bi ] } );
			bi++;
		}
		result.push( { type: 'equal', value: token } );
		ai++;
		bi++;
	}

	while ( ai < a.length ) {
		result.push( { type: 'delete', value: a[ ai ] } );
		ai++;
	}
	while ( bi < b.length ) {
		result.push( { type: 'insert', value: b[ bi ] } );
		bi++;
	}

	return result;
}

function tokenize( str ) {
	if ( typeof str !== 'string' ) {
		return [];
	}
	return str.match( /\S+|\s+/g ) || [];
}

function longestCommonSubsequence( a, b ) {
	const m = a.length;
	const n = b.length;
	const dp = Array.from( { length: m + 1 }, () =>
		new Array( n + 1 ).fill( 0 )
	);

	for ( let i = 1; i <= m; i++ ) {
		for ( let j = 1; j <= n; j++ ) {
			dp[ i ][ j ] =
				a[ i - 1 ] === b[ j - 1 ]
					? dp[ i - 1 ][ j - 1 ] + 1
					: Math.max( dp[ i - 1 ][ j ], dp[ i ][ j - 1 ] );
		}
	}

	const result = [];
	let i = m;
	let j = n;
	while ( i > 0 && j > 0 ) {
		if ( a[ i - 1 ] === b[ j - 1 ] ) {
			result.unshift( a[ i - 1 ] );
			i--;
			j--;
		} else if ( dp[ i - 1 ][ j ] > dp[ i ][ j - 1 ] ) {
			i--;
		} else {
			j--;
		}
	}
	return result;
}
