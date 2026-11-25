import { readFile } from 'fs/promises';
import { initAsyncCompiler } from 'sass-embedded';

/** @type {Promise<import('sass-embedded').AsyncCompiler> | undefined} */
let compilerPromise;

/**
 * Stop the shared Sass compiler, if it was started. Its process keeps Node
 * running until it is stopped.
 *
 * @return {Promise<void>}
 */
export async function disposeSassCompiler() {
	if ( ! compilerPromise ) {
		return;
	}
	const compiler = await compilerPromise;
	compilerPromise = undefined;
	await compiler.dispose();
}

/**
 * Compile a stylesheet to CSS. Plain CSS files are returned as they are.
 *
 * @param {string}                                   filePath    Absolute path of the stylesheet.
 * @param {import('sass-embedded').Options<'async'>} sassOptions Sass options.
 * @return {Promise<string>} The CSS.
 */
export async function compileStylesheet( filePath, sassOptions ) {
	if ( filePath.endsWith( '.css' ) ) {
		return readFile( filePath, 'utf8' );
	}

	compilerPromise ??= initAsyncCompiler();
	const compiler = await compilerPromise;
	const { css } = await compiler.compileAsync( filePath, {
		...sassOptions,
		sourceMap: false,
	} );
	return css;
}
