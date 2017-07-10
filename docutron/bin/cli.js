#!/usr/bin/env node

/**
 * External Dependencies
 */
const path = require( 'path' );
const childProcess = require( 'child_process' );

const command = process.argv[ 2 ];
const docsFolder = process.argv[ 3 ] || 'docs';

if ( command === 'start' ) {
	childProcess.execSync( 'node ' + path.resolve( __dirname, 'start.js ' + docsFolder ), { stdio: [ 0, 1, 2 ] } );
} else if ( command === 'build' ) {
	childProcess.execSync( 'node ' + path.resolve( __dirname, 'build.js ' + docsFolder ), { stdio: [ 0, 1, 2 ] } );
	childProcess.execSync( 'cd ' + path.resolve( __dirname, '../' ) + ' && ./node_modules/.bin/react-snapshot', { stdio: [ 0, 1, 2 ] } );
} else {
	console.error( 'Unknown command ' + command ); // eslint-disable-line no-console
	process.exit( 1 );
}
