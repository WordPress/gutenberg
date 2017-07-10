#!/usr/bin/env node
const path = require( 'path' );
const childProcess = require( 'child_process' );
const command = process.argv[ 2 ];

if ( command === 'start' ) {
	require( './start' );
} else if ( command === 'build' ) {
	childProcess.execSync( 'node ' + path.resolve( __dirname, 'build.js' ), { stdio: [ 0, 1, 2 ] } );
	childProcess.execSync( 'cd ' + path.resolve( __dirname, '../' ) + ' && ./node_modules/.bin/react-snapshot', { stdio: [ 0, 1, 2 ] } );
} else {
	console.error( 'Unknown command ' + command ); // eslint-disable-line no-console
	process.exit( 1 );
}
