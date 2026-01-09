/**
 * Internal dependencies
 */
import latexDelimiterConverter, {
	hasLatexDelimiters,
	isPureDisplayMath,
	extractDisplayMathContent,
} from '../latex-delimiter-converter';

describe( 'latexDelimiterConverter', () => {
	describe( 'display math delimiters', () => {
		it( 'converts $$...$$ to math element with display block', () => {
			const input = '$$x^2 + y^2$$';
			const output = latexDelimiterConverter( input );
			expect( output ).toBe(
				'<math display="block" data-latex="x^2 + y^2"></math>'
			);
		} );

		it( 'converts \\[...\\] to math element with display block', () => {
			const input = '\\[\\frac{1}{2}\\]';
			const output = latexDelimiterConverter( input );
			expect( output ).toBe(
				'<math display="block" data-latex="\\frac{1}{2}"></math>'
			);
		} );

		it( 'handles display math with surrounding text', () => {
			const input = 'Before $$x^2$$ after';
			const output = latexDelimiterConverter( input );
			expect( output ).toBe(
				'Before <math display="block" data-latex="x^2"></math> after'
			);
		} );
	} );

	describe( 'inline math delimiters', () => {
		it( 'converts $...$ to math element', () => {
			const input = 'The formula $x^2$ is quadratic';
			const output = latexDelimiterConverter( input );
			expect( output ).toBe(
				'The formula <math data-latex="x^2"></math> is quadratic'
			);
		} );

		it( 'converts \\(...\\) to math element', () => {
			const input = 'Use \\(a + b\\) for addition';
			const output = latexDelimiterConverter( input );
			expect( output ).toBe(
				'Use <math data-latex="a + b"></math> for addition'
			);
		} );

		it( 'handles multiple inline math expressions', () => {
			const input = 'Given $a$ and $b$, find $c$';
			const output = latexDelimiterConverter( input );
			expect( output ).toBe(
				'Given <math data-latex="a"></math> and <math data-latex="b"></math>, find <math data-latex="c"></math>'
			);
		} );
	} );

	describe( 'nested braces', () => {
		it( 'handles \\frac{1}{2}', () => {
			const input = '$\\frac{1}{2}$';
			const output = latexDelimiterConverter( input );
			expect( output ).toBe( '<math data-latex="\\frac{1}{2}"></math>' );
		} );

		it( 'handles deeply nested braces', () => {
			const input = '$\\frac{\\frac{a}{b}}{c}$';
			const output = latexDelimiterConverter( input );
			expect( output ).toBe(
				'<math data-latex="\\frac{\\frac{a}{b}}{c}"></math>'
			);
		} );

		it( 'handles complex expressions', () => {
			const input = '$$\\int_{0}^{\\infty} e^{-x^2} dx$$';
			const output = latexDelimiterConverter( input );
			expect( output ).toBe(
				'<math display="block" data-latex="\\int_{0}^{\\infty} e^{-x^2} dx"></math>'
			);
		} );
	} );

	describe( 'currency detection', () => {
		it( 'does not convert $100', () => {
			const input = 'The price is $100';
			const output = latexDelimiterConverter( input );
			expect( output ).toBe( 'The price is $100' );
		} );

		it( 'does not convert $5.99', () => {
			const input = 'Only $5.99 today';
			const output = latexDelimiterConverter( input );
			expect( output ).toBe( 'Only $5.99 today' );
		} );

		it( 'does not convert $ 50', () => {
			const input = 'Costs $ 50';
			const output = latexDelimiterConverter( input );
			expect( output ).toBe( 'Costs $ 50' );
		} );

		it( 'converts math that looks like $5 + 3$', () => {
			const input = 'Calculate $5 + 3$';
			const output = latexDelimiterConverter( input );
			expect( output ).toBe(
				'Calculate <math data-latex="5 + 3"></math>'
			);
		} );

		it( 'distinguishes math from currency in mixed content', () => {
			const input = 'If $x > 5$ then it costs $10';
			const output = latexDelimiterConverter( input );
			expect( output ).toBe(
				'If <math data-latex="x &gt; 5"></math> then it costs $10'
			);
		} );
	} );

	describe( 'HTML preservation', () => {
		it( 'preserves HTML tags around math', () => {
			const input = '<p>The <strong>formula</strong> $x^2$ is here</p>';
			const output = latexDelimiterConverter( input );
			expect( output ).toBe(
				'<p>The <strong>formula</strong> <math data-latex="x^2"></math> is here</p>'
			);
		} );

		it( 'does not convert LaTeX inside code tags', () => {
			const input = '<code>$x^2$</code>';
			const output = latexDelimiterConverter( input );
			expect( output ).toBe( '<code>$x^2$</code>' );
		} );

		it( 'does not convert LaTeX inside pre tags', () => {
			const input = '<pre>$$x^2$$</pre>';
			const output = latexDelimiterConverter( input );
			expect( output ).toBe( '<pre>$$x^2$$</pre>' );
		} );

		it( 'does not convert LaTeX inside nested code tags', () => {
			const input = '<p>Use <code>$x$</code> for variables</p>';
			const output = latexDelimiterConverter( input );
			expect( output ).toBe(
				'<p>Use <code>$x$</code> for variables</p>'
			);
		} );

		it( 'handles mixed code and math', () => {
			const input = '<p>Code <code>$a$</code> and math $b$</p>';
			const output = latexDelimiterConverter( input );
			expect( output ).toBe(
				'<p>Code <code>$a$</code> and math <math data-latex="b"></math></p>'
			);
		} );
	} );

	describe( 'special characters', () => {
		it( 'escapes ampersands in LaTeX', () => {
			const input = '$a & b$';
			const output = latexDelimiterConverter( input );
			expect( output ).toBe( '<math data-latex="a &amp; b"></math>' );
		} );

		it( 'escapes quotes in LaTeX', () => {
			const input = '$"text"$';
			const output = latexDelimiterConverter( input );
			expect( output ).toBe(
				'<math data-latex="&quot;text&quot;"></math>'
			);
		} );

		it( 'escapes angle brackets in LaTeX', () => {
			const input = '$a < b > c$';
			const output = latexDelimiterConverter( input );
			expect( output ).toBe(
				'<math data-latex="a &lt; b &gt; c"></math>'
			);
		} );
	} );

	describe( 'edge cases', () => {
		it( 'handles empty string', () => {
			const input = '';
			const output = latexDelimiterConverter( input );
			expect( output ).toBe( '' );
		} );

		it( 'handles text without delimiters', () => {
			const input = 'Plain text without math';
			const output = latexDelimiterConverter( input );
			expect( output ).toBe( 'Plain text without math' );
		} );

		it( 'handles unbalanced opening delimiter', () => {
			const input = 'Text with $unbalanced';
			const output = latexDelimiterConverter( input );
			expect( output ).toBe( 'Text with $unbalanced' );
		} );

		it( 'handles $$ vs $ precedence', () => {
			const input = '$$x$$';
			const output = latexDelimiterConverter( input );
			expect( output ).toBe(
				'<math display="block" data-latex="x"></math>'
			);
		} );

		it( 'handles whitespace-only math', () => {
			const input = '$   $';
			const output = latexDelimiterConverter( input );
			expect( output ).toBe( '<math data-latex="   "></math>' );
		} );
	} );
} );

describe( 'hasLatexDelimiters', () => {
	it( 'returns true for $$...$$', () => {
		expect( hasLatexDelimiters( '$$x$$' ) ).toBe( true );
	} );

	it( 'returns true for \\[...\\]', () => {
		expect( hasLatexDelimiters( '\\[x\\]' ) ).toBe( true );
	} );

	it( 'returns true for $...$', () => {
		expect( hasLatexDelimiters( '$x$' ) ).toBe( true );
	} );

	it( 'returns true for \\(...\\)', () => {
		expect( hasLatexDelimiters( '\\(x\\)' ) ).toBe( true );
	} );

	it( 'returns false for plain text', () => {
		expect( hasLatexDelimiters( 'Hello world' ) ).toBe( false );
	} );

	it( 'returns false for currency', () => {
		expect( hasLatexDelimiters( 'Price: $100' ) ).toBe( false );
	} );

	it( 'returns false for empty string', () => {
		expect( hasLatexDelimiters( '' ) ).toBe( false );
	} );

	it( 'returns false for null', () => {
		expect( hasLatexDelimiters( null ) ).toBe( false );
	} );
} );

describe( 'isPureDisplayMath', () => {
	it( 'returns true for $$...$$', () => {
		expect( isPureDisplayMath( '$$x^2$$' ) ).toBe( true );
	} );

	it( 'returns true for \\[...\\]', () => {
		expect( isPureDisplayMath( '\\[x^2\\]' ) ).toBe( true );
	} );

	it( 'returns true with surrounding whitespace', () => {
		expect( isPureDisplayMath( '  $$x^2$$  ' ) ).toBe( true );
	} );

	it( 'returns false for inline math', () => {
		expect( isPureDisplayMath( '$x$' ) ).toBe( false );
	} );

	it( 'returns false for mixed content', () => {
		expect( isPureDisplayMath( 'Text $$x$$' ) ).toBe( false );
	} );

	it( 'returns false for empty $$$$', () => {
		expect( isPureDisplayMath( '$$$$' ) ).toBe( false );
	} );

	it( 'returns false for plain text', () => {
		expect( isPureDisplayMath( 'Hello' ) ).toBe( false );
	} );

	it( 'returns false for empty string', () => {
		expect( isPureDisplayMath( '' ) ).toBe( false );
	} );
} );

describe( 'extractDisplayMathContent', () => {
	it( 'extracts content from $$...$$', () => {
		expect( extractDisplayMathContent( '$$x^2 + y^2$$' ) ).toBe(
			'x^2 + y^2'
		);
	} );

	it( 'extracts content from \\[...\\]', () => {
		expect( extractDisplayMathContent( '\\[\\frac{1}{2}\\]' ) ).toBe(
			'\\frac{1}{2}'
		);
	} );

	it( 'trims whitespace', () => {
		expect( extractDisplayMathContent( '$$  x  $$' ) ).toBe( 'x' );
	} );

	it( 'handles surrounding whitespace', () => {
		expect( extractDisplayMathContent( '  $$x$$  ' ) ).toBe( 'x' );
	} );

	it( 'returns original text if not display math', () => {
		expect( extractDisplayMathContent( 'plain text' ) ).toBe(
			'plain text'
		);
	} );
} );
