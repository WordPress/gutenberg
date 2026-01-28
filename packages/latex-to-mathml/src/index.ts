/**
 * External dependencies
 */
import temml from 'temml';
// @ts-ignore - auto-render module doesn't have TypeScript definitions
import renderMathInElement from 'temml/contrib/auto-render/auto-render.js';

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
 * Options for rendering math in HTML strings.
 */
export interface RenderMathInHTMLOptions {
	/**
	 * Array of tag names to skip when searching for math delimiters.
	 * Defaults to ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option'].
	 */
	ignoredTags?: string[];
	/**
	 * Array of class names. Elements with these classes will be skipped.
	 */
	ignoredClasses?: string[];
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

/**
 * Renders LaTeX math delimiters in an HTML string to MathML.
 *
 * Supports the following delimiter patterns:
 * - `$...$` for inline math
 * - `$$...$$` for display math
 * - `\(...\)` for inline math
 * - `\[...\]` for display math
 *
 * Content inside <code>, <pre>, <script>, <style>, and <textarea> tags
 * is automatically skipped.
 *
 * @param html    - The HTML string containing LaTeX math delimiters.
 * @param options - Options for controlling which elements to skip.
 * @return The HTML string with math delimiters replaced by MathML.
 *
 * @example
 * ```js
 * import { renderMathInHTML } from '@wordpress/latex-to-mathml';
 *
 * const html = renderMathInHTML( '<p>The formula $x^2$ is important.</p>' );
 * // Returns HTML with <math> elements instead of $...$ delimiters
 * ```
 */
export function renderMathInHTML(
	html: string,
	options: RenderMathInHTMLOptions = {}
): string {
	const doc = document.implementation.createHTMLDocument( '' );
	doc.body.innerHTML = html;

	renderMathInElement( doc.body, {
		delimiters: [
			{ left: '$$', right: '$$', display: true },
			{ left: '\\[', right: '\\]', display: true },
			{ left: '\\(', right: '\\)', display: false },
			{ left: '$', right: '$', display: false },
		],
		// Include LaTeX source as annotation for block transforms to extract
		annotate: true,
		throwOnError: false,
		errorCallback: () => {},
		...options,
	} );

	return doc.body.innerHTML;
}
