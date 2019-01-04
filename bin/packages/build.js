/**
 * script to build WordPress packages into `build/` directory.
 *
 * Example:
 *  node ./scripts/build.js
 */

/**
 * External dependencies
 */
const { promisify } = require( 'util' );
const fs = require( 'fs' );
const path = require( 'path' );
let glob = require( 'glob' );
const babel = require( '@babel/core' );
const chalk = require( 'chalk' );
let mkdirp = require( 'mkdirp' );
const sass = require( 'node-sass' );
const postcss = require( 'postcss' );

/**
 * Internal dependencies
 */
const getPackages = require( './get-packages' );
const getBabelConfig = require( './get-babel-config' );

/**
 * Module Constants
 */
const PACKAGES_DIR = path.resolve( __dirname, '../../packages' );
const SRC_DIR = 'src';
const BUILD_DIR = {
	main: 'build',
	module: 'build-module',
	style: 'build-style',
};
const DONE = chalk.reset.inverse.bold.green( ' DONE ' );

// Promisification
const readFile = promisify( fs.readFile );
const writeFile = promisify( fs.writeFile );
const transformFile = promisify( babel.transformFile );
const renderSass = promisify( sass.render );
glob = promisify( glob );
mkdirp = promisify( mkdirp );

/**
 * Get the package name for a specified file
 *
 * @param  {string} file File name
 * @return {string}      Package name
 */
function getPackageName( file ) {
	return path.relative( PACKAGES_DIR, file ).split( path.sep )[ 0 ];
}

const isJsFile = ( filepath ) => {
	return /.\.js$/.test( filepath );
};

const isScssFile = ( filepath ) => {
	return /.\.scss$/.test( filepath );
};

/**
 * Get Build Path for a specified file
 *
 * @param  {string} file        File to build
 * @param  {string} buildFolder Output folder
 * @return {string}             Build path
 */
function getBuildPath( file, buildFolder ) {
	const pkgName = getPackageName( file );
	const pkgSrcPath = path.resolve( PACKAGES_DIR, pkgName, SRC_DIR );
	const pkgBuildPath = path.resolve( PACKAGES_DIR, pkgName, buildFolder );
	const relativeToSrcPath = path.relative( pkgSrcPath, file );
	return path.resolve( pkgBuildPath, relativeToSrcPath );
}

/**
 * Given a list of scss and js filepaths, divide them into sets them and rebuild.
 *
 * @param {Array} files list of files to rebuild
 *
 * @return {Promise} Promise resolving when files are built.
 */
function buildFiles( files ) {
	// Reduce files into a unique sets of javaScript files and scss packages.
	const buildPaths = files.reduce( ( accumulator, filePath ) => {
		if ( isJsFile( filePath ) ) {
			accumulator.jsFiles.add( filePath );
		} else if ( isScssFile( filePath ) ) {
			const pkgName = getPackageName( filePath );
			const pkgPath = path.resolve( PACKAGES_DIR, pkgName );
			accumulator.scssPackagePaths.add( pkgPath );
		}
		return accumulator;
	}, { jsFiles: new Set(), scssPackagePaths: new Set() } );

	return Promise.all( [
		...buildPaths.jsFiles.map( buildJsFile ),
		...buildPaths.scssPackagePaths.map( buildPackageScss ),
	] );
}

/**
 * Build a javaScript file for the required environments (node and ES5)
 *
 * @param {string} file    File path to build
 * @param {boolean} silent Show logs
 *
 * @return {Promise} Promise resolving when file is built.
 */
function buildJsFile( file, silent ) {
	return Promise.all( [
		buildJsFileFor( file, silent, 'main' ),
		buildJsFileFor( file, silent, 'module' ),
	] );
}

/**
 * Build a package's scss styles
 *
 * @param {string} packagePath The path to the package.
 *
 * @return {Promise} Promise resolving when file is built.
 */
async function buildPackageScss( packagePath ) {
	const srcDir = path.resolve( packagePath, SRC_DIR );
	const scssFiles = await glob( `${ srcDir }/*.scss` );

	// Build scss files individually.
	return Promise.all( scssFiles.map( buildScssFile ) );
}

async function buildScssFile( styleFile ) {
	const outputFile = getBuildPath( styleFile.replace( '.scss', '.css' ), BUILD_DIR.style );
	const outputFileRTL = getBuildPath( styleFile.replace( '.scss', '-rtl.css' ), BUILD_DIR.style );

	await mkdirp( path.dirname( outputFile ) );

	const contents = await readFile( styleFile, 'utf8' );
	const builtSass = await renderSass( {
		file: styleFile,
		includePaths: [ path.resolve( __dirname, '../../assets/stylesheets' ) ],
		data: (
			[
				'colors',
				'breakpoints',
				'variables',
				'mixins',
				'animations',
				'z-index',
			].map( ( imported ) => `@import "${ imported }";` ).join( ' ' )	+
			contents
		),
	} );

	const result = await postcss( require( './post-css-config' ) ).process( builtSass.css, {
		from: 'src/app.css',
		to: 'dest/app.css',
	} );

	const resultRTL = await postcss( [ require( 'rtlcss' )() ] ).process( result.css, {
		from: 'src/app.css',
		to: 'dest/app.css',
	} );

	await writeFile( outputFile, result.css );
	await writeFile( outputFileRTL, resultRTL.css );
}

/**
 * Build a file for a specific environment
 *
 * @param {string}  file        File path to build
 * @param {boolean} silent      Show logs
 * @param {string}  environment Dist environment (node or es5)
 */
async function buildJsFileFor( file, silent, environment ) {
	const buildDir = BUILD_DIR[ environment ];
	const destPath = getBuildPath( file, buildDir );
	const babelOptions = getBabelConfig( environment );
	babelOptions.sourceMaps = true;
	babelOptions.sourceFileName = file;

	await mkdirp( path.dirname( destPath ) );
	const transformed = await transformFile( file, babelOptions );
	writeFile( destPath + '.map', JSON.stringify( transformed.map ) );
	writeFile( destPath, transformed.code + '\n//# sourceMappingURL=' + path.basename( destPath ) + '.map' );

	if ( ! silent ) {
		process.stdout.write(
			chalk.green( '  \u2022 ' ) +
				path.relative( PACKAGES_DIR, file ) +
				chalk.green( ' \u21D2 ' ) +
				path.relative( PACKAGES_DIR, destPath ) +
				'\n'
		);
	}
}

/**
 * Build the provided package path
 *
 * @param {string} packagePath absolute package path
 */
async function buildPackage( packagePath ) {
	const srcDir = path.resolve( packagePath, SRC_DIR );
	const jsFiles = await glob( `${ srcDir }/**/*.js`, {
		ignore: [
			`${ srcDir }/**/test/**/*.js`,
			`${ srcDir }/**/__mocks__/**/*.js`,
		],
		nodir: true,
	} );

	await Promise.all( [
		// Build js files individually.
		...jsFiles.map( ( file ) => buildJsFile( file, true ) ),

		// Build package CSS files
		buildPackageScss( packagePath ),
	] );

	process.stdout.write( `${ path.basename( packagePath ) }\n` );
	process.stdout.write( `${ DONE }\n` );
}

const files = process.argv.slice( 2 );

if ( files.length ) {
	buildFiles( files );
} else {
	process.stdout.write( chalk.inverse( '>> Building packages \n' ) );
	Promise.all( getPackages().map( buildPackage ) ).then( () => {
		process.stdout.write( '\n' );
	} );
}
