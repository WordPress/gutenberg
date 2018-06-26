/**
 * script to build WordPress packages into `build/` directory.
 *
 * Example:
 *  node ./scripts/build.js
 */

/**
 * External Dependenceis
 */
const fs = require( 'fs' );
const path = require( 'path' );
const glob = require( 'glob' );
const babel = require( 'babel-core' );
const chalk = require( 'chalk' );
const mkdirp = require( 'mkdirp' );

/**
 * Module Constants
 */
const PACKAGES_DIR = path.resolve( __dirname, '../packages' );
const SRC_DIR = 'src';
const BUILD_DIR = {
	main: 'build',
	module: 'build-module',
};
const DONE = chalk.reset.inverse.bold.green( ' DONE ' );
const ERROR = chalk.reset.inverse.bold.red( ' ERROR ' );

/**
 * Babel Configuration
 */
const babelDefaultConfig = require( '../packages/babel-preset-default' );
babelDefaultConfig.babelrc = false;
const presetEnvConfig = babelDefaultConfig.presets[ 0 ][ 1 ];
const babelConfigs = {
	main: Object.assign(
		{},
		babelDefaultConfig,
		{ presets: [
			[ 'env', Object.assign(
				{},
				presetEnvConfig,
				{ modules: 'commonjs' },
			) ],
		] }
	),
	module: babelDefaultConfig,
};

/**
 * Returns the absolute path of all WordPress packages
 *
 * @return {Array} Package paths
 */
function getAllPackages() {
	return fs
		.readdirSync( PACKAGES_DIR )
		.map( ( file ) => path.resolve( PACKAGES_DIR, file ) )
		.filter( ( f ) => fs.lstatSync( path.resolve( f ) ).isDirectory() );
}

/**
 * Get the package name for a specified file
 *
 * @param  {String} file File name
 * @return {String}      Package name
 */
function getPackageName( file ) {
	return path.relative( PACKAGES_DIR, file ).split( path.sep )[ 0 ];
}

/**
 * Get Build Path for a specified file
 *
 * @param  {String} file        File to build
 * @param  {String} buildFolder Output folder
 * @return {String}             Build path
 */
function getBuildPath( file, buildFolder ) {
	const pkgName = getPackageName( file );
	const pkgSrcPath = path.resolve( PACKAGES_DIR, pkgName, SRC_DIR );
	const pkgBuildPath = path.resolve( PACKAGES_DIR, pkgName, buildFolder );
	const relativeToSrcPath = path.relative( pkgSrcPath, file );
	return path.resolve( pkgBuildPath, relativeToSrcPath );
}

/**
 * Build a file for the required environments (node and ES5)
 *
 * @param {String} file    File path to build
 * @param {Boolean} silent Show logs
 */
function buildFile( file, silent ) {
	buildFileFor( file, silent, 'main' );
	buildFileFor( file, silent, 'module' );
}

/**
 * Build a file for a specific environment
 *
 * @param {String}  file        File path to build
 * @param {Boolean} silent      Show logs
 * @param {String}  environment Dist environment (node or es5)
 */
function buildFileFor( file, silent, environment ) {
	const buildDir = BUILD_DIR[ environment ];
	const destPath = getBuildPath( file, buildDir );
	const babelOptions = babelConfigs[ environment ];

	mkdirp.sync( path.dirname( destPath ) );
	const transformed = babel.transformFileSync( file, babelOptions ).code;
	fs.writeFileSync( destPath, transformed );
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
 * @param {String} packagePath absolute package path
 */
function buildPackage( packagePath ) {
	const srcDir = path.resolve( packagePath, SRC_DIR );
	const packageFile = packagePath + '/package.json';
	const files = glob.sync( srcDir + '/**/*.js', { nodir: true } )
		.filter( file => ! /\.test\.js/.test( file ) );

	process.stdout.write( `${ path.basename( packagePath ) }\n` );

	const config = require( packageFile );
	if ( ! config.publishConfig || 'public' !== config.publishConfig.access ) {
		process.stdout.write( `${ ERROR } package.json must include "publishConfig": { "access": "public" }\n` );
		process.exitCode = 1;
	}

	files.forEach( file => buildFile( file, true ) );
	process.stdout.write( `${ DONE }\n` );
}

process.stdout.write( chalk.inverse( '>> Building packages \n' ) );
getAllPackages()
	.forEach( buildPackage );
process.stdout.write( '\n' );
