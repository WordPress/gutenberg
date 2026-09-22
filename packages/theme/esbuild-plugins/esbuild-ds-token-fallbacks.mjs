import { readFile } from 'fs/promises';
import { transformDsTokenFallbacks } from '../js-plugins/transform-ds-token-fallbacks.mjs';

/** @type {Record<string, import('esbuild').Loader>} */
const LOADER_MAP = {
	'.js': 'jsx',
	'.jsx': 'jsx',
	'.ts': 'ts',
	'.tsx': 'tsx',
	'.mjs': 'jsx',
	'.mts': 'ts',
	'.cjs': 'jsx',
	'.cts': 'ts',
};

/**
 * esbuild plugin that injects design-system token fallbacks into JS/TS files.
 *
 * Replaces bare `var(--wpds-*)` references in string literals with
 * `var(--wpds-*, <fallback>)` so components render correctly without
 * a ThemeProvider.
 *
 * @type {import('esbuild').Plugin}
 */
const plugin = {
	name: 'ds-token-fallbacks-js',
	setup( build ) {
		build.onLoad( { filter: /\.[mc]?[jt]sx?$/, namespace: 'file' }, async ( args ) => {
			// Skip node_modules.
			if ( args.path.includes( 'node_modules' ) ) {
				return undefined;
			}

			const source = await readFile( args.path, 'utf8' );

			if ( ! source.includes( '--wpds-' ) ) {
				return undefined;
			}

			const ext = args.path.match( /(\.[^.]+)$/ )?.[ 1 ] || '.js';
			const result = transformDsTokenFallbacks( source, args.path );
			if ( ! result ) {
				return undefined;
			}

			return {
				contents: `${ result.code }\n//# sourceMappingURL=${ result.map.toUrl() }`,
				loader: LOADER_MAP[ ext ] || 'jsx',
			};
		} );
	},
};

export default plugin;
