/**
 * Escapes text for use as the content of a MathML element.
 *
 * Every `&` is escaped, unlike `escapeHTML` from `@wordpress/escape-html`,
 * which leaves an `&` that already looks like an entity untouched. LaTeX
 * containing a literal `&amp;` must round-trip unchanged.
 *
 * @param {string} text Text to escape.
 * @return {string} Escaped text.
 */
function escapeText( text ) {
	return text
		.replace( /&/g, '&amp;' )
		.replace( /</g, '&lt;' )
		.replace( />/g, '&gt;' );
}

/**
 * Returns MathML that carries only the LaTeX source, for content that has
 * no rendered presentation yet: input that failed to parse, or input typed
 * before the converter loaded.
 *
 * With the annotation as the only child of `<semantics>`, browsers display
 * the source text, so the formula is never silently blank.
 *
 * @param {string} latex The LaTeX source.
 * @return {string} The inner content of a `<math>` element.
 */
export function getSourceOnlyMathML( latex ) {
	return `<semantics><annotation encoding="application/x-tex">${ escapeText(
		latex
	) }</annotation></semantics>`;
}
