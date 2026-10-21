import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { initAsyncCompiler } from 'sass-embedded';

/** @type {Promise<import('sass-embedded').AsyncCompiler> | undefined} */
let compiler;

/**
 * Get the Sass compiler shared by every esbuild build in this process,
 * starting it on first use.
 *
 * @return {Promise<import('sass-embedded').AsyncCompiler>} Sass compiler.
 */
function getCompiler() {
	if ( ! compiler ) {
		compiler = initAsyncCompiler();
	}
	return compiler;
}

/**
 * Stop the shared Sass compiler, if it was started. Its child process keeps
 * the Node.js process running until it stops.
 *
 * @return {Promise<void>}
 */
export async function disposeSassCompiler() {
	if ( ! compiler ) {
		return;
	}
	const started = compiler;
	compiler = undefined;
	await ( await started ).dispose();
}

/**
 * Create an esbuild plugin that compiles Sass files with the shared compiler,
 * reads plain CSS files as they are, and passes the CSS to `transform`.
 *
 * Options other than `filter`, `transform` and `loader` are passed to the Sass
 * `compileAsync()` call.
 *
 * @param {Object}                                                                       options
 * @param {RegExp}                                                                       options.filter    Paths to load.
 * @param {(css: string, dirname: string, filePath: string) => string | Promise<string>} options.transform Returns the module contents.
 * @param {import('esbuild').Loader}                                                     options.loader    esbuild loader for the module contents.
 * @return {import('esbuild').Plugin} esbuild plugin.
 */
export function sassPlugin( { filter, transform, loader, ...sassOptions } ) {
	return {
		name: 'wp-build-sass',
		setup( build ) {
			build.onLoad( { filter }, async ( { path: filePath } ) => {
				let css;
				if ( filePath.endsWith( '.css' ) ) {
					css = await readFile( filePath, 'utf8' );
				} else {
					const sass = await getCompiler();
					( { css } = await sass.compileAsync(
						filePath,
						sassOptions
					) );
				}

				return {
					contents: await transform(
						css,
						path.dirname( filePath ),
						filePath
					),
					loader,
				};
			} );
		},
	};
}
