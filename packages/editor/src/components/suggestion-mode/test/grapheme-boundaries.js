/**
 * Internal dependencies
 */
import {
	previousGraphemeBoundary,
	nextGraphemeBoundary,
} from '../grapheme-boundaries';

// One 2-unit emoji (surrogate pair).
const EMOJI = '😀';
// Family emoji: four 2-unit emoji joined by three ZWJs (11 code units).
const FAMILY = '👨‍👩‍👧‍👦';
// "é" as base letter + combining acute accent (2 code units).
const COMBINING = 'é';

describe( 'grapheme boundaries', () => {
	describe( 'previousGraphemeBoundary', () => {
		it( 'steps one unit through plain ASCII', () => {
			expect( previousGraphemeBoundary( 'abc', 3 ) ).toBe( 2 );
			expect( previousGraphemeBoundary( 'abc', 1 ) ).toBe( 0 );
		} );

		it( 'clamps at the start and tolerates bad input', () => {
			expect( previousGraphemeBoundary( 'abc', 0 ) ).toBe( 0 );
			expect( previousGraphemeBoundary( 'abc', -2 ) ).toBe( 0 );
			expect( previousGraphemeBoundary( 'abc', 99 ) ).toBe( 2 );
			expect( previousGraphemeBoundary( undefined, 3 ) ).toBe( 0 );
		} );

		it( 'steps over a whole surrogate-pair emoji', () => {
			const text = `a${ EMOJI }b`;
			// Caret after the emoji (offset 3): the emoji starts at 1.
			expect( previousGraphemeBoundary( text, 3 ) ).toBe( 1 );
		} );

		it( 'steps over a whole ZWJ family emoji', () => {
			const text = `x${ FAMILY }`;
			expect( previousGraphemeBoundary( text, text.length ) ).toBe( 1 );
		} );

		it( 'keeps a combining accent with its base letter', () => {
			const text = `a${ COMBINING }`;
			expect( previousGraphemeBoundary( text, text.length ) ).toBe( 1 );
		} );

		it( 'snaps a mid-grapheme offset to the grapheme start', () => {
			const text = `a${ EMOJI }`;
			// Offset 2 sits between the surrogates.
			expect( previousGraphemeBoundary( text, 2 ) ).toBe( 1 );
		} );
	} );

	describe( 'nextGraphemeBoundary', () => {
		it( 'steps one unit through plain ASCII', () => {
			expect( nextGraphemeBoundary( 'abc', 0 ) ).toBe( 1 );
			expect( nextGraphemeBoundary( 'abc', 2 ) ).toBe( 3 );
		} );

		it( 'clamps at the end and tolerates bad input', () => {
			expect( nextGraphemeBoundary( 'abc', 3 ) ).toBe( 3 );
			expect( nextGraphemeBoundary( 'abc', 99 ) ).toBe( 3 );
			expect( nextGraphemeBoundary( undefined, 0 ) ).toBe( 0 );
		} );

		it( 'steps over a whole surrogate-pair emoji', () => {
			const text = `a${ EMOJI }b`;
			expect( nextGraphemeBoundary( text, 1 ) ).toBe( 3 );
		} );

		it( 'steps over a whole ZWJ family emoji', () => {
			const text = `${ FAMILY }x`;
			expect( nextGraphemeBoundary( text, 0 ) ).toBe( FAMILY.length );
		} );

		it( 'keeps a combining accent with its base letter', () => {
			const text = `${ COMBINING }b`;
			expect( nextGraphemeBoundary( text, 0 ) ).toBe( 2 );
		} );

		it( 'snaps a mid-grapheme offset to the grapheme end', () => {
			const text = `${ EMOJI }b`;
			// Offset 1 sits between the surrogates.
			expect( nextGraphemeBoundary( text, 1 ) ).toBe( 2 );
		} );
	} );

	describe( 'surrogate-pair fallback (no Intl.Segmenter)', () => {
		let originalSegmenter;

		beforeAll( () => {
			originalSegmenter = Intl.Segmenter;
			delete Intl.Segmenter;
		} );

		afterAll( () => {
			Intl.Segmenter = originalSegmenter;
		} );

		it( 'still steps over surrogate pairs', () => {
			const text = `a${ EMOJI }b`;
			expect( previousGraphemeBoundary( text, 3 ) ).toBe( 1 );
			expect( nextGraphemeBoundary( text, 1 ) ).toBe( 3 );
		} );

		it( 'steps single units through ASCII', () => {
			expect( previousGraphemeBoundary( 'abc', 2 ) ).toBe( 1 );
			expect( nextGraphemeBoundary( 'abc', 1 ) ).toBe( 2 );
		} );

		it( 'never lands inside a surrogate pair at text edges', () => {
			expect( previousGraphemeBoundary( EMOJI, 2 ) ).toBe( 0 );
			expect( nextGraphemeBoundary( EMOJI, 0 ) ).toBe( 2 );
		} );
	} );
} );
