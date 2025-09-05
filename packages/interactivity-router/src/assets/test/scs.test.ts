/**
 * Internal dependencies
 */
import { shortestCommonSupersequence } from '../scs';

/**
 * Checks if the passed array is a contained sequence of the given
 * supersequence.
 *
 * @param arr      Array.
 * @param superseq Supersequence.
 * @param isEqual  Optional comparator.
 * @return True if the passed array is contained. False otherwise.
 */
function isSubsequence(
	arr: unknown[],
	superseq: unknown[],
	isEqual = ( a: unknown, b: unknown ): boolean => a === b
) {
	let i = 0;
	let j = 0;
	while ( i < arr.length && j < superseq.length ) {
		if ( isEqual( arr[ i ], superseq[ j ] ) ) {
			i++;
		}
		j++;
	}
	return i === arr.length;
}

describe( 'shortestCommonSupersequence', () => {
	describe( 'Basic functionality', () => {
		it( 'should handle empty arrays', () => {
			// Both arrays empty.
			expect( shortestCommonSupersequence( [], [] ) ).toEqual( [] );

			// X empty, Y with values.
			const Y = [ 1, 2, 3 ];
			expect( shortestCommonSupersequence( [], Y ) ).toEqual( Y );

			// Y empty, X with values.
			const X = [ 1, 2, 3 ];
			expect( shortestCommonSupersequence( X, [] ) ).toEqual( X );
		} );

		it( 'should handle identical arrays', () => {
			// Same elements, same order.
			const X = [ 1, 2, 3 ];
			const Y = [ 1, 2, 3 ];
			expect( shortestCommonSupersequence( X, Y ) ).toEqual( [
				1, 2, 3,
			] );
		} );

		it( 'should handle simple cases with partial overlap', () => {
			// Overlap at the beginning.
			const result1 = shortestCommonSupersequence(
				[ 1, 2, 3 ],
				[ 1, 2, 4 ]
			);
			// Verify it's a valid supersequence.
			expect( isSubsequence( [ 1, 2, 3 ], result1 ) ).toBe( true );
			expect( isSubsequence( [ 1, 2, 4 ], result1 ) ).toBe( true );
			// Verify optimal length.
			expect( result1.length ).toBe( 4 );

			// Overlap at the end.
			const result2 = shortestCommonSupersequence(
				[ 1, 2, 3 ],
				[ 0, 2, 3 ]
			);
			// Verify it's a valid supersequence.
			expect( isSubsequence( [ 1, 2, 3 ], result2 ) ).toBe( true );
			expect( isSubsequence( [ 0, 2, 3 ], result2 ) ).toBe( true );
			// Verify optimal length.
			expect( result2.length ).toBe( 4 );

			// Middle overlap.
			const result3 = shortestCommonSupersequence(
				[ 1, 2, 3 ],
				[ 0, 2, 4 ]
			);
			// Verify it's a valid supersequence.
			expect( isSubsequence( [ 1, 2, 3 ], result3 ) ).toBe( true );
			expect( isSubsequence( [ 0, 2, 4 ], result3 ) ).toBe( true );
			// Verify optimal length.
			expect( result3.length ).toBe( 5 );
		} );

		it( 'should handle arrays with no overlap', () => {
			const X = [ 1, 2, 3 ];
			const Y = [ 4, 5, 6 ];
			const result = shortestCommonSupersequence( X, Y );

			// Test that it's a valid supersequence of both arrays.
			expect( isSubsequence( X, result ) ).toBe( true );
			expect( isSubsequence( Y, result ) ).toBe( true );

			// Result length should be X.length + Y.length.
			expect( result.length ).toBe( X.length + Y.length );
		} );

		it( 'should verify the supersequence length is optimal', () => {
			// Example where the shortest supersequence is shorter than just concatenating.
			const X = [ 1, 2, 3 ];
			const Y = [ 2, 3, 4 ];
			const result = shortestCommonSupersequence( X, Y );

			expect( result.length ).toBe( 4 );
			expect( result ).toEqual( [ 1, 2, 3, 4 ] );
		} );
	} );

	describe( 'Edge cases', () => {
		it( 'should handle subsequence cases', () => {
			// X is a subsequence of Y.
			const X1 = [ 1, 3 ];
			const Y1 = [ 1, 2, 3, 4 ];
			expect( shortestCommonSupersequence( X1, Y1 ) ).toEqual( Y1 );

			// Y is a subsequence of X.
			const X2 = [ 1, 2, 3, 4 ];
			const Y2 = [ 1, 3 ];
			expect( shortestCommonSupersequence( X2, Y2 ) ).toEqual( X2 );
		} );

		it( 'should handle arrays with duplicate elements', () => {
			// Duplicates in X.
			const resultX = shortestCommonSupersequence(
				[ 1, 2, 2, 3 ],
				[ 1, 3, 4 ]
			);
			expect( isSubsequence( [ 1, 2, 2, 3 ], resultX ) ).toBe( true );
			expect( isSubsequence( [ 1, 3, 4 ], resultX ) ).toBe( true );
			expect( resultX.length ).toBe( 5 );

			// Duplicates in Y.
			const resultY = shortestCommonSupersequence(
				[ 1, 3, 4 ],
				[ 1, 2, 2, 3 ]
			);
			expect( isSubsequence( [ 1, 3, 4 ], resultY ) ).toBe( true );
			expect( isSubsequence( [ 1, 2, 2, 3 ], resultY ) ).toBe( true );
			expect( resultY.length ).toBe( 5 );

			// Duplicates in both X and Y.
			const resultXY = shortestCommonSupersequence(
				[ 1, 2, 2, 3 ],
				[ 1, 2, 3, 3 ]
			);
			expect( isSubsequence( [ 1, 2, 2, 3 ], resultXY ) ).toBe( true );
			expect( isSubsequence( [ 1, 2, 3, 3 ], resultXY ) ).toBe( true );
			expect( resultXY.length ).toBe( 5 );

			// Multiple duplicate occurrences.
			const result = shortestCommonSupersequence(
				[ 1, 2, 1, 2 ],
				[ 2, 1, 2, 1 ]
			);

			expect( isSubsequence( [ 1, 2, 1, 2 ], result ) ).toBe( true );
			expect( isSubsequence( [ 2, 1, 2, 1 ], result ) ).toBe( true );
			expect( result.length ).toBe( 5 );
		} );

		it( 'should handle completely duplicate array', () => {
			expect(
				shortestCommonSupersequence( [ 1, 1, 1 ], [ 1, 1 ] )
			).toEqual( [ 1, 1, 1 ] );
		} );

		it( 'should handle asymmetric cases with different array lengths', () => {
			// X much longer than Y.
			const X1 = [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ];
			const Y1 = [ 2, 5 ];
			const result1 = shortestCommonSupersequence( X1, Y1 );

			// Result should be same as X since Y is a subsequence.
			expect( result1 ).toEqual( X1 );

			// Y much longer than X.
			const X2 = [ 2, 5 ];
			const Y2 = [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ];
			const result2 = shortestCommonSupersequence( X2, Y2 );

			// Result should be same as Y since X is a subsequence.
			expect( result2 ).toEqual( Y2 );
		} );
	} );

	describe( 'Order preservation', () => {
		it( 'should preserve order of elements from input arrays', () => {
			const X = [ 1, 3, 5 ];
			const Y = [ 5, 3, 1 ];
			const result = shortestCommonSupersequence( X, Y );

			// Test that it's a valid supersequence of both arrays.
			expect( isSubsequence( X, result ) ).toBe( true );
			expect( isSubsequence( Y, result ) ).toBe( true );

			// Verify optimal length.
			expect( result.length ).toBe( 5 );

			// Test reverse case.
			const result2 = shortestCommonSupersequence( Y, X );
			expect( isSubsequence( X, result2 ) ).toBe( true );
			expect( isSubsequence( Y, result2 ) ).toBe( true );

			// Verify optimal length.
			expect( result2.length ).toBe( 5 );
		} );

		it( 'should handle zigzag patterns correctly', () => {
			const X = [ 1, 3, 5, 7, 9 ];
			const Y = [ 2, 4, 6, 8, 10 ];
			const result = shortestCommonSupersequence( X, Y );

			// Verify it's a valid supersequence.
			expect( isSubsequence( X, result ) ).toBe( true );
			expect( isSubsequence( Y, result ) ).toBe( true );

			// Verify optimal length (should be X.length + Y.length because no common elements).
			expect( result.length ).toBe( 10 );
		} );
	} );

	describe( 'Advanced cases', () => {
		it( 'should handle complex interleavings', () => {
			const X = [ 1, 2, 3, 1, 2, 3 ];
			const Y = [ 3, 2, 1, 3, 2, 1 ];
			const result = shortestCommonSupersequence( X, Y );

			// Result should be a valid supersequence.
			expect( isSubsequence( X, result ) ).toBe( true );
			expect( isSubsequence( Y, result ) ).toBe( true );

			// Verify optimal length.
			expect( result.length ).toBe( 9 );
		} );

		it( 'should handle almost identical arrays with one difference', () => {
			const X = [ 1, 2, 3, 4, 5 ];
			const Y = [ 1, 2, 3, 5, 4 ];
			const result = shortestCommonSupersequence( X, Y );

			// Result should contain 6 elements (optimal length).
			expect( result.length ).toBe( 6 );

			// The first 3 elements should be 1,2,3.
			expect( result.slice( 0, 3 ) ).toEqual( [ 1, 2, 3 ] );

			// Test that it's a valid supersequence of both arrays.
			expect( isSubsequence( X, result ) ).toBe( true );
			expect( isSubsequence( Y, result ) ).toBe( true );
		} );

		it( 'should handle multiple matching possibilities optimally', () => {
			const X = [ 1, 1, 2, 2 ];
			const Y = [ 1, 2, 1, 2 ];
			const result = shortestCommonSupersequence( X, Y );

			// Result should be a valid supersequence.
			expect( isSubsequence( X, result ) ).toBe( true );
			expect( isSubsequence( Y, result ) ).toBe( true );

			// Verify optimal length.
			expect( result.length ).toBe( 5 );
		} );
	} );

	describe( 'Custom equality function', () => {
		it( 'should use custom equality function for comparing elements', () => {
			const X = [
				{ id: 1, name: 'a' },
				{ id: 2, name: 'b' },
			];
			const Y = [
				{ id: 1, name: 'c' },
				{ id: 2, name: 'd' },
			];

			// Custom equality function that only compares 'id' property.
			const isEqual = ( a, b ) => a.id === b.id;

			const result = shortestCommonSupersequence( X, Y, isEqual );

			// Should treat objects with same ids as equal.
			expect( result.length ).toBe( 2 );
			expect( result[ 0 ].id ).toBe( 1 );
			expect( result[ 1 ].id ).toBe( 2 );

			// Should use references from X.
			expect( result[ 0 ] ).toBe( X[ 0 ] );
			expect( result[ 1 ] ).toBe( X[ 1 ] );

			// Test that it's a valid supersequence of both arrays.
			expect( isSubsequence( X, result, isEqual ) ).toBe( true );
			expect( isSubsequence( Y, result, isEqual ) ).toBe( true );
		} );

		it( 'should handle case-insensitive comparison', () => {
			const X = [ 'A', 'B', 'C' ];
			const Y = [ 'a', 'b', 'D' ];

			// Case-insensitive comparison.
			const isEqual = ( a, b ) => a.toLowerCase() === b.toLowerCase();

			const result = shortestCommonSupersequence( X, Y, isEqual );

			// Check references are from X when elements are considered equal.
			expect( result[ 0 ] ).toBe( X[ 0 ] ); // 'A' instead of 'a'
			expect( result[ 1 ] ).toBe( X[ 1 ] ); // 'B' instead of 'b'

			// Verify it contains C and D (which don't match).
			expect( result.includes( 'C' ) ).toBe( true );
			expect( result.includes( 'D' ) ).toBe( true );

			// Test that it's a valid supersequence of both arrays.
			expect( isSubsequence( X, result, isEqual ) ).toBe( true );
			expect( isSubsequence( Y, result, isEqual ) ).toBe( true );

			// Check length is correct (4 instead of 6).
			expect( result.length ).toBe( 4 );
		} );
	} );

	describe( 'Null and undefined handling', () => {
		it( 'should handle arrays with null values', () => {
			const X = [ 1, null, 3 ];
			const Y = [ null, 2, 3 ];
			const result = shortestCommonSupersequence( X, Y );

			// Should treat null values correctly.
			expect( result ).toEqual( [ 1, null, 2, 3 ] );
		} );

		it( 'should handle arrays with undefined', () => {
			const X = [ 1, undefined, 3 ];
			const Y = [ 2, undefined, 4 ];
			const result = shortestCommonSupersequence( X, Y );

			// Test that it's a valid supersequence of both arrays.
			expect( isSubsequence( X, result ) ).toBe( true );
			expect( isSubsequence( Y, result ) ).toBe( true );

			// Length should be shorter than concatenating the arrays.
			expect( result.length ).toBeLessThan( X.length + Y.length );
		} );
	} );

	describe( 'Mutation checks', () => {
		it( 'should not modify the input arrays', () => {
			const X = [ 1, 2, 3 ];
			const Y = [ 2, 3, 4 ];

			// Create copies for comparison.
			const originalX = [ ...X ];
			const originalY = [ ...Y ];

			shortestCommonSupersequence( X, Y );

			// Input arrays should remain unchanged.
			expect( X ).toEqual( originalX );
			expect( Y ).toEqual( originalY );
		} );
	} );
} );
