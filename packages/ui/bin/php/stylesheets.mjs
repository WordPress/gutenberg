/**
 * Compiling the package's stylesheets the way the React build does.
 */
import path from 'node:path';
import glob from 'fast-glob';
import { compileStyleFile } from '@wordpress/build/compile-style';

/**
 * Turns a stylesheet path into the key snapshot files name its classes by,
 * matching the path a React component imports it by.
 *
 * @example `src/button/style.module.css` → `button/style`
 *
 * @param {string} file Path relative to the package.
 * @return {string} Key.
 */
export function getStyleKey( file ) {
	return file.replace( /^src\//, '' ).replace( /\.module\.(css|scss)$/, '' );
}

/**
 * Compiles every CSS module in the package, with the same class names as the
 * React build.
 *
 * @param {string} packageDir The package directory.
 * @param {string} rootDir    The repository root.
 * @return {Promise<Map<string, {css: string, classNames: Object}>>} Compiled stylesheets, by key.
 */
export async function compileStylesheets( packageDir, rootDir ) {
	const stylesheets = new Map();
	const files = await glob( 'src/**/*.module.{css,scss}', {
		cwd: packageDir,
		ignore: [ '**/stories/**', '**/test/**' ],
	} );
	for ( const file of files.sort() ) {
		stylesheets.set(
			getStyleKey( file ),
			await compileStyleFile( path.join( packageDir, file ), {
				workingDir: packageDir,
				rootDir,
			} )
		);
	}
	return stylesheets;
}

/**
 * Lists the stylesheets whose classes rendered HTML uses.
 *
 * @param {string} html        Rendered HTML.
 * @param {Map}    stylesheets Compiled stylesheets, by key.
 * @return {string[]} Stylesheet keys.
 */
export function getUsedStylesheets( html, stylesheets ) {
	return [ ...stylesheets ]
		.filter( ( [ , { classNames } ] ) =>
			Object.values( classNames ?? {} ).some( ( className ) =>
				new RegExp( `[" ]${ className }[" ]` ).test( html )
			)
		)
		.map( ( [ key ] ) => key );
}
