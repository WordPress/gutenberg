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
 * Is the path name a directory?
 *
 * @param {string} pathname
 *
 * @return {boolean} True if the given path is a directory.
 */
function isDirectory( pathname ) {
	try {
		return fs.statSync( pathname ).isDirectory();
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
	// Only run this regex on the relative path, otherwise we might run
	// into some false positives when eg. the project directory contains `src`
	const relativePath = path.relative( process.cwd(), filename );

	return (
		/\/src\/.+\.(js|json|scss)$/.test( relativePath ) &&
		! [
			/\/(benchmark|__mocks__|__tests__|test|storybook|stories)\/.+/,
			/.\.(spec|test)\.js$/,
		].some( ( regex ) => regex.test( relativePath ) )
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
	// Recursive file watching is not available on a Linux-based OS. If this is the case,
	// the watcher library falls back to watching changes in the subdirectories
	// and passes the directories to this filter callback instead.
	if ( isDirectory( filename ) ) {
		return true;
	}

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
		// Double check whether we're dealing with a file that needs watching, to accomodate for
		// the inability to watch recursively on linux-based operating systems.
		if ( ! isSourceFile( filename ) || ! isModulePackage( filename ) ) {
			return;
		}

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
