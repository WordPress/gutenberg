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
 * @param cssValue       A CSS declaration value.
 * @param tokenFallbacks Map of CSS variable names to their fallback expressions.
 * @return The value with fallbacks injected.
 */
export function addFallbackToVar(
	cssValue: string,
	tokenFallbacks: Record< string, string >
): string {
	return cssValue.replace(
		/var\(\s*(--wpds-[\w-]+)\s*\)/g,
		( match, tokenName: string ) => {
			const fallback = tokenFallbacks[ tokenName ];
			return fallback !== undefined
				? `var(${ tokenName }, ${ fallback })`
				: match;
		}
	);
}
