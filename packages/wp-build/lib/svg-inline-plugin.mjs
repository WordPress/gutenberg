/**
 * External dependencies
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Creates an esbuild plugin that inlines imported SVG files into the bundle.
 *
 * The default export of an imported `.svg` file is a `data:` URI, so it can be
 * used directly as an `<img src>` or CSS `url()` without any extra file to ship
 * or public path to configure. The SVG travels with the JavaScript, so it also
 * works in transpiled packages published to npm.
 *
 * @return {Object} esbuild plugin.
 */
export function svgInlinePlugin() {
	return {
		name: 'svg-inline',
		setup( build ) {
			// Only relative imports are handled; package imports are left alone.
			build.onResolve( { filter: /^\..*\.svg$/ }, ( args ) => ( {
				path: path.resolve( args.resolveDir, args.path ),
				namespace: 'svg-inline',
			} ) );

			build.onLoad(
				{ filter: /.*/, namespace: 'svg-inline' },
				async ( args ) => {
					const svg = await readFile( args.path, 'utf8' );
					const uri = `data:image/svg+xml,${ encodeURIComponent(
						svg.trim()
					) }`;
					return {
						contents: `export default ${ JSON.stringify( uri ) };`,
						loader: 'js',
					};
				}
			);
		},
	};
}
