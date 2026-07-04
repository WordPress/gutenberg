import tokenFallbacks from '../prebuilt/js/design-token-fallbacks.mjs';
import { addFallbackToVar as _addFallbackToVar } from './add-fallback-to-var.mjs';

/**
 * Replace bare `var(--wpds-*)` references in a CSS value string with
 * `var(--wpds-*, <fallback>)` using the package's generated token
 * fallback map.
 *
 * Existing fallbacks (i.e. var() calls that already contain a comma) are
 * left untouched, making the function safe to run multiple times.
 *
 * This is a thin wrapper around the generic `addFallbackToVar` helper in
 * `./add-fallback-to-var.mjs`, prebound to the package's token fallback
 * map. Update the regex/replacement logic in that file, not here.
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
export function addFallbackToVar( cssValue, options ) {
	return _addFallbackToVar( cssValue, tokenFallbacks, options );
}
