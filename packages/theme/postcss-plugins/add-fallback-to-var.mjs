import valueParser from 'postcss-value-parser';
import { parseCSSVariableReferences } from './parse-css-variables.mjs';

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
			const fallback = getTokenFallback( tokenName, tokenFallbacks, {
				escapeQuotes,
			} );
			return `var(${ tokenName }, ${ fallback })`;
		}
	);
}

/**
 * Replace bare `var(--wpds-*)` references in a parsed CSS value.
 *
 * @param {string}                 cssValue       A CSS declaration value.
 * @param {Record<string, string>} tokenFallbacks Map of CSS variable names to fallback expressions.
 * @return {string} The value with fallbacks injected.
 */
export function addFallbackToVarInCSS( cssValue, tokenFallbacks ) {
	const { parsed, references } = parseCSSVariableReferences( cssValue );

	for ( const reference of references ) {
		if (
			! reference.name.startsWith( '--wpds-' ) ||
			reference.fallbackSeparator
		) {
			continue;
		}

		const fallback = getTokenFallback( reference.name, tokenFallbacks );
		reference.node.nodes.push( ...valueParser( `, ${ fallback }` ).nodes );
	}

	return parsed.toString();
}

/**
 * Get the fallback for a design token.
 *
 * @param {string}                 tokenName              CSS variable name.
 * @param {Record<string, string>} tokenFallbacks         Map of CSS variable names to fallback expressions.
 * @param {Object}                 [options]              Options.
 * @param {boolean}                [options.escapeQuotes] Whether to escape quotes in the fallback.
 * @return {string} The token fallback.
 */
export function getTokenFallback(
	tokenName,
	tokenFallbacks,
	{ escapeQuotes = false } = {}
) {
	let fallback = tokenFallbacks[ tokenName ];
	if ( fallback === undefined ) {
		throw new Error(
			`Unknown design token: ${ tokenName }. ` +
				'This token is not in the design system. ' +
				'If this token was recently renamed, update all references to use the new name.'
		);
	}
	if ( escapeQuotes ) {
		fallback = fallback.replaceAll( '"', '\\"' ).replaceAll( "'", "\\'" );
	}
	return fallback;
}
