/**
 * Word-level text diff used by the suggestion sidebar summary
 * (`suggestion-summary.js`) to render a compact before→after precis of a
 * pending text-attribute suggestion.
 */

/**
 * Upper bound for word-level LCS input length (characters). Beyond this,
 * callers fall back to an attribute-level before→after label to avoid the
 * O(m·n) diff dominating the render. Two 2 KB strings produce a 4M-cell DP
 * table, which is the practical ceiling for an interactive sidebar render.
 */
export const MAX_DIFF_LENGTH = 2000;

/**
 * Upper bound on LCS input size in TOKENS per side. The exact LCS below
 * allocates an (m+1)×(n+1) DP table — O(m·n) time and memory — and runs in
 * sidebar summary renders, so it must be bounded inside this module and not
 * only by what callers happen to pass. Composes with `MAX_DIFF_LENGTH`:
 * consumers apply the character cap before calling (falling back to an
 * attribute label), while this cap guards the DP table itself for any caller.
 */
export const MAX_DIFF_TOKENS = 1500;

/**
 * Compute a word-level diff between two strings, returning an array of
 * segments tagged as `equal`, `insert`, or `delete`.
 *
 * Inputs whose token count exceeds `MAX_DIFF_TOKENS` on either side degrade
 * to a coarse whole-run replace (one `delete` segment for the old text, one
 * `insert` for the new), which callers already render as a generic change.
 *
 * Note: tokenization is whitespace-based (`\S+|\s+`), so text without word
 * separators — CJK prose in particular — arrives as a few giant tokens and
 * effectively degrades to the same whole-run replace rather than a
 * word-level diff.
 *
 * @param {string} before Original text.
 * @param {string} after  Proposed text.
 * @return {Array<{type: string, value: string}>} Diff segments.
 */
export function wordDiff( before, after ) {
	const a = tokenize( before );
	const b = tokenize( after );

	if ( a.length > MAX_DIFF_TOKENS || b.length > MAX_DIFF_TOKENS ) {
		const coarse = [];
		if ( a.length > 0 ) {
			coarse.push( { type: 'delete', value: a.join( '' ) } );
		}
		if ( b.length > 0 ) {
			coarse.push( { type: 'insert', value: b.join( '' ) } );
		}
		return coarse;
	}

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
