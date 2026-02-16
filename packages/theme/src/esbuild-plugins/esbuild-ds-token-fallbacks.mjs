import { readFile } from 'fs/promises';
import { addFallbackToVar } from '../postcss-plugins/ds-token-fallbacks.mjs';

const LOADER_MAP = {
	'.js': 'jsx',
	'.jsx': 'jsx',
	'.ts': 'tsx',
	'.tsx': 'tsx',
	'.mjs': 'jsx',
	'.mts': 'tsx',
	'.cjs': 'jsx',
	'.cts': 'tsx',
};

/**
 * esbuild plugin that injects design-system token fallbacks into JS/TS files.
 *
 * Replaces bare `var(--wpds-*)` references in string literals with
 * `var(--wpds-*, <fallback>)` so components render correctly without
 * a ThemeProvider.
 */
const plugin = {
	name: 'ds-token-fallbacks-js',
	setup( build ) {
		build.onLoad( { filter: /\.[mc]?[jt]sx?$/ }, async ( args ) => {
			// Skip node_modules.
			if ( args.path.includes( 'node_modules' ) ) {
				return undefined;
			}

			const source = await readFile( args.path, 'utf8' );

			if ( ! source.includes( '--wpds-' ) ) {
				return undefined;
			}

			const ext = args.path.match( /(\.[^.]+)$/ )?.[ 1 ] || '.js';

			return {
				contents: addFallbackToVar( source ),
				loader: LOADER_MAP[ ext ] || 'jsx',
			};
		} );
	},
};

export default plugin;
