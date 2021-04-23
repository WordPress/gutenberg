/**
 * External dependencies
 */
const fs = require( 'fs' );
const watch = require( 'node-watch' );
const { spawn } = require( 'child_process' );
const path = require( 'path' );
const chalk = require( 'chalk' );

/**
 * Internal dependencies
 */
const getPackages = require( './get-packages' );
const BUILD_SCRIPT = path.resolve( __dirname, './build.js' );
const PACKAGES_DIR = path.resolve( __dirname, '../../packages' );
const modulePackages = getPackages();

let filesToBuild = new Map();

/**
 * Determines whether a file exists.
 *
 * @param {string} filename
 *
 * @return {boolean} True if a file exists.
 */
function exists( filename ) {
	try {
		return fs.statSync( filename ).isFile();
	} catch ( e ) {}
	return false;
}

/**
 * Determine if a file is source code.
 *
 * Exclude test files including .js files inside of __tests__ or test folders
 * and files with a suffix of .test or .spec (e.g. blocks.test.js),
 * and deceitful source-like files, such as editor swap files.
 *
 * @param {string} filename
 *
 * @return {boolean} True if the file a source file.
 */
function isSourceFile( filename ) {
	return (
		/\/src\/.+\.(js|json|scss)$/.test( filename ) &&
		! [
			/\/(benchmark|__mocks__|__tests__|test|storybook|stories)\/.+/,
			/.\.(spec|test)\.js$/,
		].some( ( regex ) => regex.test( filename ) )
	);
}

/**
 * Determine if a file is in a module package.
 *
 * getPackages only returns packages that have a package.json with the module
 * field. Only build these packages.
 *
 * @param {string} filename
 *
 * @return {boolean} True if the file is in a module package.
 */
function isModulePackage( filename ) {
	return modulePackages.some( ( packagePath ) => {
		return filename.indexOf( packagePath ) > -1;
	} );
}

/**
 * Is the file something the watch task should monitor or skip?
 *
 * @param {string} filename
 * @param {symbol} skip
 *
 * @return {boolean | symbol} True if the file should be watched.
 */
function isWatchableFile( filename, skip ) {
	return isSourceFile( filename ) && isModulePackage( filename )
		? true
		: skip;
}

/**
 * Returns the associated file in the build folder for a given source file.
 *
 * @param {string} srcFile
 *
 * @return {string} Path to the build file.
 */
function getBuildFile( srcFile ) {
	// Could just use string.replace, but the user might have the project
	// checked out and nested under another src folder.
	const packageDir = srcFile.substr( 0, srcFile.lastIndexOf( '/src/' ) );
	const filePath = srcFile.substr( srcFile.lastIndexOf( '/src/' ) + 5 );
	return path.resolve( packageDir, 'build', filePath );
}

/**
 * Adds a build file to the set of files that should be rebuilt.
 *
 * @param {'update'} event The event name
 * @param {string} filename
 */
function updateBuildFile( event, filename ) {
	if ( exists( filename ) ) {
		try {
			console.log( chalk.green( '->' ), `${ event }: ${ filename }` );
			filesToBuild.set( filename, true );
		} catch ( e ) {
			console.log(
				chalk.red( 'Error:' ),
				`Unable to update file: ${ filename } - `,
				e
			);
		}
	}
}

/**
 * Removes a build file from the build folder
 * (usually triggered the associated source file was deleted)
 *
 * @param {'remove'} event The event name
 * @param {string} filename
 */
function removeBuildFile( event, filename ) {
	const buildFile = getBuildFile( filename );
	if ( exists( buildFile ) ) {
		try {
			fs.unlink( buildFile, () => {
				console.log( chalk.red( '<-' ), `${ event }: ${ filename }` );
			} );
		} catch ( e ) {
			console.log(
				chalk.red( 'Error:' ),
				`Unable to remove build file: ${ filename } - `,
				e
			);
		}
	}
}

// Start watching packages.
watch(
	PACKAGES_DIR,
	{ recursive: true, delay: 500, filter: isWatchableFile },
	( event, filename ) => {
		switch ( event ) {
			case 'update':
				updateBuildFile( event, filename );
				break;
			case 'remove':
				removeBuildFile( event, filename );
				break;
		}
	}
);

// Run a separate interval that calls the build script.
// This effectively acts as a throttle for building files.
setInterval( () => {
	const files = Array.from( filesToBuild.keys() );
	if ( files.length ) {
		filesToBuild = new Map();
		try {
			spawn( 'node', [ BUILD_SCRIPT, ...files ], { stdio: [ 0, 1, 2 ] } );
		} catch ( e ) {}
	}
}, 100 );

console.log( chalk.red( '->' ), chalk.cyan( 'Watching for changes...' ) );
