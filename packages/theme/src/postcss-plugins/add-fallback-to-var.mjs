/**
 * Replace bare `var(--wpds-*)` references in a CSS value string with
 * `var(--wpds-*, <fallback>)` using the provided token fallback map.
 *
 * Existing fallbacks (i.e. `var()` calls that already contain a comma)
 * are left untouched, making the function safe to run multiple times
 * (idempotent).
 *
 * This is the generic, reusable implementation that takes the fallback
 * map as an argument. For the variant prebound with the package's
 * generated token fallback map, see `./ds-token-fallbacks.mjs`.
 *
 * @param {string}                 cssValue               A CSS declaration value.
 * @param {Record<string, string>} tokenFallbacks         Map of CSS variable names to their fallback expressions.
 * @param {Object}                 [options]              Options.
 * @param {boolean}                [options.escapeQuotes] When true, escape `"` and `'` in fallback values.
 *                                                        Use this when the input is JS/TS source so that
 *                                                        injected quotes don't break string literals. JS
 *                                                        will unescape them at parse time, so the browser's
 *                                                        CSS engine still sees the correct value.
 * @return {string} The value with fallbacks injected.
 */
export function addFallbackToVar(
	cssValue,
	tokenFallbacks,
	{ escapeQuotes = false } = {}
) {
	return cssValue.replace(
		/var\(\s*(--wpds-[\w-]+)\s*\)/g,
		( match, tokenName ) => {
			let fallback = tokenFallbacks[ tokenName ];
			if ( fallback === undefined ) {
				throw new Error(
					`Unknown design token: ${ tokenName }. ` +
						'This token is not in the design system. ' +
						'If this token was recently renamed, update all references to use the new name.'
				);
			}
			if ( escapeQuotes ) {
				fallback = fallback
					.replaceAll( '"', '\\"' )
					.replaceAll( "'", "\\'" );
			}
			return `var(${ tokenName }, ${ fallback })`;
		}
	);
}
