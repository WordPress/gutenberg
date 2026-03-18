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
 * NOTE: The regex and replacement logic here mirrors `add-fallback-to-var.ts`.
 * If you update one, update the other to match.
 *
 * @param {string}  cssValue               A CSS declaration value.
 * @param {Object}  [options]              Options.
 * @param {boolean} [options.escapeQuotes] When true, escape `"` and `'` in
 *                                         fallback values. Use this when the
 *                                         input is JS/TS source so that
 *                                         injected quotes don't break string
 *                                         literals. JS will unescape them at
 *                                         parse time, so the browser's CSS
 *                                         engine still sees the correct value.
 * @return {string}                        The value with fallbacks injected.
 */
export function addFallbackToVar( cssValue, { escapeQuotes = false } = {} ) {
	return cssValue.replace(
		/var\(\s*(--wpds-[\w-]+)\s*\)/g,
		( match, tokenName ) => {
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
