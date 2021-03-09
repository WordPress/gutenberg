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
		/.\.(js|json|scss)$/.test( filename ) &&
		/\/src\/.+/.test( filename ) &&
		! [
			/\/(benchmark|__mocks__|__tests__|test|storybook|stories)\/.+/,
			/.\.(spec|test)\.js$/,
		].some( ( regex ) => regex.test( filename ) );

	return isSource ? true : skip;
};

function getSrcDirectory( filename ) {
	const matches = /packages\/.+\/src(\/.+)/g.exec( filename );
	if ( ! matches || matches?.length < 2 ) {
		return;
	}
	const [ , pathAfterSrc ] = matches;
	const position = filename.indexOf( pathAfterSrc );
	return filename.substr( 0, position );
}

const rebuild = ( filename ) => filesToBuild.set( filename, true );

watch(
	PACKAGES_DIR,
	{ recursive: true, delay: 500, filter: isSourceFile },
	( event, filename ) => {
		const filePath = path.resolve( PACKAGES_DIR, filename );
		// There are two event types, 'update' and 'remove'.
		if ( event === 'update' && exists( filePath ) ) {
			console.log( chalk.green( '->' ), `${ event }: ${ filePath }` );
			rebuild( filePath );
		} else {
			const srcDir = getSrcDirectory( filePath );
			const buildFile = path.resolve( srcDir, '..', 'build', filename );
			try {
				fs.unlinkSync( buildFile );
				process.stdout.write(
					chalk.red( '  \u2022 ' ) +
						path.relative(
							path.resolve( srcDir, '..', '..' ),
							buildFile
						) +
						' (deleted)' +
						'\n'
				);
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
