import temml from 'temml';

/**
 * Options for LaTeX to MathML conversion.
 */
export interface LatexToMathMLOptions {
	/**
	 * Whether to render in display mode (block) or inline mode.
	 * @default true
	 */
	displayMode?: boolean;
}

/**
 * Converts LaTeX math syntax to MathML.
 *
 * @param latex               - The LaTeX string to convert.
 * @param options             - Conversion options.
 * @param options.displayMode
 * @return The MathML string.
 * @throws Will throw an error if the LaTeX is invalid.
 *
 * @example
 * ```js
 * import latexToMathML from '@wordpress/latex-to-mathml';
 *
 * const mathML = latexToMathML( 'x^2', { displayMode: false } );
 * ```
 */
export default function latexToMathML(
	latex: string,
	{ displayMode = true }: LatexToMathMLOptions = {}
): string {
	const mathML = temml.renderToString( latex, {
		displayMode,
		annotate: true,
		throwOnError: true,
	} );
	const doc = document.implementation.createHTMLDocument( '' );
	doc.body.innerHTML = mathML;
	const math = doc.body.querySelector( 'math' );
	if ( ! math ) {
		return '';
	}

	// temml marks the cells of `aligned`, `cases` and tagged equations with
	// classes for its own stylesheet. Write the MathML `columnalign`
	// attribute on the cell as well, so the alignment is part of the content:
	// Firefox and Safari honor it natively, and the polyfill in `style.scss`
	// covers Chromium, which implements MathML Core only.
	for ( const cell of math.querySelectorAll(
		'mtd.tml-right, mtd.tml-left'
	) ) {
		cell.setAttribute(
			'columnalign',
			cell.classList.contains( 'tml-right' ) ? 'right' : 'left'
		);
	}

	return math.innerHTML;
}
