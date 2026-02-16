import _tokenFallbacks from '../prebuilt/js/design-token-fallbacks.mjs';

/** @type {Record<string, string>} */
const tokenFallbacks = _tokenFallbacks;

/**
 * Replace bare `var(--wpds-*)` references in a CSS value string with
 * `var(--wpds-*, <fallback>)` using the generated token fallback map.
 *
 * Existing fallbacks (i.e. var() calls that already contain a comma) are
 * left untouched, making the function safe to run multiple times.
 *
 * @param {string} cssValue A CSS declaration value.
 * @return {string} The value with fallbacks injected.
 */
export function addFallbackToVar( cssValue ) {
	return cssValue.replace(
		/var\(\s*(--wpds-[\w-]+)\s*\)/g,
		( match, tokenName ) => {
			const fallback = tokenFallbacks[ tokenName ];
			return fallback !== undefined
				? `var(${ tokenName }, ${ fallback })`
				: match;
		}
	);
}
