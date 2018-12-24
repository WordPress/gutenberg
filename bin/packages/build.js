/**
 * script to build WordPress packages into `build/` directory.
 *
 * Example:
 *  node ./scripts/build.js
 */

/**
 * External dependencies
 */
const sass = require( 'node-sass' );
const fs = require( 'fs' ).promises;
const path = require( 'path' );
const glob = require( 'glob' );
const babel = require( '@babel/core' );
const chalk = require( 'chalk' );
const postcss = require( 'postcss' );
const rtlcss = require( 'rtlcss' );

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
const ERROR = chalk.reset.inverse.bold.red( ' ERROR ' );
const START = chalk.reset.inverse.bold.blue( ' START ' );
const DONE = chalk.reset.inverse.bold.green( ' DONE ' );

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

const promisify = ( nodeStyleFunc ) => ( ...args ) => {
	return new Promise( ( resolve, reject ) => {
		nodeStyleFunc( ...args, ( error, result ) => {
			if ( error ) {
				reject( error );
			} else {
				resolve( result );
			}
		} );
	} );
};

const globPromise = promisify( glob );
const sassPromise = promisify( sass.render );
const babelTransformPromise = promisify( babel.transformFile );

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

	buildPaths.jsFiles.forEach( buildJsFile );
	buildPaths.scssPackagePaths.forEach( buildPackageScss );
}

/**
 * Build a javaScript file for the required environments (node and ES5)
 *
 * @param {string} file    File path to build
 * @param {boolean} silent Show logs
 */
async function buildJsFile( file, silent ) {
	await Promise.all( [
		buildJsFileFor( file, silent, 'main' ),
		buildJsFileFor( file, silent, 'module' ),
	] );
}

async function buildPackageScss( packagePath ) {
	const srcDir = path.resolve( packagePath, SRC_DIR );
	const scssFiles = await globPromise( `${ srcDir }/*.scss` );

	if ( ! scssFiles.length ) {
		return;
	}

	const postCSSConfig = require( './post-css-config' );
	// Build scss files individually.
	await Promise.all( scssFiles.map( ( file ) => buildScssFile( file, postCSSConfig ) ) );
}

async function buildPackageJs( packagePath ) {
	const srcDir = path.resolve( packagePath, SRC_DIR );
	const jsFiles = await globPromise( `${ srcDir }/**/*.js`, {
		ignore: [
			`${ srcDir }/**/test/**/*.js`,
			`${ srcDir }/**/__mocks__/**/*.js`,
		],
		nodir: true,
	} );

	// Build js files individually.
	await Promise.all( jsFiles.map( ( file ) => buildJsFile( file, true ) ) );
}

async function buildScssFile( styleFile, postCSSConfig ) {
	const outputFile = getBuildPath( styleFile.replace( '.scss', '.css' ), BUILD_DIR.style );
	const outputFileRTL = getBuildPath( styleFile.replace( '.scss', '-rtl.css' ), BUILD_DIR.style );
	const scssStyles = await fs.readFile( styleFile, 'utf8' );
	const builtSass = await sassPromise( {
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
			].map( ( imported ) => `@import "${ imported }";` ).join( ' ' )	+ scssStyles
		),
	} );

	const ltrCSS = await postcss( postCSSConfig )
		.process( builtSass.css, { from: 'src/app.css', to: 'dest/app.css' } );

	const rtlCSS = await postcss( [ rtlcss() ] )
		.process( ltrCSS, { from: 'src/app.css', to: 'dest/app.css' } );

	await fs.mkdir( path.dirname( outputFile ), { recursive: true } );

	await Promise.all( [
		fs.writeFile( outputFile, ltrCSS ),
		fs.writeFile( outputFileRTL, rtlCSS ),
	] );
}

async function buildJsFileFor( file, silent, environment ) {
	const buildDir = BUILD_DIR[ environment ];
	const destPath = getBuildPath( file, buildDir );
	const babelOptions = getBabelConfig( environment );
	babelOptions.sourceMaps = true;
	babelOptions.sourceFileName = file;

	const transformed = await babelTransformPromise( file, babelOptions );
	await fs.mkdir( path.dirname( destPath ), { recursive: true } );
	await Promise.all( [
		fs.writeFile( destPath + '.map', JSON.stringify( transformed.map ) ),
		fs.writeFile( destPath, transformed.code + '\n//# sourceMappingURL=' + path.basename( destPath ) + '.map' ),
	] );

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

function buildPackage( packagePath ) {
	const packageName = path.basename( packagePath );
	process.stdout.write( `${ START } ${ packageName }\n` );
	return Promise.all( [ buildPackageJs( packagePath ), buildPackageScss( packagePath ) ] )
		.then( () => {
			process.stdout.write( `${ DONE } ${ packageName }\n` );
			return 1;
		} )
		.catch( ( error ) => {
			process.stdout.write( `${ ERROR } ${ packageName }\n ${ error }\n` );
			return 0;
		} );
}

const files = process.argv.slice( 2 );

if ( files.length ) {
	buildFiles( files );
} else {
	const packages = getPackages();
	Promise.all( packages.map( ( packagePath ) => buildPackage( packagePath ) ) )
		.then( ( buildResults ) => {
			const successfulPackageCount = buildResults.reduce( ( total, result ) => total + result, 0 );
			process.stdout.write( `${ chalk.reset.inverse.bold.green( ` BUILD COMPLETE ${ successfulPackageCount }/${ packages.length } ` ) }\n` );
		} )
		.catch( ( error ) => {
			throw error;
		} );
}
