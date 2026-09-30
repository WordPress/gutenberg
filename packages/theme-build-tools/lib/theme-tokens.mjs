/**
 * Import the default export of an `@wordpress/theme` entrypoint, or return
 * `undefined` when `@wordpress/theme` is not installed or is too old to
 * provide the entrypoint.
 *
 * `@wordpress/theme` is an optional peer dependency: the plugins use the token
 * data of the version installed in the project, and do nothing without it.
 *
 * @template T
 * @param {() => Promise<{ default: T }>} importModule Imports the entrypoint.
 * @return {Promise<T | undefined>} The default export, or `undefined`.
 */
async function importOptional( importModule ) {
	try {
		return ( await importModule() ).default;
	} catch ( error ) {
		const code = /** @type {{ code?: string }} */ ( error )?.code;
		if (
			code === 'ERR_MODULE_NOT_FOUND' ||
			code === 'ERR_PACKAGE_PATH_NOT_EXPORTED'
		) {
			return undefined;
		}
		throw error;
	}
}

/**
 * Map of design token names to their generated fallback values, or
 * `undefined` when `@wordpress/theme` is unavailable.
 *
 * @type {Record<string, string> | undefined}
 */
export const tokenFallbacks = await importOptional(
	() => import( '@wordpress/theme/design-token-fallbacks.js' )
);

/**
 * List of design token names, or `undefined` when `@wordpress/theme` is
 * unavailable.
 *
 * @type {string[] | undefined}
 */
export const tokenList = await importOptional(
	() => import( '@wordpress/theme/design-tokens.js' )
);
