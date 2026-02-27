import { addFallbackToVar } from '../postcss-plugins/ds-token-fallbacks.mjs';

/**
 * Vite plugin that injects design-system token fallbacks into JS/TS files.
 *
 * Replaces bare `var(--wpds-*)` references in string literals with
 * `var(--wpds-*, <fallback>)` so components render correctly without
 * a ThemeProvider.
 */
const plugin = () => ( {
	name: 'ds-token-fallbacks-js',
	transform( code, id ) {
		if ( ! /\.[mc]?[jt]sx?$/.test( id ) ) {
			return null;
		}
		if ( id.includes( 'node_modules' ) ) {
			return null;
		}
		if ( ! code.includes( '--wpds-' ) ) {
			return null;
		}
		// Sourcemap omitted: replacements are small, inline substitutions
		// that preserve line structure, so the debugging impact is negligible.
		return { code: addFallbackToVar( code ), map: null };
	},
} );

export default plugin;
