/**
 * External dependencies
 */
const { promisify } = require( 'util' );
const fs = require( 'fs' );
const path = require( 'path' );
const esbuild = require( 'esbuild' );
const makeDir = require( 'make-dir' );

/**
 * Path to packages directory.
 *
 * @type {string}
 */
const PACKAGES_DIR = path
	.resolve( __dirname, '../../packages' )
	.replace( /\\/g, '/' );

/**
 * Promisified fs.writeFile.
 *
 * @type {Function}
 */
const writeFile = promisify( fs.writeFile );

/**
 * Get the package name for a specified file
 *
 * @param {string} file File name.
 *
 * @return {string} Package name.
 */
function getPackageName( file ) {
	return path.relative( PACKAGES_DIR, file ).split( path.sep )[ 0 ];
}

/**
 * Get Build Path for a specified file.
 *
 * @param {string} file        File to build.
 * @param {string} buildFolder Output folder.
 *
 * @return {string} Build path.
 */
function getBuildPath( file, buildFolder ) {
	const pkgName = getPackageName( file );
	const pkgSrcPath = path.resolve( PACKAGES_DIR, pkgName, 'src' );
	const pkgBuildPath = path.resolve( PACKAGES_DIR, pkgName, buildFolder );
	const relativeToSrcPath = path.relative( pkgSrcPath, file );
	return path.resolve( pkgBuildPath, relativeToSrcPath );
}

/**
 * Build a JavaScript/TypeScript file using esbuild.
 *
 * @param {string} file File to build.
 */
async function buildJS( file ) {
	// Build for CommonJS (main)
	const destPathCJS = getBuildPath(
		file.replace( /\.tsx?$/, '.js' ),
		'build'
	);

	// Build for ESM (module)
	const destPathESM = getBuildPath(
		file.replace( /\.tsx?$/, '.js' ),
		'build-module'
	);

	// Create output directories
	await Promise.all( [
		makeDir( path.dirname( destPathCJS ) ),
		makeDir( path.dirname( destPathESM ) ),
	] );

	// Get target from browserslist config
	const { default: browserslistToEsbuild } = await import(
		// eslint-disable-next-line import/no-unresolved
		'browserslist-to-esbuild'
	);
	const target = browserslistToEsbuild();

	// Build both CJS and ESM in parallel
	const [ resultCJS, resultESM ] = await Promise.all( [
		esbuild.build( {
			entryPoints: [ file ],
			outfile: destPathCJS,
			bundle: false,
			platform: 'node',
			format: 'cjs',
			sourcemap: true,
			target,
			write: false,
		} ),
		esbuild.build( {
			entryPoints: [ file ],
			outfile: destPathESM,
			bundle: false,
			platform: 'neutral',
			format: 'esm',
			sourcemap: true,
			target,
			write: false,
		} ),
	] );

	// Write CJS output
	await Promise.all( [
		writeFile( destPathCJS, resultCJS.outputFiles[ 1 ].text ),
		writeFile( destPathCJS + '.map', resultCJS.outputFiles[ 0 ].text ),
	] );

	// Write ESM output
	await Promise.all( [
		writeFile( destPathESM, resultESM.outputFiles[ 1 ].text ),
		writeFile( destPathESM + '.map', resultESM.outputFiles[ 0 ].text ),
	] );
}

module.exports = buildJS;
