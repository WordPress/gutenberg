import { readFile } from 'fs/promises';
import { fileURLToPath, pathToFileURL } from 'url';
import remapping from '@jridgewell/remapping';
import { AnyMap } from '@jridgewell/trace-mapping';
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
		build.onLoad(
			{ filter: /\.[mc]?[jt]sx?$/, namespace: 'file' },
			async ( args ) => {
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
					return {
						contents: source,
						loader: LOADER_MAP[ ext ] || 'jsx',
					};
				}
				let sourceMap = result.map.toUrl();
				/** @type {string[]} */
				const watchFiles = [];
				/** @type {import('esbuild').PartialMessage[]} */
				const warnings = [];
				if ( result.sourceMappingURL ) {
					try {
						const url = new URL(
							result.sourceMappingURL,
							pathToFileURL( args.path )
						);
						/** @type {string | undefined} */
						let inputMap;
						let mapPath = args.path;
						if ( url.protocol === 'data:' ) {
							const comma = url.href.indexOf( ',' );
							const data = decodeURIComponent(
								url.href.slice( comma + 1 )
							);
							inputMap = url.href
								.slice( 0, comma )
								.endsWith( ';base64' )
								? Buffer.from( data, 'base64' ).toString(
										'utf8'
									)
								: data;
						} else if ( url.protocol === 'file:' ) {
							mapPath = fileURLToPath( url );
							watchFiles.push( mapPath );
							inputMap = await readFile( url, 'utf8' );
						}
						// Like esbuild, do not fetch remote source-map URLs.
						if ( inputMap !== undefined ) {
							const map = remapping(
								[
									result.map.toString(),
									new AnyMap(
										inputMap,
										pathToFileURL( mapPath ).href
									),
								],
								() => null
							);
							sourceMap = `data:application/json;base64,${ Buffer.from( map.toString() ).toString( 'base64' ) }`;
						}
					} catch ( error ) {
						// esbuild ignores missing maps and warns for malformed maps.
						if ( ! (
							error &&
							typeof error === 'object' &&
							'code' in error &&
							error.code === 'ENOENT'
						) ) {
							warnings.push( {
								text: `Could not load the input source map: ${ error instanceof Error ? error.message : String( error ) }`,
								detail: error,
							} );
						}
					}
				}

				return {
					contents: `${ result.code }\n//# sourceMappingURL=${ sourceMap }`,
					loader: LOADER_MAP[ ext ] || 'jsx',
					watchFiles,
					warnings,
				};
			}
		);
	},
};

export default plugin;
