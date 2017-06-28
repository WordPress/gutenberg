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
	browser: 'build-browser',
};
const OK = chalk.reset.inverse.bold.green( ' DONE ' );

/**
 * Babel Configuration
 */
const babelDefaultConfig = JSON.parse(
	fs.readFileSync( path.resolve( __dirname, '..', '.babelrc' ), 'utf8' )
);
babelDefaultConfig.babelrc = false;
const presetEnvConfig = babelDefaultConfig.presets[ 0 ][ 1 ];
const babelConfigs = {
	main: babelDefaultConfig,
	module: Object.assign(
		{},
		babelDefaultConfig,
		{ presets: [
			[ "env", Object.assign( {},
					presetEnvConfig,
					{ modules: false }
			) ],
		] }
	),
	browser: Object.assign(
		{},
		babelDefaultConfig,
		{ plugins: [ ...babelDefaultConfig.plugins, 'transform-runtime' ] }
	)
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
function getPackageName(file) {
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
	buildFileFor( file, silent, 'browser' );
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
	fs.writeFileSync(destPath, transformed);
	if ( ! silent ) {
		process.stdout.write(
			chalk.green('  \u2022 ') +
				path.relative(PACKAGES_DIR, file) +
				chalk.green(' \u21D2 ') +
				path.relative(PACKAGES_DIR, destPath) +
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
	const pattern = path.resolve( srcDir, '**/*' );
	const files = glob.sync( pattern, { nodir: true } );

	process.stdout.write( `${ path.basename( packagePath ) }\n` );

	files.forEach( file => buildFile( file, true ) );
	process.stdout.write( `${ OK }\n` );
}

process.stdout.write( chalk.inverse( '>> Building packages \n' ) );
getAllPackages()
	.forEach( buildPackage );
process.stdout.write('\n');
