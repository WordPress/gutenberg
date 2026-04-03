/**
 * Internal dependencies
 */
import isLatexMathMode from '../latex-to-math';

describe( 'isLatexMathMode', () => {
	describe( 'should return true for valid LaTeX math mode', () => {
		it( 'LaTeX command with argument syntax', () => {
			expect( isLatexMathMode( '\\frac{a}{b}' ) ).toBe( true );
			expect( isLatexMathMode( '\\sqrt{2}' ) ).toBe( true );
			expect( isLatexMathMode( '\\sum{i=1}' ) ).toBe( true );
		} );

		it( 'multiple soft clues (exponent and operator)', () => {
			expect( isLatexMathMode( 'x^2 + y^2 = z^2' ) ).toBe( true );
		} );

		it( 'multiple soft clues (exponent and LaTeX command)', () => {
			expect( isLatexMathMode( 'x^2 + \\alpha' ) ).toBe( true );
		} );

		it( 'multiple soft clues (command and operator)', () => {
			expect( isLatexMathMode( '\\pi * r^2' ) ).toBe( true );
			expect( isLatexMathMode( '\\alpha + \\beta' ) ).toBe( true );
		} );

		it( 'complex LaTeX expressions', () => {
			expect(
				isLatexMathMode(
					'\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}'
				)
			).toBe( true );
		} );
	} );

	describe( 'should return false for non-LaTeX content', () => {
		it( 'plain English text', () => {
			expect( isLatexMathMode( 'This is just plain text' ) ).toBe(
				false
			);
			expect(
				isLatexMathMode( 'Text, but with two x^3 = 1 soft clues' )
			).toBe( false );
		} );

		it( 'single soft clue (not enough)', () => {
			expect( isLatexMathMode( 'x^2' ) ).toBe( false );
			expect( isLatexMathMode( 'a + b' ) ).toBe( false );
			expect( isLatexMathMode( '\\alpha' ) ).toBe( false );
		} );

		it( 'regex with start of string', () => {
			expect( isLatexMathMode( '^[a+]' ) ).toBe( false );
		} );
	} );

	describe( 'should handle edge cases with LaTeX commands', () => {
		it( 'LaTeX command followed by long word in braces', () => {
			expect( isLatexMathMode( '\\text{hello world}' ) ).toBe( true );
			expect( isLatexMathMode( '\\mathrm{Example}' ) ).toBe( true );
		} );

		it( 'LaTeX command with long Latin script word', () => {
			expect( isLatexMathMode( '\\operatorname{argmax}' ) ).toBe( true );
		} );

		it( 'mixed content with LaTeX and text', () => {
			expect( isLatexMathMode( '\\frac{1}{2} + \\text{value}' ) ).toBe(
				true
			);
		} );
	} );

	describe( 'should handle Unicode characters', () => {
		it( 'non-Latin scripts', () => {
			expect( isLatexMathMode( 'こんにちは' ) ).toBe( false );
			expect( isLatexMathMode( '你好世界' ) ).toBe( false );
			expect( isLatexMathMode( 'Привет' ) ).toBe( false );
		} );

		it( 'mixed with LaTeX syntax', () => {
			expect( isLatexMathMode( 'α^β = γ' ) ).toBe( true );
		} );
	} );

	describe( 'should handle empty or minimal input', () => {
		it( 'empty string', () => {
			expect( isLatexMathMode( '' ) ).toBe( false );
		} );

		it( 'single character', () => {
			expect( isLatexMathMode( 'x' ) ).toBe( false );
			expect( isLatexMathMode( '5' ) ).toBe( false );
		} );

		it( 'only operators', () => {
			expect( isLatexMathMode( '+-*/' ) ).toBe( false );
		} );
	} );
} );
