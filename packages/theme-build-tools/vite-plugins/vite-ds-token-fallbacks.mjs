import { transformDsTokenFallbacks } from '../js-plugins/transform-ds-token-fallbacks.mjs';

/**
 * Vite plugin that injects design-system token fallbacks into JS/TS files.
 *
 * Replaces bare `var(--wpds-*)` references in string literals with
 * `var(--wpds-*, <fallback>)` so components render correctly without
 * a ThemeProvider.
 *
 * @type {() => import('vite').Plugin}
 */
const plugin = () => ( {
	name: 'ds-token-fallbacks-js',
	enforce: 'pre',
	transform( code, id ) {
		const [ filename, query = '' ] = id.split( '?' );
		const params = new URLSearchParams( query );
		if (
			! /\.[mc]?[jt]sx?$/.test( filename ) ||
			params.has( 'raw' ) ||
			params.has( 'url' )
		) {
			return null;
		}
		if ( id.includes( 'node_modules' ) ) {
			return null;
		}
		const result = transformDsTokenFallbacks( code, filename );
		return result ? { code: result.code, map: result.map } : null;
	},
} );

export default plugin;
