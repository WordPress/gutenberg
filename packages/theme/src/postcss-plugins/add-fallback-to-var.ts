/**
 * Replace bare `var(--wpds-*)` references in a CSS value string with
 * `var(--wpds-*, <fallback>)` using the provided token fallback map.
 *
 * Existing fallbacks (i.e. `var()` calls that already contain a comma)
 * are left untouched, making the function safe to run multiple times
 * (idempotent).
 *
 * NOTE: The regex and replacement logic here is mirrored in
 * `ds-token-fallbacks.mjs`. If you update one, update the other to match.
 *
 * @param cssValue             A CSS declaration value.
 * @param tokenFallbacks       Map of CSS variable names to their fallback expressions.
 * @param options              Options.
 * @param options.escapeQuotes When true, escape `"` and `'` in fallback values.
 *                             Use this when the input is JS/TS source so that
 *                             injected quotes don't break string literals.
 * @return                     The value with fallbacks injected.
 */
export function addFallbackToVar(
	cssValue: string,
	tokenFallbacks: Record< string, string >,
	{ escapeQuotes = false }: { escapeQuotes?: boolean } = {}
): string {
	return cssValue.replace(
		/var\(\s*(--wpds-[\w-]+)\s*\)/g,
		( match, tokenName: string ) => {
			let fallback = tokenFallbacks[ tokenName ];
			if ( fallback === undefined ) {
				return match;
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
