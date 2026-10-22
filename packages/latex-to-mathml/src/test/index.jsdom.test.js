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

	it( 'writes columnalign on the cells of a cases environment', () => {
		const doc = document.implementation.createHTMLDocument( '' );
		doc.body.innerHTML = `<math>${ latexToMathML(
			'\\begin{cases} x & x > 0 \\\\ -x & x \\le 0 \\end{cases}'
		) }</math>`;

		expect(
			Array.from( doc.querySelectorAll( 'mtd' ), ( cell ) =>
				cell.getAttribute( 'columnalign' )
			)
		).toEqual( [ 'left', 'left', 'left', 'left' ] );
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

	describe( 'tags', () => {
		/**
		 * The converted LaTeX as a document body.
		 *
		 * @param {string} latex The source.
		 * @return {HTMLElement} The body.
		 */
		const convert = ( latex ) => {
			const doc = document.implementation.createHTMLDocument( '' );
			doc.body.innerHTML = `<math>${ latexToMathML( latex ) }</math>`;
			return doc.body;
		};

		it( 'writes the width of the table and its glue columns', () => {
			const table =
				convert( 'E = mc^2 \\tag{1}' ).querySelector( 'mtable' );
			expect( table?.getAttribute( 'width' ) ).toBe( '100%' );
			expect( table?.getAttribute( 'columnwidth' ) ).toBe(
				'50% auto 50%'
			);
			expect(
				Array.from( table?.querySelectorAll( 'mtd' ) ?? [], ( cell ) =>
					cell.textContent?.trim()
				)
			).toEqual( [ '', 'E=mc2', '(1)' ] );
		} );

		it( 'narrows the glue of multline', () => {
			expect(
				convert( '\\begin{multline} a + b \\\\ + c \\end{multline}' )
					.querySelector( 'mtable' )
					?.getAttribute( 'columnwidth' )
			).toBe( '7.5% auto 7.5%' );
		} );

		it( 'drops the placeholders of equation numbers', () => {
			const body = convert(
				'\\begin{gather} a \\tag{1} \\\\ b \\notag \\end{gather}'
			);
			expect( body.querySelector( 'span' ) ).toBeNull();
			expect(
				Array.from( body.querySelectorAll( 'mtr' ), ( row ) =>
					Array.from( row.children, ( cell ) => cell.innerHTML )
				)
			).toEqual( [
				[ '', '<mi>a</mi>', '<mtext>(1)</mtext>' ],
				[ '', '<mi>b</mi>', '' ],
			] );
		} );

		it( 'leaves no style behind', () => {
			for ( const latex of [
				'E = mc^2 \\tag{1}',
				'\\begin{equation} a = b \\end{equation}',
				'\\begin{gather} a \\tag{1} \\\\ b \\notag \\end{gather}',
				'\\begin{align} a &= b \\tag{x} \\\\ c &= d \\end{align}',
				'\\begin{multline} a + b \\\\ + c \\end{multline}',
				'\\begin{aligned} a &= b \\\\ c &= d \\end{aligned} \\tag{2}',
			] ) {
				const styled = convert( latex ).querySelector( '[style]' );
				expect( {
					latex,
					style: styled ? styled.getAttribute( 'style' ) : null,
				} ).toEqual( { latex, style: null } );
			}
		} );
	} );

	describe( 'column spacing', () => {
		/**
		 * The table of the converted LaTeX.
		 *
		 * @param {string} latex The source.
		 * @return {Element} The `mtable`.
		 */
		const table = ( latex ) => {
			const doc = document.implementation.createHTMLDocument( '' );
			doc.body.innerHTML = `<math>${ latexToMathML( latex ) }</math>`;
			const element = doc.querySelector( 'mtable' );
			if ( ! element ) {
				throw new Error( `No table in ${ latex }` );
			}
			return element;
		};
		/**
		 * The column spacing of a table. Not `toHaveAttribute`: to jest-dom a
		 * MathML element is no element.
		 *
		 * @param {Element} element The `mtable`.
		 * @return {string|null} The attribute.
		 */
		const spacing = ( element ) => element.getAttribute( 'columnspacing' );

		it( 'moves the space between the columns to the table', () => {
			expect(
				spacing( table( '\\begin{aligned} a &= b \\end{aligned}' ) )
			).toBe( '0em' );
			expect(
				spacing(
					table(
						'\\begin{cases} x & x > 0 \\\\ -x & x \\le 0 \\end{cases}'
					)
				)
			).toBe( '1em' );
			expect(
				spacing(
					table(
						'\\begin{pmatrix} a & b & c \\\\ d & e & f \\end{pmatrix}'
					)
				)
			).toBe( '0.8em' );
		} );

		it( 'puts the space between the pairs of aligned in the cells', () => {
			const aligned = table(
				'\\begin{aligned} a &= b & c &= d \\\\ e &= f & g &= h \\end{aligned}'
			);

			expect( spacing( aligned ) ).toBe( '0em' );
			for ( const row of aligned.querySelectorAll( 'mtr' ) ) {
				expect(
					Array.from( row.children, ( cell ) => {
						const first = cell.firstElementChild;
						return first?.localName === 'mspace'
							? first.getAttribute( 'width' )
							: null;
					} )
				).toEqual( [ null, null, '1em', null ] );
			}
		} );

		it( 'leaves no style on the cells', () => {
			for ( const latex of [
				'\\begin{aligned} a &= b & c &= d \\end{aligned}',
				'\\begin{cases} x & x > 0 \\end{cases}',
				'\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}',
				'\\substack{a \\\\ b}',
			] ) {
				const styled = table( latex ).querySelector( 'mtd[style]' );
				expect( {
					latex,
					style: styled ? styled.getAttribute( 'style' ) : null,
				} ).toEqual( { latex, style: null } );
			}
		} );
	} );
} );
