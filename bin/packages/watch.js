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
const isSourceFile = ( filename ) => {
	return ! [ /\/(benchmark|__mocks__|__tests__|test|storybook|stories)\/.+.js$/, /.\.(spec|test)\.js$/ ].some( ( regex ) => regex.test( filename ) ) && /.\.(js|json|scss)$/.test( filename );
};

const rebuild = ( filename ) => filesToBuild.set( filename, true );

getPackages().forEach( ( p ) => {
	const srcDir = path.resolve( p, 'src' );
	try {
		fs.accessSync( srcDir, fs.F_OK );
		watch( path.resolve( p, 'src' ), { recursive: true }, ( event, filename ) => {
			if ( ! isSourceFile( filename ) ) {
				return;
			}

			const filePath = path.resolve( srcDir, filename );
			if ( ( event === 'update' ) && exists( filePath ) ) {
				// eslint-disable-next-line no-console
				console.log( chalk.green( '->' ), `${ event }: ${ filename }` );
				rebuild( filePath );
			} else {
				const buildFile = path.resolve( srcDir, '..', 'build', filename );
				try {
					fs.unlinkSync( buildFile );
					process.stdout.write(
						chalk.red( '  \u2022 ' ) +
              path.relative( path.resolve( srcDir, '..', '..' ), buildFile ) +
              ' (deleted)' +
              '\n'
					);
				} catch ( e ) {}
			}
		} );
	} catch ( e ) {
		// doesn't exist
	}
} );

setInterval( () => {
	const files = Array.from( filesToBuild.keys() );
	if ( files.length ) {
		filesToBuild = new Map();
		try {
			spawn( 'node', [ BUILD_SCRIPT, ...files ], { stdio: [ 0, 1, 2 ] } );
		} catch ( e ) {}
	}
}, 100 );

// eslint-disable-next-line no-console
console.log( chalk.red( '->' ), chalk.cyan( 'Watching for changes...' ) );
