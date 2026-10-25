/**
 * Token data from the installed `@wordpress/theme`.
 *
 * The plugins do nothing when `@wordpress/theme` cannot be loaded.
 */

import { createRequire } from 'node:module';

/**
 * @typedef {Object} DesignTokensModule
 * @property {Record<string, { fallback: string }>} tokens Token metadata, keyed by CSS custom property name.
 */

/**
 * Load `@wordpress/theme/design-tokens.js`, or return `undefined` when it
 * cannot be loaded.
 *
 * This loads the module synchronously, without a top-level `await`, so that
 * CommonJS consumers can still `require()` the plugins.
 *
 * @return {DesignTokensModule | undefined} The module, or `undefined`.
 */
function loadDesignTokens() {
	try {
		return createRequire( import.meta.url )(
			'@wordpress/theme/design-tokens.js'
		);
	} catch {
		return undefined;
	}
}

const designTokens = loadDesignTokens();

/**
 * Map of design token names to their generated fallback values, or
 * `undefined` when `@wordpress/theme` is unavailable.
 *
 * @type {Record<string, string> | undefined}
 */
export const tokenFallbacks = designTokens
	? Object.fromEntries(
			Object.entries( designTokens.tokens ).map( ( [ name, token ] ) => [
				name,
				token.fallback,
			] )
		)
	: undefined;

/**
 * List of design token names, or `undefined` when `@wordpress/theme` is
 * unavailable.
 *
 * @type {string[] | undefined}
 */
export const tokenList = designTokens
	? Object.keys( designTokens.tokens )
	: undefined;
