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
const BUILD_SCRIPT = path.resolve( __dirname, './build.js' );

const PACKAGES_DIR = path.resolve( __dirname, '../../packages' );

let filesToBuild = new Map();

const exists = ( filename ) => {
	try {
		return fs.statSync( filename ).isFile();
	} catch ( e ) {}
	return false;
};

// Exclude test files including .js files inside of __tests__ or test folders
// and files with a suffix of .test or .spec (e.g. blocks.test.js),
// and deceitful source-like files, such as editor swap files.
const isSourceFile = ( filename, skip ) => {
	const isSource =
		/\/src\/.+\.(js|json|scss)$/.test( filename ) &&
		! [
			/\/(benchmark|__mocks__|__tests__|test|storybook|stories)\/.+/,
			/.\.(spec|test)\.js$/,
		].some( ( regex ) => regex.test( filename ) );

	return isSource ? true : skip;
};

function getBuildFile( srcFile ) {
	const packageDir = srcFile.substr( 0, srcFile.indexOf( '/src/' ) );
	const filePath = srcFile.substr( srcFile.indexOf( '/src/' ) + 5 );
	return path.resolve( packageDir, 'build', filePath );
}

const rebuild = ( filename ) => filesToBuild.set( filename, true );

watch(
	PACKAGES_DIR,
	{ recursive: true, delay: 500, filter: isSourceFile },
	( event, filename ) => {
		// There are two event types, 'update' and 'remove'.
		if ( event === 'update' && exists( filename ) ) {
			console.log( chalk.green( '->' ), `${ event }: ${ filename }` );
			rebuild( filename );
		} else {
			const buildFile = getBuildFile( filename );
			try {
				fs.unlinkSync( buildFile );
				console.log( chalk.red( '<-' ), `${ event }: ${ filename }` );
			} catch ( e ) {}
		}
	}
);

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
