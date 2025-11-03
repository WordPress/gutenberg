/**
 * External dependencies
 */
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
	return doc.body.querySelector( 'math' )?.innerHTML ?? '';
}
