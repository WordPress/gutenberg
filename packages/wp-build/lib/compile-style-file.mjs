import { compileCss } from './compile-inline-style.mjs';
import {
	compileStylesheet,
	disposeSassCompiler,
	getSassOptions,
} from './sass-compiler.mjs';

export { compileCss, disposeSassCompiler };

/**
 * Compile a stylesheet file exactly as wp-build compiles it when a package
 * imports it, and return the CSS and class names as data.
 *
 * Lets a package emit its styles in another form, such as a static stylesheet
 * for server-rendered markup, with class names identical to the ones the
 * JavaScript build injects at runtime. Sass files start the shared Sass
 * compiler, so call `disposeSassCompiler()` when done.
 *
 * @param {string}  filePath              Absolute path to a `.css` or `.scss` file.
 * @param {Object}  options
 * @param {string}  options.workingDir    Directory of the package that owns the file.
 * @param {string}  [options.rootDir]     The repository root. Defaults to the current directory.
 * @param {boolean} [options.cssModules]  Whether to scope class names as CSS Modules. Defaults to true for `.module.*` files.
 * @param {boolean} [options.minify=true] Whether to minify the CSS.
 * @return {Promise<{css: string, classNames: Record<string, string>|null}>} Compiled CSS and class name map.
 */
export async function compileStyleFile(
	filePath,
	{
		workingDir,
		rootDir,
		cssModules = /\.module\.(css|scss)$/.test( filePath ),
		minify = true,
	}
) {
	const cssText = await compileStylesheet( filePath, {
		...getSassOptions( workingDir, rootDir ),
		style: 'expanded',
	} );

	return compileCss( cssText, filePath, { cssModules, minify } );
}
