/**
 * Calculates the Shortest Common Supersequence (SCS) of two sequences.
 *
 * A supersequence is a sequence that contains both input sequences as subsequences.
 * The shortest common supersequence is the shortest possible such sequence.
 *
 * This implementation uses dynamic programming with a time complexity of O(mn)
 * and space complexity of O(mn), where m and n are the lengths of sequences X and Y.
 *
 * @example
 * ```ts
 * const seq1 = [1, 3, 5];
 * const seq2 = [2, 3, 4];
 * const scs = shortestCommonSupersequence(seq1, seq2); // [1, 2, 3, 4, 5]
 * ```
 *
 * @param X       The first sequence.
 * @param Y       The second sequence.
 * @param isEqual Optional equality function to compare elements.
 *                Defaults to strict equality (===).
 * @return The shortest common supersequence of X and Y.
 */
export function shortestCommonSupersequence< E = unknown >(
	X: E[],
	Y: E[],
	isEqual = ( a: E, b: E ) => a === b
) {
	const m = X.length;
	const n = Y.length;

	// Create a 2D dp table where dp[i][j] is the SCS for X[0..i-1] and Y[0..j-1].
	const dp: E[][][] = Array.from( { length: m + 1 }, () =>
		Array( n + 1 ).fill( null )
	);

	// Base cases: one of the sequences is empty.
	for ( let i = 0; i <= m; i++ ) {
		dp[ i ][ 0 ] = X.slice( 0, i );
	}
	for ( let j = 0; j <= n; j++ ) {
		dp[ 0 ][ j ] = Y.slice( 0, j );
	}

	// Fill in the dp table.
	for ( let i = 1; i <= m; i++ ) {
		for ( let j = 1; j <= n; j++ ) {
			if ( isEqual( X[ i - 1 ], Y[ j - 1 ] ) ) {
				// When X[i-1] equals Y[j-1], use the reference from X.
				dp[ i ][ j ] = dp[ i - 1 ][ j - 1 ].concat( X[ i - 1 ] );
			} else {
				// Choose the shorter option between appending X[i-1] or Y[j-1].
				const option1 = dp[ i - 1 ][ j ].concat( X[ i - 1 ] );
				const option2 = dp[ i ][ j - 1 ].concat( Y[ j - 1 ] );
				dp[ i ][ j ] =
					option1.length <= option2.length ? option1 : option2;
			}
		}
	}

	return dp[ m ][ n ];
}
