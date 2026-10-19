/**
 * Token data from the installed `@wordpress/theme`.
 *
 * `@wordpress/theme` is an optional peer dependency: the plugins use the token
 * data of the version installed in the project, and do nothing without it.
 * Versions of `@wordpress/theme` without the `tokens` export only provide the
 * token names, so the fallback plugins do nothing with them either.
 */

import { createRequire } from 'node:module';

/**
 * @typedef {Object} DesignTokensModule
 * @property {Record<string, { fallback: string }>} [tokens] Token metadata, keyed by CSS custom property name.
 * @property {string[]}                             default  Token names.
 */

/**
 * Load `@wordpress/theme/design-tokens.js`, or return `undefined` when
 * `@wordpress/theme` is not installed.
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
	} catch ( error ) {
		const { code, message } =
			/** @type {{ code?: string, message?: string }} */ ( error );
		const isThemeMissing =
			( code === 'MODULE_NOT_FOUND' ||
				code === 'ERR_MODULE_NOT_FOUND' ) &&
			message?.includes( '@wordpress/theme' );
		if ( isThemeMissing || code === 'ERR_PACKAGE_PATH_NOT_EXPORTED' ) {
			return undefined;
		}
		throw error;
	}
}

const designTokens = loadDesignTokens();

/**
 * Map of design token names to their generated fallback values, or
 * `undefined` when `@wordpress/theme` does not provide them.
 *
 * @type {Record<string, string> | undefined}
 */
export const tokenFallbacks = designTokens?.tokens
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
export const tokenList = designTokens?.tokens
	? Object.keys( designTokens.tokens )
	: designTokens?.default;
