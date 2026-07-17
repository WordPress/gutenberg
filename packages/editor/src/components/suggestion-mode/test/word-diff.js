/**
 * Internal dependencies
 */
import { wordDiff, MAX_DIFF_TOKENS } from '../word-diff';

describe( 'wordDiff', () => {
	it( 'returns equal segments for identical strings', () => {
		expect( wordDiff( 'hello world', 'hello world' ) ).toEqual( [
			{ type: 'equal', value: 'hello' },
			{ type: 'equal', value: ' ' },
			{ type: 'equal', value: 'world' },
		] );
	} );

	it( 'detects insertions', () => {
		const result = wordDiff( 'hello world', 'hello beautiful world' );
		const types = result.map( ( s ) => s.type );
		expect( types ).toContain( 'insert' );
		const inserted = result.filter( ( s ) => s.type === 'insert' );
		expect( inserted.map( ( s ) => s.value.trim() ) ).toContain(
			'beautiful'
		);
	} );

	it( 'detects deletions', () => {
		const result = wordDiff( 'hello beautiful world', 'hello world' );
		const deleted = result.filter( ( s ) => s.type === 'delete' );
		expect( deleted.map( ( s ) => s.value.trim() ) ).toContain(
			'beautiful'
		);
	} );

	it( 'handles replacement as delete+insert', () => {
		const result = wordDiff( 'the cat sat', 'the dog sat' );
		expect( result ).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( { type: 'delete', value: 'cat' } ),
				expect.objectContaining( { type: 'insert', value: 'dog' } ),
			] )
		);
	} );

	it( 'handles empty before (all insertions)', () => {
		const result = wordDiff( '', 'new text' );
		expect( result.every( ( s ) => s.type === 'insert' ) ).toBe( true );
	} );

	it( 'handles empty after (all deletions)', () => {
		const result = wordDiff( 'old text', '' );
		expect( result.every( ( s ) => s.type === 'delete' ) ).toBe( true );
	} );

	it( 'handles null/undefined gracefully', () => {
		expect( wordDiff( null, 'hello' ) ).toEqual( [
			{ type: 'insert', value: 'hello' },
		] );
		expect( wordDiff( 'hello', null ) ).toEqual( [
			{ type: 'delete', value: 'hello' },
		] );
	} );

	it( 'segments token-by-token at word boundaries', () => {
		// Replacing 'b' with 'x' in the middle of 'a b c' produces
		// delete+insert segments at the changed position.
		const result = wordDiff( 'a b c', 'a x c' );
		expect( result ).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( { type: 'delete', value: 'b' } ),
				expect.objectContaining( { type: 'insert', value: 'x' } ),
			] )
		);
	} );

	describe( 'token cap', () => {
		// A text of `n` distinct words tokenizes to n word tokens plus the
		// separating spaces (2n - 1 tokens total).
		const words = ( n, prefix = 'w' ) =>
			Array.from( { length: n }, ( _, i ) => `${ prefix }${ i }` ).join(
				' '
			);

		it( 'degrades to a coarse whole-run replace beyond the cap', () => {
			const big = words( MAX_DIFF_TOKENS ); // ~2n-1 tokens > cap
			const after = `${ big } tail`;
			const result = wordDiff( big, after );
			expect( result ).toEqual( [
				{ type: 'delete', value: big },
				{ type: 'insert', value: after },
			] );
		} );

		it( 'applies the cap when only one side is oversized', () => {
			const big = words( MAX_DIFF_TOKENS );
			const result = wordDiff( 'small', big );
			expect( result ).toEqual( [
				{ type: 'delete', value: 'small' },
				{ type: 'insert', value: big },
			] );
		} );

		it( 'omits empty sides from the coarse result', () => {
			const big = words( MAX_DIFF_TOKENS );
			expect( wordDiff( '', big ) ).toEqual( [
				{ type: 'insert', value: big },
			] );
			expect( wordDiff( big, '' ) ).toEqual( [
				{ type: 'delete', value: big },
			] );
		} );

		it( 'still word-diffs inputs at or under the cap', () => {
			// 750 words = 1499 tokens with separators: just under the cap.
			const base = words( 750 );
			const result = wordDiff( base, base );
			expect( result.every( ( s ) => s.type === 'equal' ) ).toBe( true );
		} );
	} );
} );
