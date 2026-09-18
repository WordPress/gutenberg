import { describe, expect, it } from 'vitest';
import latexToMathML from '../';

describe( 'latexToMathML', () => {
	it( 'writes columnalign on the cells of an aligned environment', () => {
		const doc = document.implementation.createHTMLDocument( '' );
		doc.body.innerHTML = `<math>${ latexToMathML(
			'\\begin{aligned} a &= b \\\\ c &= d \\end{aligned}'
		) }</math>`;

		expect(
			Array.from( doc.querySelectorAll( 'mtd' ), ( cell ) =>
				cell.getAttribute( 'columnalign' )
			)
		).toEqual( [ 'right', 'left', 'right', 'left' ] );
	} );

	it( 'strips the classes temml adds for its stylesheet', () => {
		expect(
			latexToMathML( '\\overline{ab} \\begin{cases} a & b \\end{cases}' )
		).not.toContain( 'class=' );
	} );

	it( 'leaves centered cells alone', () => {
		const doc = document.implementation.createHTMLDocument( '' );
		doc.body.innerHTML = `<math>${ latexToMathML(
			'\\begin{pmatrix} a & b \\end{pmatrix}'
		) }</math>`;

		expect(
			Array.from( doc.querySelectorAll( 'mtd' ), ( cell ) =>
				cell.hasAttribute( 'columnalign' )
			)
		).toEqual( [ false, false ] );
	} );
} );
