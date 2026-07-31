/**
 * Internal dependencies
 */
import latexToMathML from '../index';

describe( 'latexToMathML', () => {
	it( 'converts a simple expression', () => {
		const mathML = latexToMathML( 'x^2', { displayMode: false } );

		expect( mathML ).toContain( '<msup>' );
	} );

	it( 'converts a pmatrix environment', () => {
		const latex = `
			\\begin{pmatrix}
			1 & 2 & -1 \\\\
			0 & 3 & 4 \\\\
			2 & -2 & 1
			\\end{pmatrix}
		`;

		expect( () => latexToMathML( latex ) ).not.toThrow();

		const mathML = latexToMathML( latex );

		expect( mathML ).toContain( '<mtable' );
		expect( mathML ).toMatch( /columnalign="center center( center)?"/ );
	} );

	it( 'converts a vmatrix environment', () => {
		const latex = `
			\\begin{vmatrix}
			2 & 1 & 0 \\\\
			-1 & 3 & 2 \\\\
			4 & 0 & 1
			\\end{vmatrix}
		`;

		expect( () => latexToMathML( latex ) ).not.toThrow();
		expect( latexToMathML( latex ) ).toContain( '<mtable' );
	} );

	it( 'converts an aligned environment with optional row spacing', () => {
		const latex = `
			\\begin{aligned}
			A &= B \\\\[8pt]
			C &= D
			\\end{aligned}
		`;

		expect( () => latexToMathML( latex ) ).not.toThrow();

		const mathML = latexToMathML( latex );

		expect( mathML ).toContain( '<mtable' );
		expect( mathML ).toContain( 'tml-jot' );
	} );

	it( 'converts a matrix nested inside an aligned environment', () => {
		const latex = `
			\\begin{aligned}
			A &=
			\\begin{pmatrix}
			1 & 0 \\\\
			0 & 1
			\\end{pmatrix}
			\\end{aligned}
		`;

		expect( () => latexToMathML( latex ) ).not.toThrow();
	} );
} );
