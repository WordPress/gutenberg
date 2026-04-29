/**
 * Internal dependencies
 */
import { wordDiff } from '../suggestion-diff';

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
} );
