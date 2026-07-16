import { addFallbackToVar } from '../postcss-plugins/ds-token-fallbacks.mjs';

/**
 * Lightning CSS visitor that injects design-system token fallbacks into CSS.
 *
 * Replaces bare `var(--wpds-*)` references with `var(--wpds-*, <fallback>)`
 * so components render correctly without a ThemeProvider.
 *
 * Existing fallbacks are left untouched. Unknown tokens throw.
 *
 * Compose with other visitors via `composeVisitors` from `lightningcss`:
 *
 * ```js
 * import { transform, composeVisitors } from 'lightningcss';
 * import dsTokenFallbacks from '@wordpress/theme/lightningcss-plugins/lightningcss-ds-token-fallbacks';
 *
 * transform( {
 *   code,
 *   visitor: composeVisitors( [ dsTokenFallbacks ] ),
 * } );
 * ```
 *
 * @type {import('lightningcss').Visitor<never>}
 */
const plugin = {
	/** @param {import('lightningcss').Variable} variable */
	Variable( variable ) {
		// Leave existing fallbacks alone (idempotent).
		if ( variable.fallback?.length ) {
			return;
		}

		const tokenName = variable.name.ident;
		if ( ! tokenName.startsWith( '--wpds-' ) ) {
			return;
		}

		// Reuse the shared helper so unknown tokens throw the same error
		// message as the PostCSS / esbuild / Vite plugins.
		return {
			raw: addFallbackToVar( `var(${ tokenName })` ),
		};
	},
};

export default plugin;
